#!/usr/bin/env python3
"""서비스 북(iPad)과 모바일 브로셔를 각각 파일 하나로 묶는다.

src/page.html     → servicebook.html  (매장 iPad, 디자이너 로그인)
src/brochure.html → brochure.html     (모바일 브로셔, 링크로 공유)

두 페이지 모두 __DATA__ 자리에 src/data.js + data/prices.json + src/icons.js 를,
__FONT__ 자리에 fonts/PretendardVariable.woff2 (base64) 를 넣는다.

    python3 app/servicebook/scripts/build.py
    python3 app/servicebook/scripts/build.py --fragment OUT.html            # 서비스 북 아티팩트 게시용
    python3 app/servicebook/scripts/build.py --brochure-fragment OUT.html   # 브로셔 아티팩트 게시용
"""
import base64
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

# 단독 파일로 열 때 쓸 문서 껍데기 (아티팩트로 게시할 때는 플랫폼이 붙여 준다)
HEAD = ('<!doctype html>\n<html lang="ko">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<meta name="apple-mobile-web-app-capable" content="yes">\n'
        '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>\n')


def bundle(src: str) -> str:
    page = (ROOT / src).read_text(encoding="utf-8")
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
            raise SystemExit(f"{src} 에 {token} 자리가 없습니다.")
    return page.replace("__DATA__", data + "\n" + prices_js + "\n" + icons).replace("__FONT__", font)


def write(path: pathlib.Path, html: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html, encoding="utf-8")
    print(f"built {path} ({path.stat().st_size / 1_000_000:.1f} MB)")


def main() -> None:
    args = sys.argv[1:]
    if "--fragment" in args:
        write(pathlib.Path(args[args.index("--fragment") + 1]).resolve(), bundle("src/page.html"))
        return
    if "--brochure-fragment" in args:
        write(pathlib.Path(args[args.index("--brochure-fragment") + 1]).resolve(), bundle("src/brochure.html"))
        return
    write(ROOT / "servicebook.html", HEAD + bundle("src/page.html") + "\n</html>\n")
    write(ROOT / "brochure.html", HEAD + bundle("src/brochure.html") + "\n</html>\n")


if __name__ == "__main__":
    main()
