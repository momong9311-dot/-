import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Dev seed. Everything created here is marked isSeed where the model supports it,
// so real user data is never mixed with demo data (docs/DATA_MODEL.md §6).
async function main() {
  console.log("Seeding… (clearing existing dev data first)");
  // Delete in FK-safe order.
  await prisma.checklistRun.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.checklistTemplate.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.resourceCategory.deleteMany();
  await prisma.manualReadReceipt.deleteMany();
  await prisma.manual.deleteMany();
  await prisma.manualCategory.deleteMany();
  await prisma.skillGrowthEvent.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.practice.deleteMany();
  await prisma.customerCaseSkill.deleteMany();
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
      { key: "owner", name: "점주", permissions: '["self"]' },
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
  await prisma.user.create({
    data: { name: "점주", email: "owner@merci.dev", passwordHash: pw, roleId: roleByKey.owner.id, branchId: branch.id, isSeed: true },
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
      applicationCount: 1,
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

  // --- A completed CustomerCase (real application, internal education record) ---
  const kase = await prisma.customerCase.create({
    data: {
      designerId: designer.id,
      branchId: branch.id,
      skillId: coreSkill.id,
      status: "completed",
      isSeed: true,
      completedAt: new Date(),
      customerNeed: "다운펌 없이 부드럽고 단정한 인상을 원함.",
      desiredImage: "차분하고 세련된 세미 단발.",
      currentConcern: "가로로 넓어 보이는 얼굴, 옆볼륨이 부담스러움.",
      observation: "얼굴 가로 비율이 넓고, 옆쪽 볼륨이 강조되어 있음.",
      diagnosis: "가로 비율 강조형 — 세로 흐름이 부족해 인상이 넓어 보임.",
      problemDefinition: "옆 볼륨을 줄이고 세로 실루엣을 만들어야 함.",
      imageDirection: "세로 흐름 강조의 차분한 세미 단발.",
      designGoal: "세로 실루엣 강조로 가로 비율 완화",
      dsLength: "쇄골 길이 단발",
      dsSilhouette: "세로형 A라인",
      dsVolume: "옆볼륨 축소, 정수리 볼륨 유지",
      dsLine: "얼굴 옆선을 감싸는 세로 라인",
      dsWeight: "끝단 무게 최소화",
      dsTexture: "부드러운 표면 질감",
      dsCurl: "C컬 인컬",
      dsParting: "약간의 사이드 파팅",
      dsFringe: "시스루 앞머리로 세로 흐름 보조",
      dsColor: "저채도 브라운(대비 완화)",
      dsReason: "가로 비율이 강조된 진단 결과에 따라, 옆볼륨을 줄이고 세로 라인을 만들어 인상을 좁혀 보이게 하기 위함.",
      procedure: "레이어드 컷 + C컬 인컬 + 시스루 뱅",
      result: "옆볼륨이 정리되고 세로 흐름이 생겨 인상이 한결 차분해짐.",
      designerReflection: "진단은 정확했고 디자인 연결 설명도 구체적으로 기록함. 컬러 대비 설명을 더 다듬고 싶음.",
    },
  });
  await prisma.customerCaseSkill.createMany({
    data: [
      { customerCaseId: kase.id, skillId: coreSkill.id },
      { customerCaseId: kase.id, skillId: faceSkill.id },
    ],
  });
  await prisma.feedback.create({
    data: {
      subjectUserId: designer.id,
      authorId: leader.id,
      customerCaseId: kase.id,
      skillId: coreSkill.id,
      strength: "진단(가로 비율)에서 디자인 전략(세로 실루엣)으로의 연결이 명확함.",
      gap: "컬러 선택의 근거가 다소 짧음.",
      message: "진단 → 디자인 연결이 좋아졌습니다. 컬러 선택 이유를 진단과 더 연결해보세요.",
      nextAction: "다음 3건의 케이스에서 컬러 선택 이유를 '진단 근거'와 함께 기록하기.",
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

  // --- Operations Manual (운영 매뉴얼) — sample content (isSeed) ----------
  // All manual content is DATA; admins edit it in the app, never in code.
  const mcBrand = await prisma.manualCategory.create({ data: { name: "브랜드 · 접객", order: 1, isSeed: true } });
  const mcHygiene = await prisma.manualCategory.create({ data: { name: "위생 · 안전", order: 2, isSeed: true } });
  const mcStore = await prisma.manualCategory.create({ data: { name: "매장 운영", order: 3, isSeed: true } });

  await prisma.manual.createMany({
    data: [
      {
        categoryId: mcBrand.id,
        title: "메르시모몽 접객 기본 원칙",
        summary: "모든 직원이 지켜야 할 고객 응대의 기본.",
        content:
          "# 접객 기본 원칙\n\n1. 고객이 들어오면 3초 안에 눈을 맞추고 인사한다.\n2. 상담은 '관찰 → 진단 → 제안' 순서로 진행한다.\n3. 시술 전 반드시 오늘의 디자인 방향을 한 문장으로 확인받는다.\n4. 배웅 시 다음 방문 주기를 안내한다.\n\n> BE YOURSELF — 고객이 스스로의 아름다움을 발견하도록 돕는다.",
        targetRoles: JSON.stringify([]),
        isRequired: true,
        order: 1,
        authorId: admin.id,
        isSeed: true,
      },
      {
        categoryId: mcBrand.id,
        title: "전화 · 예약 응대 스크립트",
        summary: "전화 응대와 예약 접수 표준 멘트.",
        content:
          "# 전화 응대\n\n- 인사: \"안녕하세요, 메르시모몽입니다.\"\n- 예약 확인 항목: 성함 / 연락처 / 원하는 시술 / 희망 시간\n- 마무리: 예약 일시를 다시 한 번 복창한다.",
        targetRoles: JSON.stringify([]),
        isRequired: false,
        order: 2,
        authorId: admin.id,
        isSeed: true,
      },
      {
        categoryId: mcHygiene.id,
        title: "기구 소독 및 위생 관리",
        summary: "시술 도구 소독 주기와 방법 (필독).",
        content:
          "# 위생 관리\n\n1. 가위·빗은 고객마다 소독한다.\n2. 수건은 1회 사용 후 세탁한다.\n3. 소독 로그를 매일 마감 시 기록한다.\n4. 소독액은 주 1회 교체한다.",
        targetRoles: JSON.stringify([]),
        isRequired: true,
        order: 1,
        authorId: admin.id,
        isSeed: true,
      },
      {
        categoryId: mcStore.id,
        title: "오픈 / 마감 체크리스트",
        summary: "매장 오픈·마감 시 확인 항목.",
        content:
          "# 오픈\n- 조명·음악·냉난방 확인\n- 시술 도구 세팅\n- 예약 명단 확인\n\n# 마감\n- 정산\n- 소독 로그 작성\n- 전원·문단속",
        targetRoles: JSON.stringify(["owner", "leader", "admin", "educator"]),
        isRequired: true,
        order: 1,
        authorId: admin.id,
        isSeed: true,
      },
      {
        categoryId: mcStore.id,
        title: "가맹점 운영 가이드",
        summary: "점주용 매장 운영 기준 (점주 전용).",
        content:
          "# 가맹점 운영 가이드\n\n- 브랜드 표준을 매장에 일관되게 적용한다.\n- 직원 교육은 교육 플랫폼의 커리큘럼을 따른다.\n- 월 1회 운영 리포트를 본사와 공유한다.",
        targetRoles: JSON.stringify(["owner", "admin"]),
        isRequired: false,
        order: 2,
        authorId: admin.id,
        isSeed: true,
      },
    ],
  });

  // --- Training Resources (교육자료실) — sample content (isSeed) ----------
  const rcVideo = await prisma.resourceCategory.create({ data: { name: "커트 · 시술 영상", order: 1, isSeed: true } });
  const rcDoc = await prisma.resourceCategory.create({ data: { name: "이론 자료", order: 2, isSeed: true } });

  await prisma.resource.createMany({
    data: [
      {
        categoryId: rcVideo.id,
        title: "레이어드 컷 기본 시연",
        description: "세로 흐름을 만드는 레이어드 컷 시연 영상.",
        type: "video",
        url: "https://www.youtube.com/",
        tags: JSON.stringify(["커트", "레이어드"]),
        targetRoles: JSON.stringify([]),
        lessonId: lesson1.id,
        order: 1,
        authorId: admin.id,
        isSeed: true,
      },
      {
        categoryId: rcVideo.id,
        title: "C컬 인컬 드라이 방법",
        description: "단정한 인상을 만드는 C컬 인컬 드라이.",
        type: "video",
        url: "https://www.youtube.com/",
        tags: JSON.stringify(["드라이", "C컬"]),
        targetRoles: JSON.stringify([]),
        order: 2,
        authorId: admin.id,
        isSeed: true,
      },
      {
        categoryId: rcDoc.id,
        title: "얼굴 비율 진단 가이드 (PDF)",
        description: "가로·세로 비율로 얼굴형을 진단하는 기준 자료.",
        type: "pdf",
        url: "https://example.com/face-ratio.pdf",
        tags: JSON.stringify(["진단", "얼굴분석"]),
        targetRoles: JSON.stringify([]),
        lessonId: lesson2.id,
        order: 1,
        authorId: admin.id,
        isSeed: true,
      },
    ],
  });

  // --- Store System (매장 시스템) — sample checklists + notices (isSeed) ---
  const openTpl = await prisma.checklistTemplate.create({
    data: { name: "오픈 준비", type: "open", order: 1, isSeed: true },
  });
  await prisma.checklistItem.createMany({
    data: [
      { templateId: openTpl.id, label: "조명·음악·냉난방 확인", order: 1 },
      { templateId: openTpl.id, label: "시술 도구 세팅 및 소독 상태 확인", order: 2 },
      { templateId: openTpl.id, label: "오늘 예약 명단 확인", order: 3 },
      { templateId: openTpl.id, label: "수건·비품 재고 확인", order: 4 },
    ],
  });
  const closeTpl = await prisma.checklistTemplate.create({
    data: { name: "마감 정리", type: "close", order: 2, isSeed: true },
  });
  await prisma.checklistItem.createMany({
    data: [
      { templateId: closeTpl.id, label: "정산 완료", order: 1 },
      { templateId: closeTpl.id, label: "기구 소독 및 소독 로그 작성", order: 2 },
      { templateId: closeTpl.id, label: "청소 및 정리 정돈", order: 3 },
      { templateId: closeTpl.id, label: "전원·가스·문단속", order: 4 },
    ],
  });

  await prisma.notice.create({
    data: {
      title: "9월 브랜드 컬러 교육 일정 안내",
      body: "9월 셋째 주 목요일 오후 2시, 본점에서 브랜드 컬러 교육이 진행됩니다. 전 지점 디자이너는 교육자료실의 사전 자료를 확인해주세요.",
      isPinned: true,
      authorId: admin.id,
      isSeed: true,
    },
  });
  await prisma.notice.create({
    data: {
      branchId: branch.id,
      title: "본점 정기 소독 안내 (매주 월요일)",
      body: "매주 월요일 오전 소독을 실시합니다. 마감 시 소독 로그를 반드시 작성해주세요.",
      authorId: admin.id,
      isSeed: true,
    },
  });

  console.log("Seed complete.");
  console.log("Demo logins (password: password123):");
  console.log("  admin@merci.dev / educator@merci.dev / leader@merci.dev / owner@merci.dev / designer@merci.dev / designer2@merci.dev");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
