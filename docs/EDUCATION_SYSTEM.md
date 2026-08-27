# EDUCATION_SYSTEM — 교육 방법론과 시스템 로직

이 문서는 메르시모몽 교육의 **방법론**을, 그것을 담는 **콘텐츠 계층**과 **성장/평가 로직**으로
번역한다. 데이터 필드 정의는 `DATA_MODEL.md`에서 다룬다.

---

## 1. 교육 철학

메르시모몽 교육의 핵심은 **지식 암기가 아니라 진단 결과를 실제 디자인으로 연결하는 능력**이다.

기본 사고 구조 (디자이너가 고객 앞에서 실제로 밟는 단계):
```
관찰 → 진단 → 문제 정의 → 고객 니즈 이해 → 이미지 방향 설정
     → 디자인 전략 → 디자인 요소 선택 → 시술 → 결과 확인 → 피드백
```

이 사고 구조는 시스템 곳곳에 반영된다:
- **Lesson**은 이 단계 중 하나 이상을 가르친다.
- **Practice/CustomerCase**는 이 단계를 실제로 수행한 기록이다.
- **Evaluation**은 이 단계의 수행을 관찰·평가한다.

### 핵심 연결: 진단 → 디자인
가장 중요하게 취급하는 역량은 **진단 결과를 디자인으로 연결하는 능력**이다.
평가 기준·피드백·CustomerCase는 이 연결을 관찰·기록·성장시키도록 설계한다.

---

## 2. 6개 축의 분리 (다시 강조)

교육 시스템의 모든 데이터는 아래 6개 축 중 하나에 속한다. 서로 합치지 않는다.

```
Learning     — 배웠다        (LearningProgress)
Practice     — 연습했다      (Practice)
Application  — 고객에 적용했다 (CustomerCase)
Evaluation   — 평가받았다    (Evaluation)
Feedback     — 피드백받았다  (Feedback)
Skill Growth — 성장했다      (SkillProgress / growth_history)
```

**완료율(Learning)은 성장(Skill Growth)이 아니다.** 이 경계를 시스템이 강제한다.

---

## 3. 교육 콘텐츠 계층

교육은 다음 계층으로 설계한다. 모두 **DB에서 관리(하드코딩 금지)**.

```
Education Area          (교육 영역: 예 - 디자인, 상담, 판매)
  └─ Skill              (역량: 예 - 얼굴 분석, 진단→디자인 연결)
       └─ Curriculum    (역량을 키우는 커리큘럼)
            └─ Course   (묶음 과정)
                 └─ Module     (모듈)
                      └─ Lesson (레슨: 실제 학습 단위)
                           ├─ Assignment  (과제)
                           ├─ Practice    (실습)
                           ├─ Evaluation  (평가)
                           └─ Feedback    (피드백)
                                └─ Skill Progress (역량 반영)
```

### 관리자가 코드 수정 없이 바꿀 수 있어야 하는 것
- 교육 과정 / 모듈 / 레슨 / 교육 내용
- 순서(ordering)
- 필수 / 선택 (required flag)
- 대상 Level (target level)
- 평가 기준 (evaluation criteria)
- 실습 과제 (practice assignment)

> 계층은 고정이지만 **내용·순서·구성은 전부 데이터다.**

---

## 4. 초기 Skill 구조

초기 Skill 목록 (운영하며 확장·수정 가능, 하드코딩 아님):

| # | Skill | Education Area(예시) |
|---|-------|----------------------|
| 1 | 상담 | 상담 |
| 2 | 얼굴 분석 | 진단 |
| 3 | 골격 이미지 | 진단 |
| 4 | 퍼스널 컬러 | 진단 |
| 5 | **디자인 연결** | 디자인 (★핵심 역량) |
| 6 | 모질 분석 | 진단 |
| 7 | 커트 | 시술 |
| 8 | 펌 | 시술 |
| 9 | 컬러 | 시술 |
| 10 | 스타일링 | 시술 |
| 11 | 고객 커뮤니케이션 | 상담 |
| 12 | 판매 | 판매 |
| 13 | 콘텐츠 | 콘텐츠 |
| 14 | 리더십 | 리더십 |

각 Skill이 최소한 갖는 데이터 (점수 하나가 아니다):
```
current_level        현재 역량 단계
target_level         목표 역량 단계
practice_count       실습 횟수
application_count    고객 적용 횟수
evaluation_count     평가 횟수
feedback_count       피드백 횟수
growth_history       성장 이력 (시간에 따른 변화 로그)
```

---

## 5. 성장 단계 (Level)

**근속기간이 아니라 역량을 기준**으로 성장한다.

초기 단계 (명칭·기준은 DB `Level`에서 관리, 하드코딩 금지):

| Level | 이름 | 성격 |
|-------|------|------|
| 01 | FOUNDATION | 기초 |
| 02 | PRACTICE | 실습 |
| 03 | APPLICATION | 고객 적용 |
| 04 | DESIGNER | 디자이너 |
| 05 | ADVANCED | 심화 |
| 06 | LEADER | 리더 |

> 향후 실제 운영 데이터를 바탕으로 명칭과 기준을 수정할 수 있어야 한다.
> 따라서 Level 명칭/순서/기준은 코드가 아니라 데이터로 존재한다.

성장은 개별 Skill 단위(`SkillProgress.current_level`)와
전체 단계 단위(`User.level`) 두 층위로 본다.

---

## 6. 평가 시스템

평가는 **사람을 평가하는 것이 아니라 행동과 역량을 평가**한다.

평가는 가능한 한 다음 항목을 갖는다:

| 항목 | 의미 |
|------|------|
| Criteria | 무엇을 기준으로 보는가 |
| Observation | 실제로 관찰된 사실 |
| Strength | 잘한 점 |
| Gap | 부족한 점 |
| Next Action | 다음에 할 구체 행동 |
| Score | (선택) 점수 — 단독으로 성장을 대표하지 않음 |

예시:
- ❌ 나쁜 평가: "아쉬움."
- ✅ 좋은 평가: "얼굴의 가로 비율은 정확하게 관찰했지만, 그 특징을 **디자인 요소로 연결하는 설명**이 부족함."

> 좋은 평가는 **진단 → 디자인 연결**의 관점에서 구체적으로 서술된다.

### 피드백
피드백은 반드시 **다음 행동(Next Action)으로 연결**된다.
피드백은 Designer Home의 FEEDBACK에 노출되고, NEXT STEP으로 이어진다.

---

## 7. Customer Case (Application)

실제 고객 사례는 **장기적으로 가장 중요한 교육 데이터**다.
MVP에서는 구조만 준비하고 이후 확장한다.

CustomerCase에 가능하면 연결하는 항목 (교육 사고 구조와 1:1 대응):
- 고객 니즈
- 현재 상태
- 관찰 (Observation)
- 진단 (Diagnosis)
- 문제 정의
- 이미지 방향
- 디자인 전략
- 디자인 요소
- 시술
- Before / After
- 결과
- 디자이너
- 교육 포인트 (이 케이스에서 배운 것)
- 평가 (연결된 Evaluation)
- 피드백 (연결된 Feedback)

> **개인정보는 최소한으로 저장한다.** 고객 식별정보 대신 익명/최소 필드를 쓴다.
> CustomerCase는 "교육 사고 구조가 실제로 수행되었는가"의 증거다.

---

## 8. 성장 로직 — 완료율과 성장의 분리

시스템이 지켜야 할 계산 원칙:

1. **LearningProgress(완료율)** 는 "배웠다"의 지표일 뿐이다.
   - Home/My Growth에서 완료율을 "성장"이라고 라벨링하지 않는다.
2. **SkillProgress(성장)** 는 practice/application/evaluation/feedback 이
   함께 반영된 결과다. 완료만으로 올라가지 않는다.
3. `growth_history`는 **변화의 근거(어떤 평가/피드백/적용으로 올랐는가)** 를 남긴다.
4. 승급 후보는 `PromotionCriteria`로 **판단을 돕되**, 최종 결정은 사람이 한다.

의사 로직(개념):
```
SkillProgress.current_level 상승 조건 =
    충분한 Learning(전제)  AND
    충분한 Practice        AND
    Application(고객 적용) 증거  AND
    Evaluation(역량 확인)  AND
    Feedback 반영
→ 이때만 growth_history에 상승 기록
```
> 정확한 임계값은 운영 데이터로 조정한다. 따라서 이 기준도 데이터/설정으로 뺀다.

---

## 9. AI의 자리 (보조자, MVP 비핵심)

AI는 교육자를 대체하지 않는다. 향후 보조 기능으로만:
교육자료 검색 · 교육 내용 요약 · 퀴즈 생성 · 복습 질문 · 실습 과제 생성 ·
취약 역량 분석 · 다음 교육 추천 · 피드백 초안 · 유사 CustomerCase 검색 · 교육 성과 분석.

**AI가 자동으로 결정하면 안 되는 것: 승급 · 인사 · 최종 역량 판정. 최종 판단은 사람.**

---

## 10. 이 문서에서 파생되는 불변식 (구현 시 검증할 것)

- [ ] Learning / Practice / Application / Evaluation / Feedback / Growth 는 서로 다른 테이블/축이다.
- [ ] 완료율을 성장으로 표기하는 화면·필드가 없다.
- [ ] Skill은 단일 점수가 아니라 다차원(6+1 필드)이다.
- [ ] Level·콘텐츠·평가기준·실습과제는 DB에서 온다 (코드 상수 아님).
- [ ] CustomerCase는 교육 사고 구조 단계와 매핑된다.
- [ ] 평가는 Criteria/Observation/Strength/Gap/Next Action(/Score) 구조를 지원한다.
- [ ] 승급은 자동 결정되지 않는다.
