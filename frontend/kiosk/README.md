# MERCI MOMONG — 셀프 체크인 키오스크 · 직원 현황판

Stitch 시안(“MERCI MOMONG — Self Check-In Kiosk & Staff Board”)을 옮긴 Next.js 앱.

```bash
cd frontend/kiosk
npm install
npm run dev        # http://localhost:3204
```

| 경로 | 용도 |
|---|---|
| `/kiosk` | 고객용 세로형 키오스크 (첫 화면 → 예약 확인 → 방문 목적 → 디자이너 → 완료 → 부가 서비스) |
| `/board` | 직원용 Today Check-In 현황판 (대기/완료, 디자이너 필터, 한 번 탭으로 완료) |
| `/kiosk/settings` | 키오스크 관리자 설정 (언어·디자이너·시술·문구·버튼·대기·부가 서비스·게시) |
| `/board/settings` | 현황판 설정 (디자이너·시술·표시·정렬) |

## 데이터 구조

화면의 문구와 메뉴는 전부 `src/lib/types.ts` 의 컬렉션에서 나온다
(`languages[] · designers[] · services[] · optionalServices[] · copy · buttons · wait · display · board`, 고객은 `customers[]`).
기본값은 `src/lib/defaults.ts`.

- 설정 화면에서 편집 → **저장**(초안) → **게시하기**를 눌러야 키오스크·현황판에 반영된다.
- 고객 상태는 `waiting` / `completed` 두 가지뿐이다.

## 현재 한계 (백엔드 연동 전)

- 모든 데이터는 **브라우저 localStorage** 에 저장된다. 같은 브라우저의 다른 탭끼리는 실시간 동기화되지만,
  키오스크 기기와 리셉션 모니터처럼 **서로 다른 기기 간에는 공유되지 않는다.** 실제 운영에는 `src/lib/store.ts` 를 backend API 로 바꿔야 한다.
- 예약 확인은 `defaults.ts` 의 데모 예약(010-1234-5678, 010-9876-5432)으로만 동작한다.
- 언어 버튼은 선택 상태와 시술명(영문)만 바뀌고, 나머지 문구 번역은 아직 없다.
- 설정 화면에 로그인/권한이 없다.
