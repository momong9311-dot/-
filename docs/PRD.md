# PRD — Merci Momong Education & Growth Platform

> 개발 순서 규칙: **Problem → User → Behavior → Data → Relationship → UX → UI → Implementation**
> 이 문서는 Problem → User → Behavior → UX(Flow) 까지를 다룬다. Data/Relationship은 `DATA_MODEL.md`.

---

## 1. Problem — 어떤 문제를 푸는가

메르시모몽은 디자이너를 교육하지만, 지금은 다음을 알 수 없다.

- 교육받은 내용을 **실제 고객에게 적용**했는가?
- 적용한 결과 **역량이 실제로 성장**했는가?
- 어떤 디자이너가 **어디에서 막혀 있는가?**
- 누구를 **지금 도와줘야 하는가?**

기존 LMS는 "수강 완료 %"만 알려준다. 그것은 우리가 필요한 답이 아니다.

**해결하려는 진짜 문제:**
> 교육 → 실습 → 고객 적용 → 평가 → 피드백 → 역량 성장의 흐름이 **끊겨 있어서**,
> 교육이 실제 역량 성장으로 이어졌는지 조직이 알 수 없다.

이 시스템은 그 흐름을 하나로 연결하고, 그 과정을 **조직의 데이터 자산**으로 남긴다.

### 절대 혼동하지 않는 6개 축
Learning · Practice · Application · Evaluation · Feedback · Skill Growth 는
서로 다른 데이터이며, 절대 하나로 합치지 않는다. **완료율은 성장이 아니다.**

---

## 2. Users — 누가 사용하는가

### 2.1 Designer (교육 대상자, 주 사용자)
"그래서 지금 나는 무엇을 해야 하는가?"에 답을 받는 사람.

필요 기능:
- 현재 성장 단계 확인
- 현재 부족한 역량 확인
- 오늘 해야 할 교육 확인
- 학습 / 실습 / 실제 고객 적용
- 평가 / 피드백 확인
- 다음 성장 단계 확인

### 2.2 Leader (지점/팀 리더)
담당 디자이너의 성장을 관리하는 사람.

필요 기능:
- 디자이너 성장 상태 확인
- 실습 확인
- 평가 / 피드백
- 교육 진행 관리

### 2.3 Educator (교육 설계자)
교육 콘텐츠와 기준을 만드는 사람.

필요 기능:
- 교육 과정 관리
- 교육 콘텐츠 관리
- 실습 과제 관리
- 평가 기준 관리
- 피드백

### 2.4 Admin (운영 총괄)
"누가 어디에서 막혀 있고, 내가 무엇을 도와줘야 하는가?"에 답을 받는 사람.

필요 기능(현황 중심):
- 전체 디자이너 성장 현황
- 역량별 분포 · 취약 영역
- 교육 진행률 · 실습 부족
- 평가 대기 · 재교육 필요
- 승급 가능자
- 교육 효과

> Role은 코드 상수가 아니라 데이터(`Role`)로 관리한다. 권한 조합은 확장 가능해야 한다.

---

## 3. Behavior — 사용자의 행동이 어떻게 바뀌는가

| 사용자 | 이전(As-Is) | 이후(To-Be) |
|--------|-------------|-------------|
| Designer | 교육을 "들었다"에서 끝남 | 학습→실습→고객적용→피드백까지 하나의 루프를 돈다 |
| Leader | 감(感)으로 성장 판단 | 역량 데이터로 막힌 지점을 본다 |
| Educator | 콘텐츠가 흩어져 있음 | 콘텐츠·평가기준을 구조로 관리한다 |
| Admin | 완료율만 봄 | 취약 영역·재교육 필요·승급 가능자를 본다 |

핵심 행동 변화: **"교육 완료"로 끝나던 행동이 "고객 적용 + 피드백 반영"으로 이어진다.**

---

## 4. MVP 범위

### 4.1 포함 (Build now)

**Authentication**
- Login (이메일 + 비밀번호)
- Role 기반 접근 제어

**Designer**
- Home (TODAY / CURRENT FOCUS / PRACTICE / FEEDBACK / MY GROWTH / NEXT STEP)
- Curriculum (배정된 커리큘럼 목록·진행)
- Lesson (레슨 학습, 진도 기록)
- Practice (실습 과제 제출)
- Evaluation (평가 결과 열람)
- Feedback (피드백 열람 → Next Action)
- My Growth (역량별 성장, 완료율과 분리)

**Admin** (Educator/Leader 기능 일부 포함)
- Dashboard (현황 요약)
- Designer List
- Designer Detail (한 디자이너의 성장·실습·평가·피드백)
- Curriculum Management (콘텐츠·순서·필수/선택·대상 Level·평가기준·실습과제 CRUD)
- Evaluation Management (평가 기준 관리 · 평가 작성)

**Data (MVP 필수 엔티티)**
User · Role · Skill · Curriculum · Lesson · Practice · Evaluation · Feedback ·
LearningProgress · SkillProgress
(+ Level, Branch, Course, Module 은 콘텐츠 계층상 함께 필요 — `DATA_MODEL.md` 참조)

### 4.2 구조만 준비 (Design now, build later)
- **CustomerCase** — 초기 스키마만. 장기적으로 가장 중요한 교육 데이터.
- **PromotionCriteria** — 승급 기준 구조만. 자동 승급은 하지 않는다.

### 4.3 비범위 (Not now)
- AI 기능 (검색·요약·퀴즈·피드백 초안 등) — 핵심 기능으로 만들지 않는다.
- 복잡한 분석 대시보드/그래프.
- 자동 승급·인사 결정 — **영구 금지** (사람이 결정).

---

## 5. Designer Home — 우선순위

디자이너가 앱을 열었을 때 **가장 먼저 답해야 하는 질문**:
> "그래서 지금 나는 무엇을 해야 하는가?"

우선순위 순서(위에서부터):

1. **TODAY** — 오늘 할 일 (오늘의 교육/실습)
2. **CURRENT FOCUS** — 현재 집중 교육
3. **PRACTICE** — 오늘 해야 할 실습
4. **FEEDBACK** — 최근 피드백 (→ Next Action)
5. **MY GROWTH** — 역량별 성장
6. **NEXT STEP** — 다음 행동 / 다음 성장 단계

레이아웃 스케치:
```
MERCI MOMONG

TODAY            오늘의 교육
CURRENT FOCUS    현재 집중 교육 · CONTINUE
PRACTICE         오늘 해야 할 실습
FEEDBACK         최근 피드백
MY GROWTH        역량별 성장
NEXT STEP        다음 행동
```

---

## 6. Admin Home — 우선순위

관리자가 앱을 열었을 때 **가장 먼저 답해야 하는 질문**:
> "누가 어디에서 막혀 있고, 내가 무엇을 도와줘야 하는가?"

우선 배치 정보:
- 전체 디자이너 / 성장 단계
- 취약 Skill
- 미완료 교육 · 실습 부족
- 평가 대기 · 피드백 필요
- 재교육 필요
- 승급 가능자

> 일반 LMS식 그래프 대시보드가 아니다. **"지금 개입이 필요한 사람"의 리스트**가 먼저다.

---

## 7. 사용자 Flow

### 7.1 Designer — 핵심 학습 루프 (시스템의 심장)
```
Home(TODAY)
  → Lesson 학습        → LearningProgress 생성/갱신
  → Practice 실습 제출  → Practice 생성
  → (실제 고객 적용)     → CustomerCase 생성 (Application)
  → Evaluation 받음     → Evaluation 생성 (행동·역량 평가)
  → Feedback 확인       → Feedback 열람 → Next Action
  → SkillProgress 갱신  → Skill Growth (completion과 분리)
  → NEXT STEP 제시      → 다음 Lesson/Practice
  ↺ 반복 → (기준 충족 시) 승급 후보
```
> 이 루프가 **어디에서도 끊기지 않는 것**이 이 앱의 성공 기준이다.

### 7.2 Designer — My Growth 열람 Flow
```
Home → MY GROWTH
  → Skill 목록 (current_level / target_level)
  → Skill 선택 → growth_history (시간에 따른 변화)
                → practice/application/evaluation/feedback count 분리 표시
  → 취약 Skill → 연결된 다음 교육/실습으로 이동
```

### 7.3 Educator/Admin — 콘텐츠 관리 Flow
```
Curriculum Management
  → Curriculum 선택/생성
  → Course → Module → Lesson 구성 (순서·필수/선택·대상 Level)
  → Lesson 에 Assignment/Practice 연결
  → Evaluation 기준(Criteria) 정의
  → 저장 → 대상 Designer 에게 반영
```
> 모든 콘텐츠는 DB에서 관리한다. 코드 하드코딩 금지.

### 7.4 Leader/Educator — 평가 · 피드백 Flow
```
Designer Detail
  → 제출된 Practice / CustomerCase 확인
  → Evaluation 작성 (Criteria/Observation/Strength/Gap/Next Action/Score)
  → Feedback 작성 (다음 행동으로 연결)
  → SkillProgress 갱신 트리거
  → Designer 의 Home(FEEDBACK)에 노출
```

### 7.5 Admin — 개입 Flow
```
Admin Home
  → 취약 Skill / 평가 대기 / 재교육 필요 / 승급 가능자 리스트
  → 대상 Designer Detail 이동
  → 조치 (재교육 배정 / 평가 요청 / 승급 검토)
```

---

## 8. 성공 기준 (이 제품이 성공했다고 말하려면)

1. Designer가 Home만 보고 "지금 할 일"을 안다.
2. 학습→실습→적용→평가→피드백 루프가 데이터로 **끊김 없이** 이어진다.
3. 완료율과 역량 성장이 **분리**되어 보인다.
4. Admin이 "지금 도와줘야 할 사람"을 즉시 찾는다.
5. 교육 콘텐츠·평가 기준·Level을 **코드 수정 없이** 관리자가 바꾼다.
6. 승급 판단은 데이터가 돕되 **사람이 결정**한다.

---

## 9. 리스크 / 주의

- **완료율 함정**: 어떤 화면도 완료율을 성장으로 표시하지 않는다.
- **콘텐츠 하드코딩 유혹**: 시연을 위해서라도 콘텐츠를 코드에 넣지 않는다(시드는 분리·표시).
- **AI 과속**: MVP에서 AI로 시작하지 않는다.
- **PII**: CustomerCase는 개인정보 최소 저장.
