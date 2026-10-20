#!/usr/bin/env python3
"""네이버 예약에서 메르시모몽 메뉴·가격을 다시 가져와 data/prices.json 을 갱신한다.

- 디자이너별 예약 상품(data/menu_map.json 의 designers)과 각 상품의 옵션(시술 메뉴)을 읽는다.
- 서비스 북 메뉴 id 마다 menu_map.json 의 services 에 적힌 네이버 옵션 이름으로 가격을 찾는다.
- 결과: data/prices.json  {메뉴 id: {디자이너 key: [예약가, 정가 또는 null, 가격 메모]}}
- 서비스 북에 연결되지 않은 네이버 옵션은 목록으로 출력한다 (새 메뉴가 생겼는지 확인용).

    python3 app/servicebook/scripts/fetch_naver.py
    python3 app/servicebook/scripts/build.py
"""
import json
import pathlib
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
API = "https://api.booking.naver.com/v3.0/businesses/{biz}"
UA = {"User-Agent": "Mozilla/5.0", "Accept-Language": "ko-KR"}


def get(url: str):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)


def main() -> None:
    cfg = json.loads((ROOT / "data/menu_map.json").read_text(encoding="utf-8"))
    base = API.format(biz=cfg["businessId"])
    items = get(f"{base}/biz-items?lang=ko")

    options = {}  # designer key -> {option name: option}
    for it in items:
        key = cfg["designers"].get(it["name"].strip())
        if not key:
            continue
        for o in get(f"{base}/biz-items/{it['bizItemId']}/options?lang=ko"):
            if o.get("isDeleted"):
                continue
            options.setdefault(key, {})[o["name"].strip()] = o

    missing_designers = set(cfg["designers"].values()) - set(options)
    if missing_designers:
        print("⚠ 네이버에서 찾지 못한 디자이너:", ", ".join(sorted(missing_designers)), file=sys.stderr)

    prices, used = {}, set()
    for sid, names in cfg["services"].items():
        row = {}
        for dkey, opts in options.items():
            for n in names:
                o = opts.get(n)
                if o and o.get("price") is not None:
                    normal = o.get("normalPrice")
                    note = (o.get("priceDesc") or "").replace("\n", " ").strip()
                    row[dkey] = [o["price"], normal if (normal or 0) > o["price"] else None, note]
                    used.add(n)
                    break
        if not row:
            print(f"⚠ 가격을 찾지 못한 메뉴: {sid} ({' / '.join(names)})", file=sys.stderr)
        prices[sid] = row

    (ROOT / "data/prices.json").write_text(json.dumps(prices, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"data/prices.json 갱신: 메뉴 {len(prices)}개, 디자이너 {len(options)}명")

    unmapped = sorted({n for opts in options.values() for n in opts} - used)
    if unmapped:
        print("\n서비스 북에 연결되지 않은 네이버 옵션 (필요하면 src/data.js 와 menu_map.json 에 추가):")
        for n in unmapped:
            print("  -", n)


if __name__ == "__main__":
    main()
