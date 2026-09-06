# CLAUDE.md — Merci Momong Education Platform

이 문서는 이 저장소에서 작업하는 모든 세션(사람 · Claude)이 **반드시 먼저 읽는** 기준 문서다.
설계 철학과 금지사항을 지키기 위한 것이며, 세부 사양은 `docs/` 문서를 참조한다.

> **직원 전용 앱.** 이 앱은 **메르시모몽 직원(Designer/Leader/Educator/Admin)만** 로그인한다.
> **고객용 기능은 만들지 않는다** — 고객 회원가입·로그인·홈·예약·결제·상담·커뮤니티·리포트·
> 마케팅·공개 프로필·고객용 AI 등. **CustomerCase는 고객용이 아니라, 직원이 실제 고객에게
> 적용한 내용을 내부 교육 목적으로 기록하는 기능이다** (§6, `docs/DATA_MODEL.md` §3.13).

---

## 1. 이 프로젝트가 무엇인가

메르시모몽의 **디자이너 교육 및 성장관리 플랫폼**이다.
일반적인 사내 LMS가 아니다.

최종 목표는 다음 흐름을 **하나의 시스템으로 끊김 없이 연결**하는 것이다.

```
교육 → 학습 → 실습 → 실제 고객 적용 → 평가 → 피드백 → 역량 성장 → 다음 교육 → 반복 → 승급
```

이 시스템의 최종 정체성:
> 메르시모몽의 교육 방법론을 **조직의 데이터 자산**으로 만든다.

---

## 2. 절대 잊으면 안 되는 핵심 질문

이 시스템은 "교육을 받았는가?"를 관리하지 않는다.

**핵심 질문은 이것 하나다:**
> 교육받은 내용을 실제 고객에게 적용했고, 그 결과 디자이너의 역량이 성장했는가?

따라서 다음 6개를 **데이터·화면·로직에서 항상 분리**한다. 하나로 합치지 않는다.

| 구분 | 의미 |
|------|------|
| Learning | 교육 내용을 학습했는가 |
| Practice | 실습(연습)을 했는가 |
| Application | 실제 고객에게 적용했는가 |
| Evaluation | 행동·역량을 평가받았는가 |
| Feedback | 다음 행동으로 연결되는 피드백을 받았는가 |
| Skill Growth | 그래서 역량이 실제로 성장했는가 |

**교육 완료율(completion rate)을 역량 습득(competency)으로 간주하지 않는다.**

---

## 3. 교육 철학 (모든 기능이 여기서 파생된다)

메르시모몽 교육의 핵심은 지식 암기가 아니라 **진단 결과를 실제 디자인으로 연결하는 능력**이다.

기본 사고 구조:
```
관찰 → 진단 → 문제 정의 → 고객 니즈 이해 → 이미지 방향 설정
     → 디자인 전략 → 디자인 요소 선택 → 시술 → 결과 확인 → 피드백
```

이 중 **핵심 역량으로 특별 취급하는 연결**:
> **진단 → 디자인 연결 (Diagnosis → Design)**

평가·피드백·CustomerCase 설계는 모두 이 연결을 관찰·기록·성장시키는 방향으로 만든다.

---

## 4. 개발 순서 (절대 규칙)

**절대 이 순서로 개발하지 않는다:** `UI → DB → 기능`

**반드시 이 순서를 따른다:**
```
Problem → User → Behavior → Data → Relationship → UX → UI → Implementation
```

기능을 추가·수정할 때마다 다음 7개 질문을 통과해야 한다:

1. 어떤 문제를 해결하는가?
2. 누가 사용하는가?
3. 사용자의 행동이 실제로 변하는가?
4. 어떤 데이터가 생성되는가?
5. 기존 시스템과 어떻게 연결되는가?
6. 관리자가 운영(수정)할 수 있는가?
7. MVP에 반드시 필요한가?

**필요성이 낮으면 만들지 않는다.**

---

## 5. 금지사항 (하지 말 것)

- ❌ 예쁜 UI부터 만들기
- ❌ 필요하지 않은 기능 추가
- ❌ AI부터 개발
- ❌ 교육 완료율을 성장률로 표시
- ❌ Skill을 단순 점수 하나로 표현 (Skill은 다차원 데이터다 — §7 참조)
- ❌ 교육 콘텐츠를 코드에 하드코딩
- ❌ 관리자만 수정할 수 있어야 하는 데이터를 코드에 고정
- ❌ 실제 사용자 데이터와 개발/시드 데이터를 혼합
- ❌ 승급·인사·최종 역량 판정을 AI가 자동 결정

---

## 6. 데이터 원칙

- **교육 콘텐츠는 코드에 하드코딩하지 않는다.** 관리자가 다음을 수정할 수 있어야 한다:
  교육 과정 · 모듈 · 레슨 · 교육 내용 · 순서 · 필수/선택 · 대상 Level · 평가 기준 · 실습 과제.
- **성장 단계(Level) 명칭·기준은 하드코딩하지 않는다.** DB의 `Level` 테이블에서 관리한다.
  운영 데이터가 쌓이면 명칭·기준을 바꿀 수 있어야 한다.
- **Skill은 점수 하나가 아니다.** 최소한 다음을 가진다:
  `current_level, target_level, practice_count, application_count, evaluation_count, feedback_count, growth_history`.
- **개발/시드 데이터와 실데이터를 섞지 않는다.** 시드는 명확히 표시(`is_seed` 또는 별도 환경)한다.
- **CustomerCase는 개인정보를 최소한으로 저장한다.**

---

## 7. Skill 데이터 (한 줄 요약)

Skill을 "70점" 같은 단일 값으로 표현하지 않는다. 각 Skill은 최소한:
`current_level` / `target_level` / `practice_count` / `application_count` /
`evaluation_count` / `feedback_count` / `growth_history` 를 갖는다.
자세한 내용은 `docs/DATA_MODEL.md`.

---

## 8. 평가 원칙

평가는 **사람이 아니라 행동·역량**을 평가한다. 평가 항목은 가능한 한 다음을 포함한다:
`Criteria / Observation / Strength / Gap / Next Action / Score`.

- 나쁜 평가: "아쉬움."
- 좋은 평가: "얼굴의 가로 비율은 정확히 관찰했지만, 그 특징을 디자인 요소로 연결하는 설명이 부족함."

피드백은 반드시 **다음 행동(Next Action)으로 연결**되어야 한다.

---

## 9. AI 원칙

- AI는 교육자를 대체하지 않는다. MVP에서 AI는 핵심 기능이 아니다.
- AI가 자동으로 결정하면 안 되는 것: **승급 · 인사 · 최종 역량 판정.**
- 최종 판단은 **항상 사람**이 한다.
- 향후 AI는 보조 도구로만: 자료 검색 · 요약 · 퀴즈 생성 · 복습 질문 · 취약 역량 분석 · 피드백 초안 · 유사 CustomerCase 검색 등.

---

## 10. UX / 브랜드 원칙

메르시모몽 브랜드 방향성을 유지한다.

- 색: White · Black · Gray · Minimal Accent
- 톤: Editorial · Premium · Calm
- 일반적인 LMS의 복잡한 Dashboard UI를 만들지 않는다.
- "사내 LMS"가 아니라 **메르시모몽의 내부 성장 플랫폼**처럼 느껴져야 한다.
- 과도한 카드/배지/그래프/색상/아이콘을 쓰지 않는다.

자세한 내용은 `docs/DESIGN_SYSTEM.md`.

---

## 11. MVP 범위 (지금 만드는 것만)

- **Auth**: Login, Role
- **Designer**: Home, Curriculum, Lesson, Practice, Evaluation, Feedback, My Growth
- **Admin**: Dashboard, Designer List, Designer Detail, Curriculum Management, Evaluation Management
- **Data**: User, Role, Skill, Curriculum, Lesson, Practice, Evaluation, Feedback, LearningProgress, SkillProgress
- **CustomerCase / PromotionCriteria**: 초기 구조만 준비, 이후 확장.
- **AI**: MVP 핵심 기능 아님.

자세한 범위·비범위는 `docs/PRD.md` §MVP.

---

## 12. 기술 스택 (제안 — 확정 전 사용자 확인 필요)

현재 환경: Node 22, pnpm 10, Python 3.11, Docker, Supabase MCP 사용 가능.

**제안 스택** (단순·유지보수·현대적 기준):
- Frontend: React + Vite + TypeScript (`app/frontend`)
- Backend: Node.js + TypeScript, Fastify (`app/backend`)
- DB: PostgreSQL (로컬 Docker / Supabase), ORM: Prisma — schema를 데이터 모델의 single source of truth로 사용
- Auth: 이메일+비밀번호 세션 기반 (MVP), Role 기반 접근제어

이 스택은 **확정이 아니다.** 구현 착수 전 사용자 승인을 받는다.

---

## 13. 문서 지도

| 문서 | 내용 |
|------|------|
| `docs/PRD.md` | 제품 요구사항, 사용자, MVP 범위, 사용자 Flow |
| `docs/EDUCATION_SYSTEM.md` | 교육 방법론, 콘텐츠 계층, 성장/평가 로직 |
| `docs/DATA_MODEL.md` | Entity, 관계(ERD), 필드, Skill/성장 모델 |
| `docs/DESIGN_SYSTEM.md` | 색·타이포·컴포넌트·화면 톤 |

---

## 14. 현재 상태 — MVP 구현 완료 (검증됨)

- [x] 프로젝트 구조 생성
- [x] 설계 문서 (PRD / EDUCATION_SYSTEM / DATA_MODEL / DESIGN_SYSTEM)
- [x] STEP 1 — DB 스키마 (엔티티 19개 + 관계), Prisma
- [x] STEP 2 — 인증 + Role 기반 접근제어 (designer/leader/educator/admin)
- [x] STEP 3 — Designer Home (TODAY/CURRENT FOCUS/PRACTICE/FEEDBACK/MY GROWTH/NEXT STEP)
- [x] STEP 4 — Education (Curriculum→Course→Module→Lesson) + 학습 진행 저장
- [x] STEP 5 — Practice (Assignment/User/Skill/Status/SubmittedAt/Evidence/Reflection)
- [x] STEP 6 — Evaluation (Criteria/Observation/Strength/Gap/Next Action/Score/Evaluator)
- [x] STEP 7 — Feedback (→ 다음 행동 연결)
- [x] STEP 8 — My Growth (Skill별 다차원 + Growth History, 왜 성장/정체인지)
- [x] STEP 9 — Admin Dashboard (성장/막힘/취약 Skill/실습부족/평가대기/피드백필요)
- [x] 시드 데이터 (`isSeed=true`로 실데이터와 분리)
- [x] E2E 검증 (로그인→학습→실습→평가→피드백→성장→관리자 현황)

### 실행 방법
```bash
pnpm setup     # 설치 + prisma generate + migrate + seed (최초 1회)
pnpm dev       # backend(:4000) + frontend(:5173) 동시 실행
```
데모 계정 (비밀번호 `password123`): `designer@merci.dev` · `leader@merci.dev`
· `educator@merci.dev` · `admin@merci.dev`

### DB 관련 결정 (중요)
- 이 컨테이너에 Docker 데몬이 없어 dev/MVP는 **SQLite(Prisma)** 로 구동한다.
- 스키마는 **Postgres 이식 가능**하게 작성됨 (enum/json → String). 운영 전환 시
  `schema.prisma`의 `provider`를 `postgresql`로 바꾸고 `DATABASE_URL` 설정.

### CASES (CustomerCase 실기능) — 구현 완료 (검증됨)
- 직원 전용 하단 내비게이션: **HOME / TRAINING / CASES / GROWTH / MY** (+관리자 ADMIN)
- CASE CRUD: 생성(draft)·편집·상세·완료 + MY CASES 목록
- CASE 필드: 고객 맥락 + 관찰→진단→문제→이미지방향 + **Design Strategy 구조화(ds_* + ds_reason)** + 시술/결과 + 회고 + 관련 역량(다대다)
- **완료(complete) 시에만** 주요·관련 Skill의 `applicationCount` 1회 증가 → Application 축 실동작
- 관리자: 사례 리뷰 큐(`/admin/cases`) + 사례 상세에서 평가(dimension=design_connection)+피드백
- 권한: 일반 Designer는 **타인의 사례 열람 불가**(403), 관리자만 열람/평가
- 개인정보 최소화: 이름·전화·주소·생년월일 미저장

### 운영 플랫폼 확장 (진행 중)
직원 교육 플랫폼을 **직원 + 점주(가맹점주)** 대상의 내부 운영 플랫폼으로 확장한다.
**고객은 여전히 제외** — 고객 접점(예약·상담·리포트)은 별도 앱(3WAY)이 담당한다.
- [x] **운영 매뉴얼 (운영 매뉴얼)** — 카테고리별 문서 열람·검색, 역할별 공개 대상(`targetRoles`),
  **필독(isRequired)** 지정 시 버전별 읽음 확인(ReadReceipt), 관리자 CRUD + 확인 현황.
  콘텐츠는 전부 DB(관리자 편집), 코드 하드코딩 X. 모델: `ManualCategory / Manual / ManualReadReceipt`.
- [x] `owner`(점주) 역할 추가 (로그인 `owner@merci.dev`), 하단 탭에 **매뉴얼** 추가.
- [x] **교육자료실 (교육자료실)** — 영상·PDF·링크 자료를 카테고리별로 정리, 유형 필터·검색,
  역할별 공개(`targetRoles`), **레슨 연결**(교육과 연결), 관리자 CRUD. URL 참조 방식
  (파일 업로드는 이후). 모델: `ResourceCategory / Resource`. 진입: TRAINING 화면 상단 링크.
- [ ] 매장 시스템(체크리스트·공지), 가맹점 관리 — 이후 단계.

### 다음 Phase (아직 안 함)
- PromotionCriteria 기반 승급 후보 표시 (자동 승급은 영구 금지)
- CASE 이미지 실제 업로드(현재는 참조 URL/메모)
- AI 보조 기능 (검색/요약/피드백 초안 등)
- 관리자 콘텐츠 CRUD 확장 (Curriculum/Course/Module 생성 UI — 현재 Lesson 중심)
