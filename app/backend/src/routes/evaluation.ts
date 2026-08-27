import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole, canEvaluate } from "../lib/rbac.js";
import { bumpSkillCount, recordGrowth } from "../lib/growth.js";

const evalSchema = z.object({
  subjectUserId: z.string(),
  skillId: z.string().optional(),
  practiceId: z.string().optional(),
  customerCaseId: z.string().optional(),
  // competency dimension; design_connection is the core one
  dimension: z.enum(["observation", "diagnosis", "problem", "design_connection", "execution", "communication"]).optional(),
  criteria: z.string().default(""),
  observation: z.string().default(""),
  strength: z.string().default(""),
  gap: z.string().default(""),
  nextAction: z.string().default(""),
  score: z.number().int().min(0).max(100).optional(),
  // optional: evaluator records a real growth (level move) as a result.
  newLevelId: z.string().optional(),
});

export async function evaluationRoutes(app: FastifyInstance) {
  // Designer: evaluations about me.
  app.get("/api/designer/evaluations", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const rows = await prisma.evaluation.findMany({
      where: { subjectUserId: user.id },
      orderBy: { createdAt: "desc" },
      include: { skill: true, evaluator: { select: { name: true } } },
    });
    return rows;
  });

  // Evaluator queue: submitted practices awaiting evaluation (+ pending evals).
  app.get("/api/eval/queue", { preHandler: requireRole(...canEvaluate) }, async (_req, reply) => {
    const practices = await prisma.practice.findMany({
      where: { status: "submitted", evaluations: { none: {} } },
      orderBy: { submittedAt: "asc" },
      include: { user: { select: { id: true, name: true } }, skill: true, assignment: true, lesson: true },
    });
    return practices.map((p) => ({
      practiceId: p.id,
      designerId: p.user.id,
      designerName: p.user.name,
      skillId: p.skillId,
      skillName: p.skill?.name ?? null,
      assignmentTitle: p.assignment?.title ?? null,
      lessonTitle: p.lesson?.title ?? null,
      evidence: p.evidence,
      reflection: p.reflection,
      submittedAt: p.submittedAt,
    }));
  });

  // STEP 6: create an evaluation (behavior/competency, structured).
  app.post("/api/eval", { preHandler: requireRole(...canEvaluate) }, async (req, reply) => {
    const user = req.sessionUser!;
    const parsed = evalSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_input", detail: parsed.error.issues });
    const d = parsed.data;

    const evaluation = await prisma.evaluation.create({
      data: {
        subjectUserId: d.subjectUserId,
        evaluatorId: user.id,
        skillId: d.skillId,
        practiceId: d.practiceId,
        customerCaseId: d.customerCaseId,
        dimension: d.dimension,
        criteria: d.criteria,
        observation: d.observation,
        strength: d.strength,
        gap: d.gap,
        nextAction: d.nextAction,
        score: d.score,
        status: "completed",
      },
    });

    if (d.practiceId) await prisma.practice.update({ where: { id: d.practiceId }, data: { status: "reviewed" } });

    if (d.skillId) {
      await bumpSkillCount(d.subjectUserId, d.skillId, "evaluationCount");
      // A real growth only happens when the evaluator moves the level — with cause.
      if (d.newLevelId) {
        await recordGrowth({
          userId: d.subjectUserId,
          skillId: d.skillId,
          toLevelId: d.newLevelId,
          causeType: "evaluation",
          causeId: evaluation.id,
          evaluationId: evaluation.id,
          note: d.strength || d.observation || undefined,
        });
      }
    }
    return evaluation;
  });
}
