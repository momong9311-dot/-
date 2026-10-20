#!/usr/bin/env python3
"""서비스 북을 파일 하나(servicebook.html)로 묶는다.

src/page.html 의 __DATA__ 자리에 src/data.js + data/prices.json + src/icons.js 를,
__FONT__ 자리에 fonts/PretendardVariable.woff2 (base64) 를 넣는다.

    python3 app/servicebook/scripts/build.py
"""
import base64
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent


def main() -> None:
    page = (ROOT / "src/page.html").read_text(encoding="utf-8")
    data = (ROOT / "src/data.js").read_text(encoding="utf-8")
    icons = (ROOT / "src/icons.js").read_text(encoding="utf-8")
    prices = json.loads((ROOT / "data/prices.json").read_text(encoding="utf-8"))
    font = base64.b64encode((ROOT / "fonts/PretendardVariable.woff2").read_bytes()).decode()

    prices_js = (
        "/* 디자이너별 네이버 예약가: [예약가, 정가(할인 시), 가격 메모]. "
        "first = 첫방문 이벤트 예약(디자이너 지정 불가). scripts/fetch_naver.py 로 갱신 */\n"
        "const PRICES = " + json.dumps(prices, ensure_ascii=False) + ";\n"
    )
    for token in ("__DATA__", "__FONT__"):
        if token not in page:
            raise SystemExit(f"src/page.html 에 {token} 자리가 없습니다.")
    html = page.replace("__DATA__", data + "\n" + prices_js + "\n" + icons).replace("__FONT__", font)

    # 단독 파일로 열 때 쓸 문서 껍데기 (아티팩트로 게시할 때는 플랫폼이 붙여 준다)
    head = ('<!doctype html>\n<html lang="ko">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
            '<meta name="apple-mobile-web-app-capable" content="yes">\n'
            '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>\n')
    html = head + html + "\n</html>\n"

    out = ROOT / "servicebook.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"built {out.relative_to(ROOT.parent.parent)} ({out.stat().st_size / 1_000_000:.1f} MB)")


if __name__ == "__main__":
    main()
