import { prisma } from "../prisma.js";

// Ensure a SkillProgress row exists for (user, skill). Returns it.
export async function ensureSkillProgress(userId: string, skillId: string) {
  const existing = await prisma.skillProgress.findUnique({
    where: { userId_skillId: { userId, skillId } },
  });
  if (existing) return existing;
  return prisma.skillProgress.create({
    data: { userId, skillId },
  });
}

type CountField = "practiceCount" | "applicationCount" | "evaluationCount" | "feedbackCount";

// Increment one activity counter on the skill progress. These counters are the
// multi-dimensional Skill state (never a single score). Incrementing a counter
// does NOT change the level — level only moves via recordGrowth().
export async function bumpSkillCount(userId: string, skillId: string, field: CountField) {
  await ensureSkillProgress(userId, skillId);
  await prisma.skillProgress.update({
    where: { userId_skillId: { userId, skillId } },
    data: { [field]: { increment: 1 } },
  });
}

// Record an actual growth (level move) with its cause. This is the ONLY way a
// skill level changes. Completion (LearningProgress) can never call this.
export async function recordGrowth(params: {
  userId: string;
  skillId: string;
  toLevelId: string;
  causeType: "evaluation" | "feedback" | "application" | "practice";
  causeId?: string;
  evaluationId?: string;
  note?: string;
}) {
  const sp = await ensureSkillProgress(params.userId, params.skillId);
  const fromLevelId = sp.currentLevelId;
  await prisma.$transaction([
    prisma.skillProgress.update({
      where: { id: sp.id },
      data: { currentLevelId: params.toLevelId },
    }),
    prisma.skillGrowthEvent.create({
      data: {
        skillProgressId: sp.id,
        fromLevelId,
        toLevelId: params.toLevelId,
        causeType: params.causeType,
        causeId: params.causeId,
        evaluationId: params.evaluationId,
        note: params.note,
      },
    }),
  ]);
}
