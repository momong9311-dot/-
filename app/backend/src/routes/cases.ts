import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole, canViewAdmin } from "../lib/rbac.js";
import { bumpSkillCount } from "../lib/growth.js";

// All CustomerCase fields are optional free-text (min PII). No name/phone/etc.
const caseBody = z.object({
  branchId: z.string().optional(),
  skillId: z.string().optional(),
  relatedSkillIds: z.array(z.string()).optional(),
  customerNeed: z.string().optional(),
  desiredImage: z.string().optional(),
  currentConcern: z.string().optional(),
  observation: z.string().optional(),
  diagnosis: z.string().optional(),
  problemDefinition: z.string().optional(),
  imageDirection: z.string().optional(),
  designGoal: z.string().optional(),
  dsLength: z.string().optional(),
  dsSilhouette: z.string().optional(),
  dsVolume: z.string().optional(),
  dsLine: z.string().optional(),
  dsWeight: z.string().optional(),
  dsTexture: z.string().optional(),
  dsCurl: z.string().optional(),
  dsParting: z.string().optional(),
  dsFringe: z.string().optional(),
  dsColor: z.string().optional(),
  dsReason: z.string().optional(),
  procedure: z.string().optional(),
  result: z.string().optional(),
  beforeRef: z.string().optional(),
  afterRef: z.string().optional(),
  designerReflection: z.string().optional(),
});

const CASE_INCLUDE = {
  skill: true,
  branch: true,
  relatedSkills: { include: { skill: true } },
  evaluations: { include: { skill: true, evaluator: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
  feedback: { include: { skill: true, author: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
} as const;

// Keep the join rows in sync with the requested related skill ids.
async function syncRelatedSkills(caseId: string, skillIds: string[] | undefined) {
  if (!skillIds) return;
  const unique = Array.from(new Set(skillIds));
  await prisma.customerCaseSkill.deleteMany({ where: { customerCaseId: caseId, skillId: { notIn: unique.length ? unique : ["__none__"] } } });
  for (const skillId of unique) {
    await prisma.customerCaseSkill.upsert({
      where: { customerCaseId_skillId: { customerCaseId: caseId, skillId } },
      create: { customerCaseId: caseId, skillId },
      update: {},
    });
  }
}

export async function caseRoutes(app: FastifyInstance) {
  // ----- Designer: my cases -----------------------------------------------
  app.get("/api/designer/cases", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const rows = await prisma.customerCase.findMany({
      where: { designerId: user.id },
      orderBy: { createdAt: "desc" },
      include: { skill: true, relatedSkills: { include: { skill: true } }, evaluations: true },
    });
    return rows.map((c) => ({
      id: c.id,
      status: c.status,
      skillName: c.skill?.name ?? null,
      customerNeed: c.customerNeed,
      diagnosis: c.diagnosis,
      createdAt: c.createdAt,
      completedAt: c.completedAt,
      evaluated: c.evaluations.length > 0,
      relatedSkills: c.relatedSkills.map((r) => r.skill.name),
    }));
  });

  app.post("/api/designer/cases", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const parsed = caseBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_input", detail: parsed.error.issues });
    const { relatedSkillIds, ...data } = parsed.data;
    const created = await prisma.customerCase.create({
      data: { ...data, designerId: user.id, branchId: data.branchId ?? user.branchId ?? undefined, status: "draft" },
    });
    await syncRelatedSkills(created.id, relatedSkillIds);
    return prisma.customerCase.findUnique({ where: { id: created.id }, include: CASE_INCLUDE });
  });

  app.get("/api/designer/cases/:id", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const c = await prisma.customerCase.findUnique({ where: { id }, include: { ...CASE_INCLUDE, designer: { select: { id: true, name: true } } } });
    if (!c) return reply.code(404).send({ error: "not_found" });
    // Owner, or a manager, may view. A plain designer cannot see others' cases.
    const manager = ["admin", "educator", "leader"].includes(user.roleKey);
    if (c.designerId !== user.id && !manager) return reply.code(403).send({ error: "forbidden" });
    return c;
  });

  app.patch("/api/designer/cases/:id", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const existing = await prisma.customerCase.findUnique({ where: { id } });
    if (!existing || existing.designerId !== user.id) return reply.code(404).send({ error: "not_found" });
    const parsed = caseBody.partial().safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_input" });
    const { relatedSkillIds, ...data } = parsed.data;
    await prisma.customerCase.update({ where: { id }, data });
    await syncRelatedSkills(id, relatedSkillIds);
    return prisma.customerCase.findUnique({ where: { id }, include: CASE_INCLUDE });
  });

  // Complete a case = it was actually applied to a customer. This is the ONLY
  // place the Application axis (applicationCount) is credited — and only once.
  app.post("/api/designer/cases/:id/complete", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const c = await prisma.customerCase.findUnique({ where: { id }, include: { relatedSkills: true } });
    if (!c || c.designerId !== user.id) return reply.code(404).send({ error: "not_found" });
    if (c.completedAt) return reply.code(400).send({ error: "already_completed" });

    await prisma.customerCase.update({ where: { id }, data: { status: "completed", completedAt: new Date() } });

    // Credit application to the primary skill + every related skill (deduped).
    const skillIds = new Set<string>();
    if (c.skillId) skillIds.add(c.skillId);
    for (const rs of c.relatedSkills) skillIds.add(rs.skillId);
    for (const skillId of skillIds) await bumpSkillCount(user.id, skillId, "applicationCount");

    return prisma.customerCase.findUnique({ where: { id }, include: CASE_INCLUDE });
  });

  // ----- Manager: cases to review (completed, not yet evaluated) -----------
  app.get("/api/manager/cases", { preHandler: requireRole(...canViewAdmin) }, async (req) => {
    const q = req.query as { status?: string };
    const where = q.status ? { status: q.status } : {};
    const rows = await prisma.customerCase.findMany({
      where,
      orderBy: { completedAt: "desc" },
      include: { skill: true, designer: { select: { id: true, name: true } }, evaluations: true },
    });
    return rows.map((c) => ({
      id: c.id,
      status: c.status,
      designerId: c.designer.id,
      designerName: c.designer.name,
      skillName: c.skill?.name ?? null,
      diagnosis: c.diagnosis,
      completedAt: c.completedAt,
      evaluated: c.evaluations.length > 0,
    }));
  });
}
