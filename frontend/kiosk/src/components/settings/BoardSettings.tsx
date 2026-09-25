"use client";

import { BoardRulesEditor, DesignerEditor, DisplayEditor, ServiceEditor } from "./editors";
import { SectionTitle } from "./fields";
import { BoardFullPreview, BoardSidePreview } from "./previews";
import { SettingsShell, type SettingsSection } from "./SettingsShell";

const SECTIONS: SettingsSection[] = [
  {
    id: "designers",
    ko: "디자이너",
    en: "DESIGNERS",
    render: (c, on) => <DesignerEditor config={c} onChange={on} eyebrow="01 · DESIGNERS" />,
  },
  {
    id: "services",
    ko: "시술",
    en: "SERVICES",
    render: (c, on) => <ServiceEditor config={c} onChange={on} eyebrow="02 · SERVICES" />,
  },
  { id: "display", ko: "표시 설정", en: "DISPLAY", render: (c, on) => <DisplayEditor config={c} onChange={on} /> },
  { id: "board", ko: "현황판 설정", en: "BOARD", render: (c, on) => <BoardRulesEditor config={c} onChange={on} /> },
  {
    id: "preview",
    ko: "미리보기",
    en: "PREVIEW",
    render: () => (
      <SectionTitle
        eyebrow="05 · PREVIEW"
        title="미리보기"
        help="오른쪽에서 전체 보기와 디자이너별 보기를 확인하고, 위의 ‘미리보기’로 크게 볼 수 있어요. 디자이너와 시술 설정은 키오스크와 함께 쓰입니다."
      />
    ),
  },
];

export default function BoardSettings() {
  return (
    <SettingsShell
      title="BOARD SETTINGS"
      sections={SECTIONS}
      backHref="/board"
      backLabel="현황판으로 돌아가기"
      preview={(config) => <BoardSidePreview config={config} />}
      fullPreview={(config) => <BoardFullPreview config={config} />}
    />
  );
}
