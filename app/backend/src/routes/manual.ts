import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole, canManageContent } from "../lib/rbac.js";

// Operations Manual (운영 매뉴얼). Staff + franchise owners read manuals;
// managers (admin/educator) author them. All content is DATA (CLAUDE.md §6).
//
// targetRoles is a JSON array of role keys. [] means "everyone". A "필독"
// (isRequired) manual tracks a per-user read receipt for the current version,
// so a manager can see who has / hasn't acknowledged the latest content.

function visibleToRole(targetRoles: string, roleKey: string): boolean {
  try {
    const arr = JSON.parse(targetRoles || "[]");
    if (!Array.isArray(arr) || arr.length === 0) return true; // [] = everyone
    return arr.includes(roleKey);
  } catch {
    return true;
  }
}

export async function manualRoutes(app: FastifyInstance) {
  // ----- Staff / owner facing -------------------------------------------

  // List published manuals visible to me, grouped by category, with read state.
  app.get("/api/manuals", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const q = ((req.query as { q?: string })?.q ?? "").toString().trim().toLowerCase();

    const categories = await prisma.manualCategory.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        manuals: {
          where: { isPublished: true },
          orderBy: { order: "asc" },
          include: { readReceipts: { where: { userId: user.id } } },
        },
      },
    });

    return categories
      .map((c) => ({
        id: c.id,
        name: c.name,
        manuals: c.manuals
          .filter((m) => visibleToRole(m.targetRoles, user.roleKey))
          .filter(
            (m) =>
              !q ||
              m.title.toLowerCase().includes(q) ||
              (m.summary ?? "").toLowerCase().includes(q),
          )
          .map((m) => {
            const r = m.readReceipts[0];
            return {
              id: m.id,
              title: m.title,
              summary: m.summary,
              isRequired: m.isRequired,
              version: m.version,
              read: !!r && r.version >= m.version,
            };
          }),
      }))
      .filter((c) => c.manuals.length > 0);
  });

  // Manual detail.
  app.get("/api/manuals/:id", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const m = await prisma.manual.findUnique({
      where: { id },
      include: { category: true, readReceipts: { where: { userId: user.id } } },
    });
    if (!m || !m.isPublished || !visibleToRole(m.targetRoles, user.roleKey)) {
      return reply.code(404).send({ error: "not_found" });
    }
    const r = m.readReceipts[0];
    return {
      id: m.id,
      title: m.title,
      summary: m.summary,
      content: m.content,
      categoryName: m.category.name,
      isRequired: m.isRequired,
      version: m.version,
      updatedAt: m.updatedAt,
      read: !!r && r.version >= m.version,
    };
  });

  // Acknowledge read (필독 확인) for the current version.
  app.post("/api/manuals/:id/read", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const m = await prisma.manual.findUnique({ where: { id } });
    if (!m || !m.isPublished || !visibleToRole(m.targetRoles, user.roleKey)) {
      return reply.code(404).send({ error: "not_found" });
    }
    await prisma.manualReadReceipt.upsert({
      where: { manualId_userId: { manualId: id, userId: user.id } },
      create: { manualId: id, userId: user.id, version: m.version },
      update: { version: m.version, readAt: new Date() },
    });
    return { ok: true };
  });

  // ----- Admin (manage content) -----------------------------------------
  const guard = requireRole(...canManageContent);

  // Full tree incl. unpublished, with read counts.
  app.get("/api/admin/manuals", { preHandler: guard }, async () => {
    return prisma.manualCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        manuals: {
          orderBy: { order: "asc" },
          include: { _count: { select: { readReceipts: true } } },
        },
      },
    });
  });

  const categoryBody = z.object({
    name: z.string().min(1),
    order: z.number().int().optional(),
    isActive: z.boolean().optional(),
  });
  app.post("/api/admin/manual-categories", { preHandler: guard }, async (req, reply) => {
    const p = categoryBody.safeParse(req.body);
    if (!p.success) return reply.code(400).send({ error: "invalid_input" });
    return prisma.manualCategory.create({ data: p.data });
  });
  app.patch("/api/admin/manual-categories/:id", { preHandler: guard }, async (req) => {
    const { id } = req.params as { id: string };
    return prisma.manualCategory.update({ where: { id }, data: categoryBody.partial().parse(req.body) });
  });

  const manualBody = z.object({
    categoryId: z.string(),
    title: z.string().min(1),
    summary: z.string().optional(),
    content: z.string().optional(),
    targetRoles: z.array(z.string()).optional(),
    isRequired: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    order: z.number().int().optional(),
  });

  app.post("/api/admin/manuals", { preHandler: guard }, async (req, reply) => {
    const p = manualBody.safeParse(req.body);
    if (!p.success) return reply.code(400).send({ error: "invalid_input" });
    const { targetRoles, ...rest } = p.data;
    return prisma.manual.create({
      data: {
        ...rest,
        targetRoles: JSON.stringify(targetRoles ?? []),
        authorId: req.sessionUser?.id ?? null,
      },
    });
  });

  app.patch("/api/admin/manuals/:id", { preHandler: guard }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = manualBody.partial().safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_input" });
    const existing = await prisma.manual.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "not_found" });

    const { targetRoles, ...rest } = parsed.data;
    const data: Record<string, unknown> = { ...rest };
    if (targetRoles) data.targetRoles = JSON.stringify(targetRoles);
    // Bump version when the body content changes → readers must re-acknowledge.
    if (rest.content !== undefined && rest.content !== existing.content) {
      data.version = existing.version + 1;
    }
    return prisma.manual.update({ where: { id }, data });
  });

  // Read stats: who in the target audience has / hasn't acknowledged.
  app.get("/api/admin/manuals/:id/reads", { preHandler: guard }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const m = await prisma.manual.findUnique({ where: { id }, include: { readReceipts: true } });
    if (!m) return reply.code(404).send({ error: "not_found" });

    const users = await prisma.user.findMany({ where: { isActive: true }, include: { role: true } });
    const audience = users.filter((u) => visibleToRole(m.targetRoles, u.role.key));
    const readMap = new Map(m.readReceipts.map((r) => [r.userId, r]));
    const rows = audience.map((u) => {
      const r = readMap.get(u.id);
      return {
        userId: u.id,
        name: u.name,
        roleName: u.role.name,
        read: !!r && r.version >= m.version,
        readAt: r?.readAt ?? null,
      };
    });
    return {
      title: m.title,
      version: m.version,
      total: rows.length,
      readCount: rows.filter((r) => r.read).length,
      rows,
    };
  });
}
