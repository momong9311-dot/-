import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole, canManageContent } from "../lib/rbac.js";

// Store System (매장 시스템). Daily store operations: open/close checklists
// performed per store per day, and store notices. All content is DATA.
// A branchId of null on a template/notice means it applies to all stores.

// Store-local day (KST, UTC+9) as YYYY-MM-DD.
function todayStr(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function parseIds(s: string): string[] {
  try {
    const a = JSON.parse(s || "[]");
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

export async function storeRoutes(app: FastifyInstance) {
  // ----- Staff facing ----------------------------------------------------

  // Overview for the user's store: notices + today's checklists with progress.
  app.get("/api/store/overview", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const branchId = user.branchId;
    const date = todayStr();

    const notices = await prisma.notice.findMany({
      where: {
        isPublished: true,
        OR: [{ branchId: null }, ...(branchId ? [{ branchId }] : [])],
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 20,
      include: { author: { select: { name: true } } },
    });

    let checklists: {
      id: string;
      name: string;
      type: string;
      total: number;
      checked: number;
      done: boolean;
    }[] = [];

    if (branchId) {
      const templates = await prisma.checklistTemplate.findMany({
        where: { isActive: true, OR: [{ branchId: null }, { branchId }] },
        orderBy: { order: "asc" },
        include: { items: true },
      });
      const runs = await prisma.checklistRun.findMany({
        where: { branchId, date, templateId: { in: templates.map((t) => t.id) } },
      });
      const runByTemplate = new Map(runs.map((r) => [r.templateId, r]));
      checklists = templates.map((t) => {
        const run = runByTemplate.get(t.id);
        const checked = run ? parseIds(run.checkedItemIds).filter((id) => t.items.some((i) => i.id === id)).length : 0;
        return {
          id: t.id,
          name: t.name,
          type: t.type,
          total: t.items.length,
          checked,
          done: t.items.length > 0 && checked >= t.items.length,
        };
      });
    }

    return {
      branchScoped: !!branchId,
      date,
      notices: notices.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        isPinned: n.isPinned,
        scope: n.branchId ? "store" : "all",
        author: n.author?.name ?? null,
        createdAt: n.createdAt,
      })),
      checklists,
    };
  });

  // A checklist's items + today's run for the user's store.
  app.get("/api/store/checklist/:templateId", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    if (!user.branchId) return reply.code(400).send({ error: "no_branch" });
    const { templateId } = req.params as { templateId: string };
    const date = todayStr();
    const template = await prisma.checklistTemplate.findUnique({
      where: { id: templateId },
      include: { items: { orderBy: { order: "asc" } } },
    });
    if (!template || !template.isActive) return reply.code(404).send({ error: "not_found" });
    const run = await prisma.checklistRun.findUnique({
      where: { templateId_branchId_date: { templateId, branchId: user.branchId, date } },
    });
    return {
      id: template.id,
      name: template.name,
      type: template.type,
      date,
      items: template.items.map((i) => ({ id: i.id, label: i.label })),
      checkedItemIds: run ? parseIds(run.checkedItemIds) : [],
      note: run?.note ?? "",
    };
  });

  // Save today's checklist run (upsert per template/store/day).
  const runBody = z.object({ checkedItemIds: z.array(z.string()), note: z.string().optional() });
  app.post("/api/store/checklist/:templateId", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    if (!user.branchId) return reply.code(400).send({ error: "no_branch" });
    const { templateId } = req.params as { templateId: string };
    const p = runBody.safeParse(req.body);
    if (!p.success) return reply.code(400).send({ error: "invalid_input" });
    const date = todayStr();
    const data = {
      checkedItemIds: JSON.stringify(p.data.checkedItemIds),
      note: p.data.note ?? "",
      performedById: user.id,
    };
    await prisma.checklistRun.upsert({
      where: { templateId_branchId_date: { templateId, branchId: user.branchId, date } },
      create: { templateId, branchId: user.branchId, date, ...data },
      update: data,
    });
    return { ok: true };
  });

  // ----- Admin (manage content) -----------------------------------------
  const guard = requireRole(...canManageContent);

  app.get("/api/admin/store", { preHandler: guard }, async () => {
    const [templates, notices, branches] = await Promise.all([
      prisma.checklistTemplate.findMany({
        orderBy: { order: "asc" },
        include: { items: { orderBy: { order: "asc" } }, branch: { select: { name: true } } },
      }),
      prisma.notice.findMany({
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        include: { branch: { select: { name: true } }, author: { select: { name: true } } },
      }),
      prisma.branch.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    ]);
    return { templates, notices, branches };
  });

  const templateBody = z.object({
    name: z.string().min(1),
    type: z.enum(["open", "close", "custom"]).optional(),
    branchId: z.string().nullable().optional(),
    order: z.number().int().optional(),
    isActive: z.boolean().optional(),
  });
  app.post("/api/admin/checklist-templates", { preHandler: guard }, async (req, reply) => {
    const p = templateBody.safeParse(req.body);
    if (!p.success) return reply.code(400).send({ error: "invalid_input" });
    const { branchId, ...rest } = p.data;
    return prisma.checklistTemplate.create({ data: { ...rest, branchId: branchId || null } });
  });
  app.patch("/api/admin/checklist-templates/:id", { preHandler: guard }, async (req) => {
    const { id } = req.params as { id: string };
    const b = templateBody.partial().parse(req.body);
    const data: Record<string, unknown> = { ...b };
    if ("branchId" in b) data.branchId = b.branchId || null;
    return prisma.checklistTemplate.update({ where: { id }, data });
  });

  const itemBody = z.object({ templateId: z.string(), label: z.string().min(1), order: z.number().int().optional() });
  app.post("/api/admin/checklist-items", { preHandler: guard }, async (req, reply) => {
    const p = itemBody.safeParse(req.body);
    if (!p.success) return reply.code(400).send({ error: "invalid_input" });
    return prisma.checklistItem.create({ data: p.data });
  });
  app.patch("/api/admin/checklist-items/:id", { preHandler: guard }, async (req) => {
    const { id } = req.params as { id: string };
    const b = z.object({ label: z.string().min(1).optional(), order: z.number().int().optional() }).parse(req.body);
    return prisma.checklistItem.update({ where: { id }, data: b });
  });
  app.delete("/api/admin/checklist-items/:id", { preHandler: guard }, async (req) => {
    const { id } = req.params as { id: string };
    await prisma.checklistItem.delete({ where: { id } });
    return { ok: true };
  });

  const noticeBody = z.object({
    title: z.string().min(1),
    body: z.string().optional(),
    branchId: z.string().nullable().optional(),
    isPinned: z.boolean().optional(),
    isPublished: z.boolean().optional(),
  });
  app.post("/api/admin/notices", { preHandler: guard }, async (req, reply) => {
    const p = noticeBody.safeParse(req.body);
    if (!p.success) return reply.code(400).send({ error: "invalid_input" });
    const { branchId, ...rest } = p.data;
    return prisma.notice.create({ data: { ...rest, branchId: branchId || null, authorId: req.sessionUser?.id ?? null } });
  });
  app.patch("/api/admin/notices/:id", { preHandler: guard }, async (req) => {
    const { id } = req.params as { id: string };
    const b = noticeBody.partial().parse(req.body);
    const data: Record<string, unknown> = { ...b };
    if ("branchId" in b) data.branchId = b.branchId || null;
    return prisma.notice.update({ where: { id }, data });
  });
}
