# 매장 서비스 북 (`app/servicebook`)

매장 iPad에서 고객이 직접 넘겨 보는 메르시모몽 서비스 브로셔입니다. 기준 문서는 저장소 루트 `CLAUDE.md` §15입니다.

- 서비스 메뉴: 헤어컨설팅 · 컷 · 펌·매직 · 맨즈 · 컬러 · 클리닉·두피 · 디자이너 시그니처
- 시술 상세: 추천 대상 · 시술 과정 · 사용 제품 · 기대 효과 · 소요 시간 · 가격 · 홈케어
- 고민으로 찾기 · 시술 비교(최대 3개) · 혜택 · 디자이너 소개
- 디자이너별 가격 전환, 디자이너 로그인 시 개인 메뉴판
- UI: 모몽 OS 글래스 UI, Pretendard

## 쓰는 법

`servicebook.html` 파일 하나로 동작합니다. 서버·설치가 필요 없습니다. iPad Safari에서 열고 "홈 화면에 추가"하면 앱처럼 쓸 수 있습니다.

### 디자이너 로그인
홈 왼쪽 위 사람 아이콘 → 내 이름 → 매장 코드 4자리.
- 매장 코드는 `src/page.html`의 `STORE_CODE` 값입니다. **기본값 `0000`은 꼭 바꿔 주세요.**
- 고객이 화면을 바꾸지 못하게 하는 잠금일 뿐 보안 인증이 아닙니다. 코드는 페이지 소스에 보입니다.
- "이 기기에서 로그인 유지"를 켜면 브라우저 저장소에 로그인한 디자이너만 기억합니다. 로그아웃에도 매장 코드가 필요합니다.

## 폴더

| 경로 | 내용 |
|------|------|
| `src/page.html` | 화면·스타일·동작 (빌드 전 원본, `__DATA__`·`__FONT__` 자리 표시) |
| `src/data.js` | 카테고리·고민·시술 내용·디자이너·혜택 |
| `src/icons.js` | 제품·도구 라인 아이콘 |
| `data/prices.json` | 디자이너별 네이버 예약가 (스크립트로 생성) |
| `data/menu_map.json` | 서비스 북 메뉴 id ↔ 네이버 예약 옵션 이름, 네이버 상품 ↔ 디자이너 |
| `scripts/fetch_naver.py` | 네이버 예약에서 가격을 다시 가져와 `data/prices.json` 갱신 |
| `scripts/build.py` | 위 파일을 묶어 `servicebook.html` 생성 |
| `fonts/` | Pretendard Variable (SIL OFL 1.1, `fonts/LICENSE.txt`) |

## 가격 갱신

```bash
python3 app/servicebook/scripts/fetch_naver.py   # 네이버 예약 → data/prices.json
python3 app/servicebook/scripts/build.py         # → servicebook.html
```

- `fetch_naver.py`는 서비스 북에 연결되지 않은 네이버 옵션을 목록으로 보여 줍니다. 새 메뉴가 생겼다면 `src/data.js`에 시술 내용을, `data/menu_map.json`에 옵션 이름을 추가하세요.
- 갱신한 날짜는 `src/data.js`의 `SOURCE_DATE`를 바꿔 화면에 표시합니다.

## 아직 '예상'인 값

네이버 예약에 없는 소요 시간 · 단계별 시간 · 효과 점수 · 유지 기간 · 모발 부담은 화면에 '예상'으로 표시합니다. 매장에서 확인한 뒤 `src/data.js`에서 실제 값으로 바꿔 주세요.

실제 시간이 네이버에 적혀 있는 메뉴(FIT CUT, FIT COLOR, 프리미엄 클리닉, 리바이브 케어, 포레스파)는 `est:false`와 `timeText`를 씁니다.
