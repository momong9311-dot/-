# Merci Momong — Education & Growth Platform

메르시모몽 디자이너의 **교육 · 성장관리 플랫폼**.
일반적인 사내 LMS가 아니다. 목표는 다음 흐름을 하나의 시스템으로 연결하는 것이다.

```
교육 → 학습 → 실습 → 실제 고객 적용 → 평가 → 피드백 → 역량 성장 → 다음 교육 → 승급
```

핵심 질문:
> 교육받은 내용을 실제 고객에게 적용했고, 그 결과 디자이너의 역량이 성장했는가?

**교육 완료율 ≠ 역량 성장.** 이 둘을 시스템 전체에서 분리한다.

---

## 문서

| 문서 | 내용 |
|------|------|
| [CLAUDE.md](./CLAUDE.md) | 작업 기준 · 철학 · 금지사항 (먼저 읽기) |
| [docs/PRD.md](./docs/PRD.md) | 제품 요구사항 · 사용자 · MVP · Flow |
| [docs/EDUCATION_SYSTEM.md](./docs/EDUCATION_SYSTEM.md) | 교육 방법론 · 콘텐츠 계층 · 성장/평가 로직 |
| [docs/DATA_MODEL.md](./docs/DATA_MODEL.md) | Entity · 관계(ERD) · Skill/성장 모델 |
| [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) | 색 · 타이포 · 컴포넌트 · 톤 |

---

## 프로젝트 구조

```
.
├── CLAUDE.md               # 작업 기준 문서
├── README.md
├── docs/                   # 설계 문서
│   ├── PRD.md
│   ├── EDUCATION_SYSTEM.md
│   ├── DATA_MODEL.md
│   └── DESIGN_SYSTEM.md
├── app/
│   ├── frontend/           # 사용자 화면 (구현 예정)
│   └── backend/            # API (구현 예정)
├── database/               # 스키마 · 마이그레이션 · 시드 (구현 예정)
└── tests/
```

---

## 현재 상태 — MVP 구현 완료 (E2E 검증됨)

교육 → 학습 → 실습 → 평가 → 피드백 → 성장 확인 흐름이 실제로 작동한다.

- [x] STEP 1 DB 스키마 · [x] STEP 2 인증/권한 · [x] STEP 3 Designer Home
- [x] STEP 4 Education · [x] STEP 5 Practice · [x] STEP 6 Evaluation
- [x] STEP 7 Feedback · [x] STEP 8 My Growth · [x] STEP 9 Admin Dashboard

## 실행

```bash
pnpm setup     # 설치 + DB 마이그레이션 + 시드 (최초 1회)
pnpm dev       # backend(:4000) + frontend(:5173)
```

데모 계정 (비밀번호 `password123`):
`designer@merci.dev` · `leader@merci.dev` · `educator@merci.dev` · `admin@merci.dev`

## 기술 스택

| 영역 | 스택 |
|------|------|
| Frontend | React + Vite + TypeScript (`app/frontend`) |
| Backend | Node + Fastify + TypeScript (`app/backend`) |
| Data | Prisma ORM · **SQLite (dev)** — 스키마는 PostgreSQL 이식 가능 |
| Auth | 서명 쿠키 세션 · Role 기반 접근제어 |

> dev/MVP는 이 환경에 Docker가 없어 SQLite로 구동한다. 운영 전환은 `CLAUDE.md §14` 참조.
