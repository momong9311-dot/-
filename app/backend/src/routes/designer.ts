import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma.js";
import { requireAuth } from "../lib/rbac.js";

// Flatten the active content hierarchy into an ordered lesson list.
// For the MVP every active curriculum is available to every designer; per-user
// assignment can be layered on later without changing callers.
async function orderedLessons() {
  const curricula = await prisma.curriculum.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: {
      skill: true,
      courses: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        include: {
          modules: {
            where: { isActive: true },
            orderBy: { order: "asc" },
            include: {
              lessons: {
                where: { isActive: true },
                orderBy: { order: "asc" },
                include: { assignments: { orderBy: { order: "asc" } } },
              },
            },
          },
        },
      },
    },
  });

  const flat: {
    lesson: (typeof curricula)[number]["courses"][number]["modules"][number]["lessons"][number];
    curriculum: (typeof curricula)[number];
    course: (typeof curricula)[number]["courses"][number];
    module: (typeof curricula)[number]["courses"][number]["modules"][number];
  }[] = [];

  for (const c of curricula)
    for (const co of c.courses)
      for (const m of co.modules)
        for (const l of m.lessons) flat.push({ lesson: l, curriculum: c, course: co, module: m });
  return flat;
}

export async function designerRoutes(app: FastifyInstance) {
  // ----- STEP 3: Designer Home -------------------------------------------
  app.get("/api/designer/home", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;

    const [lessons, progressRows, skillProgress, feedback, practices] = await Promise.all([
      orderedLessons(),
      prisma.learningProgress.findMany({ where: { userId: user.id } }),
      prisma.skillProgress.findMany({
        where: { userId: user.id },
        include: { skill: true, currentLevel: true, targetLevel: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.feedback.findMany({
        where: { subjectUserId: user.id },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { skill: true },
      }),
      prisma.practice.findMany({ where: { userId: user.id }, select: { assignmentId: true } }),
    ]);

    const progressByLesson = new Map(progressRows.map((p) => [p.lessonId, p]));
    const practicedAssignments = new Set(practices.map((p) => p.assignmentId).filter(Boolean));

    // TODAY / CURRENT FOCUS: first in-progress lesson, else first not-started.
    let todayEntry = lessons.find((e) => progressByLesson.get(e.lesson.id)?.status === "in_progress");
    if (!todayEntry)
      todayEntry = lessons.find((e) => {
        const st = progressByLesson.get(e.lesson.id)?.status;
        return st === undefined || st === "not_started";
      });

    const today = todayEntry
      ? {
          lessonId: todayEntry.lesson.id,
          lessonTitle: todayEntry.lesson.title,
          curriculumTitle: todayEntry.curriculum.title,
          status: progressByLesson.get(todayEntry.lesson.id)?.status ?? "not_started",
        }
      : null;

    const currentFocus = todayEntry?.curriculum.skill
      ? { skillId: todayEntry.curriculum.skill.id, skillName: todayEntry.curriculum.skill.name }
      : null;

    // PRACTICE: assignments in started lessons not yet practiced.
    const practiceTodo: { assignmentId: string; title: string; lessonTitle: string }[] = [];
    for (const e of lessons) {
      const st = progressByLesson.get(e.lesson.id)?.status;
      if (st !== "in_progress" && st !== "completed") continue;
      for (const a of e.lesson.assignments) {
        if (!practicedAssignments.has(a.id))
          practiceTodo.push({ assignmentId: a.id, title: a.title, lessonTitle: e.lesson.title });
      }
    }

    // FEEDBACK: most recent, flag unacknowledged.
    const feedbackView = feedback.map((f) => ({
      id: f.id,
      message: f.message,
      nextAction: f.nextAction,
      skillName: f.skill?.name ?? null,
      acknowledged: !!f.acknowledgedAt,
      createdAt: f.createdAt,
    }));

    // MY GROWTH summary (core skills first).
    const growth = skillProgress
      .slice()
      .sort((a, b) => Number(b.skill.isCore) - Number(a.skill.isCore))
      .slice(0, 6)
      .map((sp) => ({
        skillId: sp.skillId,
        skillName: sp.skill.name,
        isCore: sp.skill.isCore,
        currentLevel: sp.currentLevel?.name ?? null,
        targetLevel: sp.targetLevel?.name ?? null,
        practiceCount: sp.practiceCount,
        applicationCount: sp.applicationCount,
        evaluationCount: sp.evaluationCount,
        feedbackCount: sp.feedbackCount,
      }));

    // NEXT STEP: single, concrete suggested action.
    let nextStep: string;
    const unack = feedbackView.find((f) => !f.acknowledged);
    if (unack) nextStep = `피드백 확인: ${unack.nextAction || unack.message}`;
    else if (practiceTodo.length) nextStep = `실습 제출: ${practiceTodo[0].title}`;
    else if (today && today.status !== "completed") nextStep = `학습 계속: ${today.lessonTitle}`;
    else nextStep = "다음 커리큘럼을 시작하세요.";

    return { today, currentFocus, practice: practiceTodo.slice(0, 5), feedback: feedbackView, growth, nextStep };
  });

  // ----- STEP 4: Curriculum browsing with progress ------------------------
  app.get("/api/designer/curricula", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const lessons = await orderedLessons();
    const progressRows = await prisma.learningProgress.findMany({ where: { userId: user.id } });
    const progressByLesson = new Map(progressRows.map((p) => [p.lessonId, p]));

    // Rebuild the tree with per-lesson status.
    const byCurriculum = new Map<string, any>();
    for (const e of lessons) {
      let c = byCurriculum.get(e.curriculum.id);
      if (!c) {
        c = {
          id: e.curriculum.id,
          title: e.curriculum.title,
          skillName: e.curriculum.skill?.name ?? null,
          courses: new Map<string, any>(),
        };
        byCurriculum.set(e.curriculum.id, c);
      }
      let co = c.courses.get(e.course.id);
      if (!co) {
        co = { id: e.course.id, title: e.course.title, modules: new Map<string, any>() };
        c.courses.set(e.course.id, co);
      }
      let m = co.modules.get(e.module.id);
      if (!m) {
        m = { id: e.module.id, title: e.module.title, lessons: [] };
        co.modules.set(e.module.id, m);
      }
      m.lessons.push({
        id: e.lesson.id,
        title: e.lesson.title,
        isRequired: e.lesson.isRequired,
        status: progressByLesson.get(e.lesson.id)?.status ?? "not_started",
      });
    }
    // Materialize maps -> arrays.
    return Array.from(byCurriculum.values()).map((c) => ({
      ...c,
      courses: Array.from(c.courses.values()).map((co: any) => ({
        ...co,
        modules: Array.from(co.modules.values()),
      })),
    }));
  });

  app.get("/api/designer/lessons/:id", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: { assignments: { orderBy: { order: "asc" } }, module: { include: { course: { include: { curriculum: { include: { skill: true } } } } } } },
    });
    if (!lesson) return reply.code(404).send({ error: "not_found" });
    const progress = await prisma.learningProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: id } },
    });
    return {
      id: lesson.id,
      title: lesson.title,
      content: lesson.content,
      isRequired: lesson.isRequired,
      estimatedMinutes: lesson.estimatedMinutes,
      skillName: lesson.module.course.curriculum.skill?.name ?? null,
      curriculumTitle: lesson.module.course.curriculum.title,
      assignments: lesson.assignments,
      status: progress?.status ?? "not_started",
      progressPct: progress?.progressPct ?? 0,
    };
  });

  // Save learning progress (STEP 4). This is COMPLETION — never touches growth.
  app.post("/api/designer/lessons/:id/progress", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const body = (req.body ?? {}) as { status?: string };
    const status = body.status === "completed" || body.status === "in_progress" ? body.status : "in_progress";
    const now = new Date();
    const data = {
      status,
      progressPct: status === "completed" ? 100 : 50,
      startedAt: now,
      completedAt: status === "completed" ? now : null,
    };
    const row = await prisma.learningProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId: id } },
      create: { userId: user.id, lessonId: id, ...data },
      update: { status: data.status, progressPct: data.progressPct, completedAt: data.completedAt },
    });
    return row;
  });

  // ----- STEP 8: My Growth (understand WHY, not just a progress bar) -------
  app.get("/api/designer/growth", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const rows = await prisma.skillProgress.findMany({
      where: { userId: user.id },
      include: {
        skill: { include: { educationArea: true } },
        currentLevel: true,
        targetLevel: true,
        growthHistory: {
          orderBy: { createdAt: "desc" },
          include: { fromLevel: true, toLevel: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((sp) => ({
      skillId: sp.skillId,
      skillName: sp.skill.name,
      area: sp.skill.educationArea.name,
      isCore: sp.skill.isCore,
      currentLevel: sp.currentLevel?.name ?? null,
      targetLevel: sp.targetLevel?.name ?? null,
      practiceCount: sp.practiceCount,
      applicationCount: sp.applicationCount,
      evaluationCount: sp.evaluationCount,
      feedbackCount: sp.feedbackCount,
      history: sp.growthHistory.map((h) => ({
        from: h.fromLevel?.name ?? null,
        to: h.toLevel?.name ?? null,
        causeType: h.causeType,
        note: h.note,
        createdAt: h.createdAt,
      })),
    }));
  });
}
