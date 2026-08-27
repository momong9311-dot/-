import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Dev seed. Everything created here is marked isSeed where the model supports it,
// so real user data is never mixed with demo data (docs/DATA_MODEL.md §6).
async function main() {
  console.log("Seeding… (clearing existing dev data first)");
  // Delete in FK-safe order.
  await prisma.skillGrowthEvent.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.practice.deleteMany();
  await prisma.customerCase.deleteMany();
  await prisma.learningProgress.deleteMany();
  await prisma.skillProgress.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.curriculum.deleteMany();
  await prisma.promotionCriteria.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.educationArea.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.level.deleteMany();

  // --- Roles ---
  const roles = await Promise.all(
    [
      { key: "designer", name: "Designer", permissions: '["self"]' },
      { key: "leader", name: "Leader", permissions: '["self","evaluate","view_admin"]' },
      { key: "educator", name: "Educator", permissions: '["self","evaluate","view_admin","manage_content"]' },
      { key: "admin", name: "Admin", permissions: '["self","evaluate","view_admin","manage_content","manage_all"]' },
    ].map((r) => prisma.role.create({ data: r })),
  );
  const roleByKey = Object.fromEntries(roles.map((r) => [r.key, r]));

  // --- Branch ---
  const branch = await prisma.branch.create({ data: { name: "메르시모몽 본점", region: "Seoul" } });

  // --- Levels (data, not hardcoded) ---
  const levelDefs = [
    { order: 1, code: "FOUNDATION", name: "LEVEL 01 — FOUNDATION" },
    { order: 2, code: "PRACTICE", name: "LEVEL 02 — PRACTICE" },
    { order: 3, code: "APPLICATION", name: "LEVEL 03 — APPLICATION" },
    { order: 4, code: "DESIGNER", name: "LEVEL 04 — DESIGNER" },
    { order: 5, code: "ADVANCED", name: "LEVEL 05 — ADVANCED" },
    { order: 6, code: "LEADER", name: "LEVEL 06 — LEADER" },
  ];
  const levels = await Promise.all(levelDefs.map((l) => prisma.level.create({ data: l })));
  const levelByOrder = Object.fromEntries(levels.map((l) => [l.order, l]));

  // --- Education Areas + Skills ---
  const areaDefs: { name: string; skills: { name: string; isCore?: boolean }[] }[] = [
    { name: "상담", skills: [{ name: "상담" }, { name: "고객 커뮤니케이션" }] },
    { name: "진단", skills: [{ name: "얼굴 분석" }, { name: "골격 이미지" }, { name: "퍼스널 컬러" }, { name: "모질 분석" }] },
    { name: "디자인", skills: [{ name: "디자인 연결", isCore: true }] },
    { name: "시술", skills: [{ name: "커트" }, { name: "펌" }, { name: "컬러" }, { name: "스타일링" }] },
    { name: "판매", skills: [{ name: "판매" }] },
    { name: "콘텐츠", skills: [{ name: "콘텐츠" }] },
    { name: "리더십", skills: [{ name: "리더십" }] },
  ];
  const skillByName: Record<string, { id: string }> = {};
  let areaOrder = 0;
  for (const a of areaDefs) {
    const area = await prisma.educationArea.create({ data: { name: a.name, order: areaOrder++ } });
    let sOrder = 0;
    for (const s of a.skills) {
      const skill = await prisma.skill.create({
        data: { name: s.name, isCore: !!s.isCore, order: sOrder++, educationAreaId: area.id },
      });
      skillByName[s.name] = skill;
    }
  }

  // --- Demo curriculum: 진단 → 디자인 연결 (the core competency) ---
  const curriculum = await prisma.curriculum.create({
    data: {
      title: "진단에서 디자인으로",
      description: "관찰과 진단 결과를 실제 디자인 요소로 연결하는 핵심 역량 과정.",
      order: 1,
      isSeed: true,
      skillId: skillByName["디자인 연결"].id,
      targetLevelId: levelByOrder[3].id,
    },
  });
  const course = await prisma.course.create({
    data: { curriculumId: curriculum.id, title: "진단 → 디자인 연결 기초", order: 1, isSeed: true },
  });
  const mod = await prisma.module.create({
    data: { courseId: course.id, title: "얼굴 관찰과 디자인 연결", order: 1, isSeed: true },
  });
  const lesson1 = await prisma.lesson.create({
    data: {
      moduleId: mod.id,
      title: "얼굴 가로·세로 비율 관찰",
      content:
        "관찰 → 진단 → 문제 정의로 이어지는 첫 단계. 얼굴의 가로/세로 비율, 이마·턱 라인을 관찰하고 기록한다. 관찰은 '보이는 사실'만 적는다. 해석은 다음 단계에서 한다.",
      order: 1,
      isRequired: true,
      isSeed: true,
      estimatedMinutes: 20,
      targetLevelId: levelByOrder[1].id,
    },
  });
  const lesson2 = await prisma.lesson.create({
    data: {
      moduleId: mod.id,
      title: "관찰 결과를 디자인 요소로 연결하기",
      content:
        "핵심 역량: 진단 → 디자인 연결. 관찰한 특징(예: 가로 비율이 넓음)을 어떤 디자인 전략/요소(예: 세로 흐름을 강조하는 레이어)로 연결할지 설명한다. '왜 이 디자인인가'를 진단 근거로 말할 수 있어야 한다.",
      order: 2,
      isRequired: true,
      isSeed: true,
      estimatedMinutes: 30,
      targetLevelId: levelByOrder[2].id,
    },
  });
  const assignment2 = await prisma.assignment.create({
    data: {
      lessonId: lesson2.id,
      title: "관찰 → 디자인 연결 설명 작성",
      instructions:
        "실제 또는 모의 고객 1명의 얼굴 관찰 결과를 적고, 그 특징을 어떤 디자인 요소로 연결할지 '진단 근거 → 디자인 전략'의 형태로 서술하세요.",
      type: "task",
      order: 1,
    },
  });

  // --- Users (one per role). Password for all demo users: password123 ---
  const pw = await bcrypt.hash("password123", 10);
  const admin = await prisma.user.create({
    data: { name: "관리자", email: "admin@merci.dev", passwordHash: pw, roleId: roleByKey.admin.id, branchId: branch.id, isSeed: true },
  });
  const educator = await prisma.user.create({
    data: { name: "교육자", email: "educator@merci.dev", passwordHash: pw, roleId: roleByKey.educator.id, branchId: branch.id, isSeed: true },
  });
  const leader = await prisma.user.create({
    data: { name: "리더", email: "leader@merci.dev", passwordHash: pw, roleId: roleByKey.leader.id, branchId: branch.id, isSeed: true },
  });
  const designer = await prisma.user.create({
    data: {
      name: "김디자이너",
      email: "designer@merci.dev",
      passwordHash: pw,
      roleId: roleByKey.designer.id,
      branchId: branch.id,
      levelId: levelByOrder[2].id,
      isSeed: true,
    },
  });
  const designer2 = await prisma.user.create({
    data: {
      name: "이디자이너",
      email: "designer2@merci.dev",
      passwordHash: pw,
      roleId: roleByKey.designer.id,
      branchId: branch.id,
      levelId: levelByOrder[1].id,
      isSeed: true,
    },
  });

  // --- SkillProgress for the demo designer (multi-dimensional, not a score) ---
  const coreSkill = skillByName["디자인 연결"];
  const faceSkill = skillByName["얼굴 분석"];
  const spCore = await prisma.skillProgress.create({
    data: {
      userId: designer.id,
      skillId: coreSkill.id,
      currentLevelId: levelByOrder[1].id,
      targetLevelId: levelByOrder[3].id,
      practiceCount: 2,
      applicationCount: 0,
      evaluationCount: 1,
      feedbackCount: 1,
    },
  });
  await prisma.skillProgress.create({
    data: {
      userId: designer.id,
      skillId: faceSkill.id,
      currentLevelId: levelByOrder[2].id,
      targetLevelId: levelByOrder[3].id,
      practiceCount: 3,
      applicationCount: 1,
      evaluationCount: 2,
      feedbackCount: 2,
    },
  });
  // second designer: tracked but no application (shows up as weak/stuck)
  await prisma.skillProgress.create({
    data: { userId: designer2.id, skillId: coreSkill.id, currentLevelId: levelByOrder[1].id, targetLevelId: levelByOrder[3].id, practiceCount: 0, applicationCount: 0, evaluationCount: 0, feedbackCount: 0 },
  });

  // --- Learning progress: lesson1 completed, lesson2 in progress ---
  await prisma.learningProgress.create({
    data: { userId: designer.id, lessonId: lesson1.id, status: "completed", progressPct: 100, startedAt: new Date(), completedAt: new Date() },
  });
  await prisma.learningProgress.create({
    data: { userId: designer.id, lessonId: lesson2.id, status: "in_progress", progressPct: 50, startedAt: new Date() },
  });

  // --- A practice, an evaluation, and feedback (the loop, made visible) ---
  const practice = await prisma.practice.create({
    data: {
      userId: designer.id,
      lessonId: lesson2.id,
      assignmentId: assignment2.id,
      skillId: coreSkill.id,
      evidence: "가로 비율이 넓은 고객. 세로 흐름을 강조하는 레이어드 컷으로 연결.",
      reflection: "관찰은 정확했지만 디자인 근거 설명이 짧았다.",
      status: "reviewed",
    },
  });
  const evaluation = await prisma.evaluation.create({
    data: {
      subjectUserId: designer.id,
      evaluatorId: leader.id,
      skillId: coreSkill.id,
      practiceId: practice.id,
      criteria: "관찰 정확도 / 진단→디자인 연결의 논리",
      observation: "가로 비율은 정확히 관찰함.",
      strength: "관찰 데이터가 구체적이고 정확함.",
      gap: "그 특징을 디자인 요소로 연결하는 설명이 부족함.",
      nextAction: "다음 실습에서는 '진단 근거 → 디자인 전략' 문장을 반드시 포함할 것.",
      score: 72,
      status: "completed",
    },
  });
  await prisma.feedback.create({
    data: {
      subjectUserId: designer.id,
      authorId: leader.id,
      evaluationId: evaluation.id,
      skillId: coreSkill.id,
      message: "얼굴의 가로 비율은 정확하게 관찰했지만, 그 특징을 디자인 요소로 연결하는 설명이 부족함.",
      nextAction: "다음 실습에서 '진단 근거 → 디자인 전략'을 한 문장으로 연결해 제출하세요.",
    },
  });
  // one growth event with a real cause (never from completion)
  await prisma.skillGrowthEvent.create({
    data: {
      skillProgressId: spCore.id,
      fromLevelId: null,
      toLevelId: levelByOrder[1].id,
      causeType: "evaluation",
      evaluationId: evaluation.id,
      note: "첫 평가로 FOUNDATION 확인.",
    },
  });

  // --- PromotionCriteria (structure only; decision-support, never automatic) ---
  await prisma.promotionCriteria.create({
    data: {
      fromLevelId: levelByOrder[2].id,
      toLevelId: levelByOrder[3].id,
      skillId: coreSkill.id,
      skillRequirements: JSON.stringify({ minCurrentLevelOrder: 3, minApplicationCount: 2, minEvaluationCount: 2 }),
      notes: "APPLICATION 승급 후보 기준(예시). 최종 결정은 사람이 한다.",
    },
  });

  console.log("Seed complete.");
  console.log("Demo logins (password: password123):");
  console.log("  admin@merci.dev / educator@merci.dev / leader@merci.dev / designer@merci.dev / designer2@merci.dev");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
