# DESIGN_SYSTEM — 시각 · 톤 · 컴포넌트 원칙

> 이 앱은 "사내 LMS"가 아니라 **메르시모몽의 내부 성장 플랫폼**처럼 느껴져야 한다.
> Editorial · Premium · Calm. 복잡한 대시보드 UI를 만들지 않는다.

---

## 1. 브랜드 방향

| 축 | 값 |
|----|----|
| 색 | White · Black · Gray · Minimal Accent |
| 톤 | Editorial · Premium · Calm |
| 밀도 | 여백 많은 저밀도. 한 화면 = 한 가지 답 |
| 인상 | 잡지/에디토리얼. 과한 카드·배지·그래프·색·아이콘 없음 |

**금지:** 화려한 색, 다수의 배지, 원형 진행 그래프 남발, 알록달록 아이콘, 무거운 그림자.

---

## 2. 색 (Color Tokens)

기본은 무채색. Accent는 **아주 절제해서** 강조 하나에만.

```
--color-bg          #FFFFFF   배경
--color-surface     #FAFAFA   카드/구획 (거의 배경과 동일)
--color-border      #ECECEC   가는 경계선
--color-text        #111111   본문(거의 블랙)
--color-text-muted  #6B6B6B   보조 텍스트(그레이)
--color-text-faint  #9B9B9B   캡션/메타
--color-accent      #111111   강조(기본은 블랙 그 자체)
--color-accent-soft #F0EFEC   따뜻한 오프화이트 강조면 (선택)
```

- 상태색(성공/경고/에러)은 최소한으로, 채도 낮게. 성장/완료를 색으로 요란하게 표현하지 않는다.
- **완료율을 초록색 등으로 "성장처럼" 강조하지 않는다** (철학 위반).

---

## 3. 타이포그래피

에디토리얼 감성: 제목은 크고 조용하게, 본문은 읽기 편하게.

```
--font-sans: "Pretendard", system-ui, -apple-system, "Segoe UI", sans-serif;
```

| 역할 | 크기(예) | 웨이트 | 비고 |
|------|---------|--------|------|
| Display (섹션 라벨) | 12–13px | 500, letter-spacing 넓게, 대문자 | `TODAY`, `MY GROWTH` |
| H1 | 28–32px | 600 | 화면 제목 |
| H2 | 20–22px | 600 | |
| Body | 15–16px | 400 | |
| Caption/Meta | 12–13px | 400 | muted/faint |

- 섹션 헤더(`TODAY`, `NEXT STEP`)는 **대문자 + 넓은 자간**의 조용한 라벨로.
- 한글 본문 가독성 우선(Pretendard 계열 권장).

---

## 4. 레이아웃 / 스페이싱

- 8pt 그리드. 여백을 아끼지 않는다.
- 모바일 우선(디자이너는 현장에서 폰으로 본다). 단일 컬럼, 세로 흐름.
- 한 화면은 하나의 질문에 답한다. 정보를 쌓아 대시보드로 만들지 않는다.

```
--space-1: 4px   --space-2: 8px   --space-3: 12px
--space-4: 16px  --space-6: 24px  --space-8: 32px  --space-12: 48px
--radius: 10px          부드럽지만 과하지 않게
--border: 1px solid var(--color-border)
```

---

## 5. 컴포넌트 원칙

에디토리얼 리스트 중심. 카드 남용 금지.

- **Section**: 대문자 라벨 + 얇은 구분선 + 콘텐츠. (Home의 TODAY/FEEDBACK 등)
- **List Row**: 제목 + 보조텍스트 + 우측 진입(chevron). 카드 대신 행(row) 우선.
- **Growth Row**: Skill명 + current→target(텍스트/얇은 바) — **완료율과 분리 표기**.
  - 성장은 "레벨 이동"으로, 완료율은 별개 라벨로. 둘을 같은 바에 합치지 않는다.
- **Feedback Block**: 피드백 본문 + **Next Action** 강조(다음 행동으로 연결).
- **Button**: 기본은 블랙 채움 1개(주요 행동)만. 나머지는 텍스트/보더 버튼.
- **Empty State**: 조용한 안내 한 줄. "지금 할 일 없음"도 차분하게.

지양: 다색 배지, 도넛/파이 차트, 3개 이상 강조색, 진동하는 알림, 무거운 카드 그림자.

---

## 6. Designer Home 화면 톤 (레퍼런스)

```
MERCI MOMONG                         ← 조용한 워드마크

TODAY                                ← 대문자 섹션 라벨
오늘의 교육 · 진단→디자인 연결 Lesson 2
[ CONTINUE ]                         ← 블랙 버튼 하나

CURRENT FOCUS
현재 집중 교육: 얼굴 분석

PRACTICE
오늘 해야 할 실습 1건            >

FEEDBACK
"가로 비율 관찰은 정확. 디자인 요소 연결 설명 보강."
NEXT ACTION → 다음 실습에서 연결 설명 포함        >

MY GROWTH
얼굴 분석      L2 → L3
디자인 연결    L1 → L3   (핵심)

NEXT STEP
다음 행동: 실습 제출 후 평가 요청
```

> 요란한 그래프 없이, 텍스트와 여백으로 "지금 할 일"이 한눈에 보이는 것이 목표.

---

## 7. Admin 화면 톤

- 그래프 대시보드가 아니라 **"개입이 필요한 사람" 리스트**가 먼저.
- 리스트: 이름 · 성장 단계 · 취약 Skill · 상태 태그(평가 대기/재교육 필요/승급 가능).
- 상태 태그는 무채색 톤. 색으로 경보하지 않고, 텍스트로 명확히.

```
DESIGNERS

김OO   L2   취약: 디자인 연결        평가 대기 >
이OO   L3   취약: 컬러               재교육 필요 >
박OO   L4   —                       승급 가능 >
```

---

## 8. 접근성 / 반응형

- 텍스트 대비 충분히(본문 #111 on #FFF). muted도 가독 유지.
- 터치 타깃 ≥ 44px. 모바일 우선, 데스크톱은 중앙 정렬 단일 컬럼 확장.
- 다크모드는 MVP 비범위(추후). 도입 시 무채색 반전으로 톤 유지.

---

## 9. 구현 메모

- 디자인 토큰을 CSS 변수(또는 Tailwind theme)로 한 곳에서 관리.
- 컴포넌트는 최소 세트로 시작: Section, ListRow, GrowthRow, FeedbackBlock, Button, Tag, EmptyState.
- 새 컴포넌트를 만들기 전에 "이게 정말 필요한가?"(CLAUDE.md §4 7질문)를 통과시킨다.
