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

## 현재 상태

**문서 · 데이터 구조 설계 단계.** 앱 구현은 아직 시작하지 않았다.

- [x] 프로젝트 구조
- [x] 설계 문서 (PRD / EDUCATION_SYSTEM / DATA_MODEL / DESIGN_SYSTEM)
- [ ] 기술 스택 확정 (사용자 승인 대기)
- [ ] 구현

## 기술 스택 (제안)

React + Vite + TypeScript (frontend) · Node + Fastify + TypeScript (backend) ·
PostgreSQL + Prisma (data). **확정 전 사용자 승인 필요** — 자세한 내용은 `CLAUDE.md §12`.
