import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireRole, canViewAdmin, canManageContent } from "../lib/rbac.js";

export async function adminRoutes(app: FastifyInstance) {
  // ----- STEP 9: Admin Dashboard -----------------------------------------
  // Answers: who is growing / stuck / weak skill / practice shortage /
  // awaiting evaluation / needs feedback — in one screen.
  app.get("/api/admin/dashboard", { preHandler: requireRole(...canViewAdmin) }, async (_req, reply) => {
    const designers = await prisma.user.findMany({
      where: { role: { key: "designer" }, isActive: true },
      include: {
        level: true,
        branch: true,
        skillProgress: { include: { skill: true, currentLevel: true } },
        _count: {
          select: { learningProgress: true, practices: true, evaluationsAbout: true, feedbackReceived: true },
        },
      },
    });

    const rows = await Promise.all(
      designers.map(async (d) => {
        const completed = await prisma.learningProgress.count({ where: { userId: d.id, status: "completed" } });
        const awaitingEval = await prisma.practice.count({
          where: { userId: d.id, status: "submitted", evaluations: { none: {} } },
        });
        const lastGrowth = await prisma.skillGrowthEvent.findFirst({
          where: { skillProgress: { userId: d.id } },
          orderBy: { createdAt: "desc" },
        });
        const unackFeedback = await prisma.feedback.count({ where: { subjectUserId: d.id, acknowledgedAt: null } });
        const totalApplications = d.skillProgress.reduce((s, sp) => s + sp.applicationCount, 0);
        return {
          id: d.id,
          name: d.name,
          level: d.level?.name ?? null,
          branch: d.branch?.name ?? null,
          lessonsCompleted: completed,
          practiceCount: d._count.practices,
          evaluationCount: d._count.evaluationsAbout,
          applicationCount: totalApplications,
          awaitingEval,
          unackFeedback,
          lastGrowthAt: lastGrowth?.createdAt ?? null,
        };
      }),
    );

    const growing = rows
      .filter((r) => r.lastGrowthAt)
      .sort((a, b) => (b.lastGrowthAt!.getTime?.() ?? 0) - (a.lastGrowthAt!.getTime?.() ?? 0))
      .slice(0, 10);

    // Stuck: has completed lessons but little practice or no growth yet.
    const stuck = rows.filter((r) => r.lessonsCompleted >= 1 && (r.practiceCount === 0 || !r.lastGrowthAt));
    const practiceShortage = rows.filter((r) => r.lessonsCompleted > r.practiceCount);
    const awaitingEvaluation = rows.filter((r) => r.awaitingEval > 0);
    const needsFeedback = rows.filter((r) => r.unackFeedback > 0);

    // Weak skills: aggregate across designers — where application is missing most.
    const skills = await prisma.skill.findMany({ include: { skillProgress: true } });
    const weakSkills = skills
      .map((s) => {
        const tracked = s.skillProgress.length;
        const noApplication = s.skillProgress.filter((sp) => sp.applicationCount === 0).length;
        return { skillId: s.id, skillName: s.name, isCore: s.isCore, tracked, noApplication };
      })
      .filter((s) => s.tracked > 0)
      .sort((a, b) => b.noApplication - a.noApplication)
      .slice(0, 8);

    return {
      totals: {
        designers: rows.length,
        awaitingEvaluation: awaitingEvaluation.length,
        needsFeedback: needsFeedback.length,
        practiceShortage: practiceShortage.length,
      },
      growing,
      stuck,
      weakSkills,
      practiceShortage,
      awaitingEvaluation,
      needsFeedback,
    };
  });

  // Designer list.
  app.get("/api/admin/designers", { preHandler: requireRole(...canViewAdmin) }, async (_req, reply) => {
    const designers = await prisma.user.findMany({
      where: { role: { key: "designer" } },
      include: {
        level: true,
        branch: true,
        skillProgress: { include: { skill: true, currentLevel: true } },
      },
      orderBy: { name: "asc" },
    });
    return designers.map((d) => {
      const core = d.skillProgress.find((sp) => sp.skill.isCore);
      const weakest = d.skillProgress
        .slice()
        .sort((a, b) => a.applicationCount - b.applicationCount)[0];
      return {
        id: d.id,
        name: d.name,
        level: d.level?.name ?? null,
        branch: d.branch?.name ?? null,
        coreSkill: core ? { name: core.skill.name, level: core.currentLevel?.name ?? null } : null,
        weakSkill: weakest?.skill.name ?? null,
      };
    });
  });

  // Designer detail — full picture across the 6 axes.
  app.get("/api/admin/designers/:id", { preHandler: requireRole(...canViewAdmin) }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const d = await prisma.user.findUnique({
      where: { id },
      include: {
        level: true,
        branch: true,
        role: true,
        skillProgress: {
          include: {
            skill: true,
            currentLevel: true,
            targetLevel: true,
            growthHistory: { include: { fromLevel: true, toLevel: true }, orderBy: { createdAt: "desc" } },
          },
        },
        practices: { orderBy: { submittedAt: "desc" }, include: { skill: true, evaluations: true } },
        customerCases: { orderBy: { createdAt: "desc" }, include: { skill: true, evaluations: true } },
        evaluationsAbout: { orderBy: { createdAt: "desc" }, include: { skill: true, evaluator: { select: { name: true } } } },
        feedbackReceived: { orderBy: { createdAt: "desc" }, include: { skill: true, author: { select: { name: true } } } },
      },
    });
    if (!d || d.role.key !== "designer") return reply.code(404).send({ error: "not_found" });
    const completed = await prisma.learningProgress.count({ where: { userId: id, status: "completed" } });
    const inProgress = await prisma.learningProgress.count({ where: { userId: id, status: "in_progress" } });
    return {
      id: d.id,
      name: d.name,
      email: d.email,
      level: d.level?.name ?? null,
      branch: d.branch?.name ?? null,
      learning: { completed, inProgress },
      growth: d.skillProgress.map((sp) => ({
        skillName: sp.skill.name,
        isCore: sp.skill.isCore,
        currentLevel: sp.currentLevel?.name ?? null,
        targetLevel: sp.targetLevel?.name ?? null,
        practiceCount: sp.practiceCount,
        applicationCount: sp.applicationCount,
        evaluationCount: sp.evaluationCount,
        feedbackCount: sp.feedbackCount,
        history: sp.growthHistory.map((h) => ({ from: h.fromLevel?.name ?? null, to: h.toLevel?.name ?? null, causeType: h.causeType, createdAt: h.createdAt })),
      })),
      practices: d.practices.map((p) => ({ id: p.id, skillName: p.skill?.name ?? null, evidence: p.evidence, reflection: p.reflection, status: p.status, submittedAt: p.submittedAt, evaluated: p.evaluations.length > 0 })),
      cases: d.customerCases.map((c) => ({ id: c.id, skillName: c.skill?.name ?? null, status: c.status, diagnosis: c.diagnosis, createdAt: c.createdAt, evaluated: c.evaluations.length > 0 })),
      evaluations: d.evaluationsAbout,
      feedback: d.feedbackReceived,
    };
  });

  // ----- Curriculum Management (content is DATA, admin-editable) ----------
  registerContentCrud(app);
}

// Generic CRUD for the content hierarchy. Kept compact; each entity shares the
// same create/update/delete shape.
function registerContentCrud(app: FastifyInstance) {
  const guard = { preHandler: requireRole(...canManageContent) };

  // Full tree for management (includes inactive).
  app.get("/api/admin/curricula", guard, async () => {
    return prisma.curriculum.findMany({
      orderBy: { order: "asc" },
      include: {
        skill: true,
        targetLevel: true,
        courses: {
          orderBy: { order: "asc" },
          include: {
            modules: {
              orderBy: { order: "asc" },
              include: { lessons: { orderBy: { order: "asc" }, include: { assignments: { orderBy: { order: "asc" } } } } },
            },
          },
        },
      },
    });
  });

  const curriculumBody = z.object({ title: z.string().min(1), description: z.string().optional(), order: z.number().int().optional(), skillId: z.string().optional(), targetLevelId: z.string().optional(), isActive: z.boolean().optional() });
  app.post("/api/admin/curricula", guard, async (req, reply) => {
    const p = curriculumBody.safeParse(req.body);
    if (!p.success) return reply.code(400).send({ error: "invalid_input" });
    return prisma.curriculum.create({ data: p.data });
  });
  app.patch("/api/admin/curricula/:id", guard, async (req) => {
    const { id } = req.params as { id: string };
    return prisma.curriculum.update({ where: { id }, data: curriculumBody.partial().parse(req.body) });
  });

  const courseBody = z.object({ curriculumId: z.string(), title: z.string().min(1), description: z.string().optional(), order: z.number().int().optional(), isActive: z.boolean().optional() });
  app.post("/api/admin/courses", guard, async (req, reply) => {
    const p = courseBody.safeParse(req.body);
    if (!p.success) return reply.code(400).send({ error: "invalid_input" });
    return prisma.course.create({ data: p.data });
  });
  app.patch("/api/admin/courses/:id", guard, async (req) => {
    const { id } = req.params as { id: string };
    return prisma.course.update({ where: { id }, data: courseBody.partial().parse(req.body) });
  });

  const moduleBody = z.object({ courseId: z.string(), title: z.string().min(1), description: z.string().optional(), order: z.number().int().optional(), isActive: z.boolean().optional() });
  app.post("/api/admin/modules", guard, async (req, reply) => {
    const p = moduleBody.safeParse(req.body);
    if (!p.success) return reply.code(400).send({ error: "invalid_input" });
    return prisma.module.create({ data: p.data });
  });
  app.patch("/api/admin/modules/:id", guard, async (req) => {
    const { id } = req.params as { id: string };
    return prisma.module.update({ where: { id }, data: moduleBody.partial().parse(req.body) });
  });

  const lessonBody = z.object({ moduleId: z.string(), title: z.string().min(1), content: z.string().optional(), order: z.number().int().optional(), isRequired: z.boolean().optional(), targetLevelId: z.string().optional(), estimatedMinutes: z.number().int().optional(), isActive: z.boolean().optional() });
  app.post("/api/admin/lessons", guard, async (req, reply) => {
    const p = lessonBody.safeParse(req.body);
    if (!p.success) return reply.code(400).send({ error: "invalid_input" });
    return prisma.lesson.create({ data: p.data });
  });
  app.patch("/api/admin/lessons/:id", guard, async (req) => {
    const { id } = req.params as { id: string };
    return prisma.lesson.update({ where: { id }, data: lessonBody.partial().parse(req.body) });
  });

  const assignmentBody = z.object({ lessonId: z.string(), title: z.string().min(1), instructions: z.string().optional(), type: z.string().optional(), order: z.number().int().optional() });
  app.post("/api/admin/assignments", guard, async (req, reply) => {
    const p = assignmentBody.safeParse(req.body);
    if (!p.success) return reply.code(400).send({ error: "invalid_input" });
    return prisma.assignment.create({ data: p.data });
  });
}
