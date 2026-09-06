import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole, canManageContent } from "../lib/rbac.js";

// Training Resources (교육자료실). A catalogued library of training materials
// (video/pdf/image/link/doc) referenced by URL, organized by category, and
// optionally attached to a Lesson. All content is DATA (admin-editable).

function visibleToRole(targetRoles: string, roleKey: string): boolean {
  try {
    const arr = JSON.parse(targetRoles || "[]");
    if (!Array.isArray(arr) || arr.length === 0) return true;
    return arr.includes(roleKey);
  } catch {
    return true;
  }
}

function parseTags(tags: string): string[] {
  try {
    const a = JSON.parse(tags || "[]");
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

export async function resourceRoutes(app: FastifyInstance) {
  // ----- Staff facing ----------------------------------------------------
  app.get("/api/resources", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const query = req.query as { q?: string; type?: string };
    const q = (query.q ?? "").toString().trim().toLowerCase();
    const type = (query.type ?? "").toString().trim();

    const categories = await prisma.resourceCategory.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        resources: {
          where: { isPublished: true },
          orderBy: { order: "asc" },
          include: { lesson: { select: { title: true } } },
        },
      },
    });

    return categories
      .map((c) => ({
        id: c.id,
        name: c.name,
        resources: c.resources
          .filter((r) => visibleToRole(r.targetRoles, user.roleKey))
          .filter((r) => !type || r.type === type)
          .filter(
            (r) =>
              !q ||
              r.title.toLowerCase().includes(q) ||
              (r.description ?? "").toLowerCase().includes(q) ||
              parseTags(r.tags).some((t) => t.toLowerCase().includes(q)),
          )
          .map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            type: r.type,
            url: r.url,
            tags: parseTags(r.tags),
            lessonTitle: r.lesson?.title ?? null,
          })),
      }))
      .filter((c) => c.resources.length > 0);
  });

  // ----- Admin (manage content) -----------------------------------------
  const guard = requireRole(...canManageContent);

  app.get("/api/admin/resources", { preHandler: guard }, async () => {
    return prisma.resourceCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        resources: {
          orderBy: { order: "asc" },
          include: { lesson: { select: { id: true, title: true } } },
        },
      },
    });
  });

  // Flat list of lessons for the "attach to lesson" picker.
  app.get("/api/admin/lessons-flat", { preHandler: guard }, async () => {
    const lessons = await prisma.lesson.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: { module: { include: { course: { include: { curriculum: true } } } } },
    });
    return lessons.map((l) => ({
      id: l.id,
      label: `${l.module.course.curriculum.title} › ${l.title}`,
    }));
  });

  const categoryBody = z.object({
    name: z.string().min(1),
    order: z.number().int().optional(),
    isActive: z.boolean().optional(),
  });
  app.post("/api/admin/resource-categories", { preHandler: guard }, async (req, reply) => {
    const p = categoryBody.safeParse(req.body);
    if (!p.success) return reply.code(400).send({ error: "invalid_input" });
    return prisma.resourceCategory.create({ data: p.data });
  });
  app.patch("/api/admin/resource-categories/:id", { preHandler: guard }, async (req) => {
    const { id } = req.params as { id: string };
    return prisma.resourceCategory.update({ where: { id }, data: categoryBody.partial().parse(req.body) });
  });

  const resourceBody = z.object({
    categoryId: z.string(),
    title: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(["video", "pdf", "image", "link", "doc"]).optional(),
    url: z.string().optional(),
    tags: z.array(z.string()).optional(),
    targetRoles: z.array(z.string()).optional(),
    lessonId: z.string().nullable().optional(),
    isPublished: z.boolean().optional(),
    order: z.number().int().optional(),
  });

  app.post("/api/admin/resources", { preHandler: guard }, async (req, reply) => {
    const p = resourceBody.safeParse(req.body);
    if (!p.success) return reply.code(400).send({ error: "invalid_input" });
    const { tags, targetRoles, lessonId, ...rest } = p.data;
    return prisma.resource.create({
      data: {
        ...rest,
        tags: JSON.stringify(tags ?? []),
        targetRoles: JSON.stringify(targetRoles ?? []),
        lessonId: lessonId || null,
        authorId: req.sessionUser?.id ?? null,
      },
    });
  });

  app.patch("/api/admin/resources/:id", { preHandler: guard }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = resourceBody.partial().safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_input" });
    const { tags, targetRoles, lessonId, ...rest } = parsed.data;
    const data: Record<string, unknown> = { ...rest };
    if (tags) data.tags = JSON.stringify(tags);
    if (targetRoles) data.targetRoles = JSON.stringify(targetRoles);
    if (lessonId !== undefined) data.lessonId = lessonId || null;
    return prisma.resource.update({ where: { id }, data });
  });
}
