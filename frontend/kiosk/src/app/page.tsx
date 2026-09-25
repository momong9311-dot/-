import { ArrowRight } from "lucide-react";
import Link from "next/link";

const LINKS = [
  { href: "/kiosk", title: "셀프 체크인 키오스크", en: "SELF CHECK-IN", desc: "고객용 · 세로형 터치 화면" },
  { href: "/board", title: "Today Check-In 현황판", en: "STAFF BOARD", desc: "직원용 · 리셉션 모니터 / 태블릿" },
  { href: "/kiosk/settings", title: "키오스크 설정", en: "KIOSK SETTINGS", desc: "관리자 · 문구 · 메뉴 · 디자이너" },
  { href: "/board/settings", title: "현황판 설정", en: "BOARD SETTINGS", desc: "관리자 · 표시 · 정렬 · 필터" },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-8 py-16">
      <div className="serif-display text-[15px] tracking-[0.35em]">MERCI MOMONG</div>
      <div className="eyebrow mt-1 !text-[9px] text-muted">HAIR CONSULTING SALON</div>
      <h1 className="serif-display mt-16 text-6xl">Your Beauty, Your Direction</h1>
      <nav className="mt-14 border-t border-line">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group flex items-center justify-between border-b border-line py-7 transition hover:pl-2"
          >
            <div>
              <div className="eyebrow text-muted">{l.en}</div>
              <div className="mt-2 text-2xl">{l.title}</div>
              <div className="mt-1 text-sm text-muted">{l.desc}</div>
            </div>
            <ArrowRight className="h-5 w-5 text-ink/50 group-hover:text-green" strokeWidth={1.2} />
          </Link>
        ))}
      </nav>
    </main>
  );
}
