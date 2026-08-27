# database/

운영(PostgreSQL) 전환 시 스키마·마이그레이션·초기 데이터 산출물을 두는 위치.

현재 dev/MVP의 DB는 SQLite이며, Prisma 스키마/마이그레이션은
`app/backend/prisma/` 에서 관리한다 (single source of truth).
운영 전환 절차는 `CLAUDE.md §14` 참조.
