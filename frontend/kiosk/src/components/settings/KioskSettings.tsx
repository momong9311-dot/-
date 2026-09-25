"use client";

import Link from "next/link";
import { resetConfig, resetDemoData } from "@/lib/store";
import {
  ButtonEditor,
  CopyEditor,
  DesignerEditor,
  LanguageEditor,
  OptionalEditor,
  ServiceEditor,
  WaitEditor,
} from "./editors";
import { SectionTitle } from "./fields";
import { KioskFullPreview, KioskScreenPreview, KIOSK_SCREENS, KioskSidePreview, ScaledFrame } from "./previews";
import { SettingsShell, type SettingsSection } from "./SettingsShell";

const SECTIONS: SettingsSection[] = [
  { id: "language", ko: "언어", en: "LANGUAGE", render: (c, on) => <LanguageEditor config={c} onChange={on} /> },
  { id: "designers", ko: "디자이너", en: "DESIGNERS", render: (c, on) => <DesignerEditor config={c} onChange={on} /> },
  { id: "services", ko: "시술 메뉴", en: "SERVICES", render: (c, on) => <ServiceEditor config={c} onChange={on} /> },
  { id: "copy", ko: "브랜드 문구", en: "BRAND COPY", render: (c, on) => <CopyEditor config={c} onChange={on} /> },
  { id: "buttons", ko: "버튼 라벨", en: "BUTTONS", render: (c, on) => <ButtonEditor config={c} onChange={on} /> },
  { id: "waiting", ko: "대기 정보", en: "WAITING", render: (c, on) => <WaitEditor config={c} onChange={on} /> },
  { id: "optional", ko: "부가 서비스", en: "OPTIONAL", render: (c, on) => <OptionalEditor config={c} onChange={on} /> },
  {
    id: "publish",
    ko: "미리보기 · 게시",
    en: "PREVIEW & PUBLISH",
    render: (c) => (
      <>
        <SectionTitle
          eyebrow="08 · PREVIEW & PUBLISH"
          title="미리보기 · 게시"
          help="전체 흐름을 확인한 뒤 오른쪽 위 ‘게시하기’를 누르면 키오스크와 현황판에 바로 반영됩니다."
        />
        <div className="grid grid-cols-2 gap-6 2xl:grid-cols-3">
          {KIOSK_SCREENS.map((s, i) => (
            <div key={s.id}>
              <div className="eyebrow mb-2 text-muted">
                {String(i + 1).padStart(2, "0")} · {s.label}
              </div>
              <ScaledFrame width={680} height={1240} scale={0.36}>
                <KioskScreenPreview config={c} screen={s.id} />
              </ScaledFrame>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-3 border-t border-line pt-8">
          <Link href="/kiosk" target="_blank" className="rounded-full border border-ink px-5 py-2.5 text-sm">
            키오스크 새 창으로 열기
          </Link>
          <button
            onClick={() => {
              if (window.confirm("오늘 고객 목록을 데모 데이터로 되돌릴까요?")) resetDemoData();
            }}
            className="rounded-full border border-line px-5 py-2.5 text-sm text-ink/70"
          >
            고객 데모 데이터 초기화
          </button>
          <button
            onClick={() => {
              if (window.confirm("모든 설정을 처음 상태로 되돌리고 게시할까요?")) resetConfig();
            }}
            className="rounded-full border border-line px-5 py-2.5 text-sm text-ink/70"
          >
            설정 초기화
          </button>
        </div>
      </>
    ),
  },
];

export default function KioskSettings() {
  return (
    <SettingsShell
      title="KIOSK SETTINGS"
      sections={SECTIONS}
      backHref="/kiosk"
      backLabel="키오스크로 돌아가기"
      preview={(config, sectionId) => <KioskSidePreview config={config} sectionId={sectionId} />}
      fullPreview={(config) => <KioskFullPreview config={config} />}
    />
  );
}
