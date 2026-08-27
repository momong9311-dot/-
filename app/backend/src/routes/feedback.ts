import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole, canEvaluate } from "../lib/rbac.js";
import { bumpSkillCount } from "../lib/growth.js";

const fbSchema = z.object({
  subjectUserId: z.string(),
  evaluationId: z.string().optional(),
  customerCaseId: z.string().optional(),
  skillId: z.string().optional(),
  strength: z.string().default(""),
  gap: z.string().default(""),
  message: z.string().min(1),
  nextAction: z.string().default(""),
  dueDate: z.string().datetime().optional(),
});

export async function feedbackRoutes(app: FastifyInstance) {
  // Designer: my feedback.
  app.get("/api/designer/feedback", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const rows = await prisma.feedback.findMany({
      where: { subjectUserId: user.id },
      orderBy: { createdAt: "desc" },
      include: { skill: true, author: { select: { name: true } } },
    });
    return rows.map((f) => ({
      id: f.id,
      strength: f.strength,
      gap: f.gap,
      message: f.message,
      nextAction: f.nextAction,
      dueDate: f.dueDate,
      skillName: f.skill?.name ?? null,
      customerCaseId: f.customerCaseId,
      authorName: f.author.name,
      acknowledged: !!f.acknowledgedAt,
      createdAt: f.createdAt,
    }));
  });

  // Designer acknowledges feedback -> closes the loop to a Next Action.
  app.post("/api/designer/feedback/:id/acknowledge", async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const fb = await prisma.feedback.findUnique({ where: { id } });
    if (!fb || fb.subjectUserId !== user.id) return reply.code(404).send({ error: "not_found" });
    return prisma.feedback.update({ where: { id }, data: { acknowledgedAt: new Date() } });
  });

  // STEP 7: create feedback (connects evaluation to the designer's next action).
  app.post("/api/feedback", { preHandler: requireRole(...canEvaluate) }, async (req, reply) => {
    const user = req.sessionUser!;
    const parsed = fbSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_input" });
    const d = parsed.data;
    const fb = await prisma.feedback.create({
      data: {
        subjectUserId: d.subjectUserId,
        authorId: user.id,
        evaluationId: d.evaluationId,
        customerCaseId: d.customerCaseId,
        skillId: d.skillId,
        strength: d.strength,
        gap: d.gap,
        message: d.message,
        nextAction: d.nextAction,
        dueDate: d.dueDate ? new Date(d.dueDate) : undefined,
      },
    });
    if (d.skillId) await bumpSkillCount(d.subjectUserId, d.skillId, "feedbackCount");
    return fb;
  });
}
