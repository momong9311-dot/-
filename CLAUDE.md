# CLAUDE.md — Merci Momong Platform

이 문서는 이 저장소에서 작업하는 모든 세션(사람 · Claude)이 **반드시 먼저 읽는** 기준 문서다.
설계 철학과 금지사항을 지키기 위한 것이며, 세부 사양은 `docs/` 문서를 참조한다.

> **이 저장소는 두 영역으로 나뉜다.**
>
> 1. **직원용 — 교육·성장 플랫폼** (`app/frontend`, `app/backend`, `database`)
>    메르시모몽 직원(Designer/Leader/Educator/Admin)만 로그인한다. §1–§14가 이 영역의 기준이다.
>    **CustomerCase는 고객용이 아니라, 직원이 실제 고객에게 적용한 내용을 내부 교육 목적으로
>    기록하는 기능이다** (§6, `docs/DATA_MODEL.md` §3.13).
> 2. **고객용 — 매장 서비스 북** (`app/servicebook`)
>    매장 iPad에서 고객이 직접 보는 서비스 브로셔. 시술별 차이·추천 대상·과정·효과·시간·가격을
>    보여 주고, 디자이너가 로그인하면 개인 메뉴판으로 바뀐다. 기준은 §15.
>
> 두 영역의 데이터·인증·화면을 섞지 않는다. 고객용 영역에서 직원용 데이터(Skill·평가·피드백·
> CustomerCase 등)를 읽거나 보여 주지 않는다.

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

### 다음 Phase (아직 안 함)
- PromotionCriteria 기반 승급 후보 표시 (자동 승급은 영구 금지)
- CASE 이미지 실제 업로드(현재는 참조 URL/메모)
- AI 보조 기능 (검색/요약/피드백 초안 등)
- 관리자 콘텐츠 CRUD 확장 (Curriculum/Course/Module 생성 UI — 현재 Lesson 중심)

---

## 15. 고객용 — 매장 서비스 북 (`app/servicebook`)

### 무엇인가
매장 iPad에서 고객이 스스로 넘겨 보는 서비스 브로셔다. 고객이 시술을 제대로 이해하고 가치를 느끼게 하는 것이 목적이다.
- 서비스 메뉴 (헤어컨설팅 · 컷 · 펌·매직 · 맨즈 · 컬러 · 클리닉·두피 · 디자이너 시그니처)
- 시술 상세: 추천 대상 · 시술 과정 · 사용 제품 · 기대 효과 · 소요 시간 · 가격 · 홈케어
- 고민으로 찾기 · 시술 비교(최대 3개) · 혜택 안내 · 디자이너 소개
- 디자이너별 가격 전환, **디자이너 로그인 시 개인 메뉴판**

### 원칙
- **고객 계정은 만들지 않는다.** 고객 로그인·회원가입·예약·결제·상담 기록·개인정보 수집 없음. 예약은 네이버 예약으로 안내만 한다.
- **고객의 선택(고민·비교함)은 화면 안에서만 쓰고 저장하지 않는다.** 3분 무입력 시 처음 화면으로 돌아가며 비운다.
- **로그인 후에만 메뉴판을 연다** (모몽 OS처럼). 앱을 열면 모몽 OS와 같은 로그인 화면이 나온다 — **지점 · 이름 · 공용 코드** → 시작하기, 로그인 유지 스위치. 로그인하면 **그 디자이너의 메뉴·가격만** 보이고, 다른 디자이너의 메뉴·가격·소개는 어디에도 보이지 않는다.
- **지점과 공용 코드는 `src/data.js`의 `BRANCHES`에서 관리한다** (지점 이름 · 공용 코드 · 소속 디자이너). 이름은 그 지점 소속 디자이너만 통과한다.
- **이 로그인은 기기 안에서만 동작하는 화면 잠금이다.** 공용 코드는 페이지 소스에 들어 있어 서버 인증이 아니므로 민감한 데이터를 두지 않는다. 디자이너별 실제 인증이 필요해지면 직원용 Auth와 분리된 방식으로 별도 설계한다.
- **가격·메뉴의 기준은 네이버 예약이다.** 메뉴명·가격·정가·설명·주의 문구는 네이버 원문을 따르고, 확인 날짜는 `src/data.js`의 `SOURCE_DATE`와 직원 화면에 남긴다. 코드에 손으로 고친 가격을 섞지 않는다 — 네이버에서 다시 가져와 갱신한다.
- **이 화면은 고객이 본다.** 데이터 출처·확인 날짜·'예상' 같은 내부 표시·로그인 버튼 등 직원용 요소를 고객 화면에 노출하지 않는다. 고객에게는 고객의 말로 안내한다 (예: "금액은 디자이너·기장·모발 상태에 따라 달라질 수 있어요").
- **디자이너가 로그인하면 먼저 고객 유형을 고른다** — 지정 예약(디자이너 본인 가격) / 첫방문(첫방문 혜택가, 혜택이 없는 메뉴는 일반 가격과 "적용되지 않는 메뉴" 안내). 바꾸기와 로그아웃은 내 메뉴판 설정에서 공용 코드를 입력한 뒤에만 할 수 있다.
- **로그인 후 설정(고객 유형·로그아웃)은 숨겨진 입구로만 연다** — 상단 제목을 1.5초 길게 누르기 + 공용 코드. 데이터 출처와 확인 날짜는 직원 화면에만 보여 준다.
- **확인되지 않은 정보는 코드에서 구분한다.** 소요 시간·단계별 시간·효과 점수·유지 기간 등 네이버에 없는 값은 `src/data.js`에서 `est:true`로 표시해 두고, 고객 화면에는 "약 ○분", "모발 상태에 따라 달라질 수 있어요"처럼만 안내한다. 매장 확인 후 실제 값으로 바꾼다.
- **지어낸 혜택·증정품·서비스를 넣지 않는다.** 매장에서 실제로 제공하는 것만 쓴다.

### 모바일 브로셔 (`src/brochure.html` → `brochure.html`)
- 고객용 매거진형 브로셔. 서비스 북과 **같은 데이터**(`src/data.js`, `data/prices.json`)와 **같은 로그인**(지점 · 이름 · 공용 코드 → 고객 유형, 설정은 페이지 머리줄 1.5초 길게 누르기 + 공용 코드)을 쓴다 — 메뉴·가격을 따로 적지 않는다.
- 로그인하면 **그 디자이너의 메뉴·가격만** 보인다 (지정 예약가 또는 첫방문 혜택가). 다른 디자이너의 메뉴·소개는 보이지 않고, 이름은 표지 맨 위와 디자이너 소개에만 쓴다.
- 룩북 톤: 흰 종이 페이지 · 얇고 촘촘한 대문자 헤드라인(Pretendard 500) · 작은 본문 · 테두리 알약 라벨 · 얇은 선 목록 · 번호 01. · 넉넉한 여백과 비대칭 배치 · 'Price Range' 가격 표기. 한글 본문은 양쪽 정렬하지 않는다. **가독성 우선** — 본문 13.5px 이상, 작은 라벨 12px 이상, 메뉴명 17px, 가격 15px. 위쪽 고정 챕터 탭으로 바로 이동하고, 메뉴는 + 아이콘으로 펼친다. 사진은 `photos/` + `src/data.js`의 `PHOTOS`로 관리한다. 매장 사진이 우선이다. AI로 만든 인물·스타일·정물 사진도 쓸 수 있다(사용자 승인) — 단 연출 이미지로만 쓰고, 실제 고객 사례·특정 디자이너의 작업·비포/애프터로 소개하지 않으며, 브로셔 끝에 "연출 이미지" 안내를 둔다.

### UX / 브랜드
- 모몽 OS 글래스 UI를 따른다: 회색 방사형 바탕 · 유리 카드 · 페리윙클 포인트 알약 · 정사각 아이콘 타일 · 하단 떠 있는 알약 내비.
- **iPad 세로가 기본 화면이다** (768–1024px 폭, 콘텐츠 최대 880px 한 칼럼). 가로로 돌려도 같은 폭으로 가운데 정렬한다.
- 폰트는 Pretendard. 터치 타깃 44px 이상, 휴대폰 폭까지 가로 스크롤 없음.
- 한 화면에 핵심 하나. 고객이 설명 없이 다음 행동을 알 수 있어야 한다.
- **개인 메뉴판(디자이너 로그인)에서는 디자이너 이름을 화면 맨 위에 한 번만 쓴다.** 메뉴 칩·담당 표시·가격 라벨·메뉴명 속 이름(예: "유선쌤 시그니처펌" → "시그니처펌")을 반복하지 않는다.
