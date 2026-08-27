import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth } from "../lib/rbac.js";
import { bumpSkillCount } from "../lib/growth.js";

const submitSchema = z.object({
  assignmentId: z.string().optional(),
  lessonId: z.string().optional(),
  skillId: z.string().optional(),
  customerCaseId: z.string().optional(),
  evidence: z.string().default(""),
  reflection: z.string().default(""),
});

export async function practiceRoutes(app: FastifyInstance) {
  // Designer's own practices.
  app.get("/api/designer/practices", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const rows = await prisma.practice.findMany({
      where: { userId: user.id },
      orderBy: { submittedAt: "desc" },
      include: { skill: true, assignment: true, lesson: true, evaluations: true },
    });
    return rows.map((p) => ({
      id: p.id,
      skillName: p.skill?.name ?? null,
      assignmentTitle: p.assignment?.title ?? null,
      lessonTitle: p.lesson?.title ?? null,
      evidence: p.evidence,
      reflection: p.reflection,
      status: p.status,
      submittedAt: p.submittedAt,
      evaluated: p.evaluations.length > 0,
    }));
  });

  // STEP 5: submit a practice (turn learning into action).
  app.post("/api/designer/practices", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_input" });
    const d = parsed.data;

    const practice = await prisma.practice.create({
      data: {
        userId: user.id,
        assignmentId: d.assignmentId,
        lessonId: d.lessonId,
        skillId: d.skillId,
        customerCaseId: d.customerCaseId,
        evidence: d.evidence,
        reflection: d.reflection,
        status: "submitted",
      },
    });

    // Practice axis counter; if applied to a real customer, also Application.
    if (d.skillId) {
      await bumpSkillCount(user.id, d.skillId, "practiceCount");
      if (d.customerCaseId) await bumpSkillCount(user.id, d.skillId, "applicationCount");
    }
    return practice;
  });
}
