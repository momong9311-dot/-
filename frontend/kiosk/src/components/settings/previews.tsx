"use client";

import clsx from "clsx";
import { useState } from "react";
import { BoardView } from "@/components/board/BoardView";
import {
  CompleteScreen,
  DesignerScreen,
  OptionalScreen,
  PurposeScreen,
  ReservationScreen,
  WelcomeScreen,
} from "@/components/kiosk/screens";
import { todaysCustomers, useStore } from "@/lib/store";
import type { AppConfig } from "@/lib/types";

/** 실제 크기로 그린 화면을 축소해서 보여준다 */
export function ScaledFrame({
  width,
  height,
  scale,
  children,
}: {
  width: number;
  height: number;
  scale: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ width: width * scale, height: height * scale }}
      className="pointer-events-none overflow-hidden border border-line bg-paper shadow-sm"
    >
      <div
        style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}
        className="flex flex-col overflow-hidden"
      >
        {children}
      </div>
    </div>
  );
}

export const KIOSK_SCREENS = [
  { id: "welcome", label: "Welcome" },
  { id: "reservation", label: "예약 확인" },
  { id: "purpose", label: "방문 목적" },
  { id: "designer", label: "디자이너" },
  { id: "complete", label: "완료" },
  { id: "optional", label: "부가 서비스" },
] as const;
export type KioskScreenId = (typeof KIOSK_SCREENS)[number]["id"];

export function KioskScreenPreview({ config, screen }: { config: AppConfig; screen: KioskScreenId }) {
  const kiosk = config.kiosk;
  const sampleDesigner = kiosk.designers.find((d) => d.visible && !d.isAny) ?? kiosk.designers[0];
  const ticket = `${kiosk.wait.numberPrefix} ${"3".padStart(kiosk.wait.numberDigits, "0")}`.trim();
  switch (screen) {
    case "welcome":
      return <WelcomeScreen config={kiosk} />;
    case "reservation":
      return <ReservationScreen config={kiosk} phone="0101234" />;
    case "purpose":
      return <PurposeScreen config={kiosk} />;
    case "designer":
      return <DesignerScreen config={kiosk} selectedId={sampleDesigner?.id} reservedId={sampleDesigner?.id} />;
    case "complete":
      return (
        <CompleteScreen
          config={kiosk}
          customer={{ ticket, designerId: sampleDesigner?.id ?? "" }}
          waitMinutes={kiosk.wait.defaultWaitMinutes}
          secondsLeft={kiosk.wait.autoReturnSeconds}
        />
      );
    case "optional":
      return <OptionalScreen config={kiosk} ticket={ticket} />;
  }
}

function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={clsx(
            "rounded-full border px-3 py-1 text-xs transition",
            value === t.id ? "border-ink bg-ink text-white" : "border-line text-ink/70 hover:border-ink",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** 설정 섹션에 맞는 화면을 먼저 보여준다 */
const SECTION_SCREEN: Record<string, KioskScreenId> = {
  language: "welcome",
  designers: "designer",
  services: "purpose",
  copy: "welcome",
  buttons: "reservation",
  waiting: "complete",
  optional: "optional",
};

export function KioskSidePreview({ config, sectionId }: { config: AppConfig; sectionId: string }) {
  const [picked, setPicked] = useState<{ section: string; screen: KioskScreenId }>();
  // 섹션을 옮기면 해당 화면으로 자동 전환, 같은 섹션 안에서는 직접 고른 탭 유지
  const screen = picked?.section === sectionId ? picked.screen : (SECTION_SCREEN[sectionId] ?? "welcome");
  return (
    <>
      <Tabs items={KIOSK_SCREENS} value={screen} onChange={(s) => setPicked({ section: sectionId, screen: s })} />
      <ScaledFrame width={680} height={1240} scale={0.56}>
        <KioskScreenPreview config={config} screen={screen} />
      </ScaledFrame>
    </>
  );
}

export function KioskFullPreview({ config }: { config: AppConfig }) {
  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {KIOSK_SCREENS.map((s, i) => (
        <div key={s.id} className="shrink-0">
          <div className="eyebrow mb-3 text-white">
            {String(i + 1).padStart(2, "0")} · {s.label}
          </div>
          <ScaledFrame width={680} height={1240} scale={0.5}>
            <KioskScreenPreview config={config} screen={s.id} />
          </ScaledFrame>
        </div>
      ))}
    </div>
  );
}

export function BoardSidePreview({ config }: { config: AppConfig }) {
  const store = useStore();
  const designers = config.kiosk.designers.filter((d) => d.visible && !d.isAny);
  const [filter, setFilter] = useState("all");
  const items = [{ id: "all", label: "전체 보기" }, ...designers.map((d) => ({ id: d.id, label: d.name }))];
  return (
    <>
      <Tabs items={items} value={filter} onChange={setFilter} />
      <ScaledFrame width={1100} height={1300} scale={0.36}>
        <BoardView config={config} customers={todaysCustomers(store.customers)} filter={filter} compact />
      </ScaledFrame>
    </>
  );
}

export function BoardFullPreview({ config }: { config: AppConfig }) {
  const store = useStore();
  const designers = config.kiosk.designers.filter((d) => d.visible && !d.isAny);
  const [filter, setFilter] = useState(config.board.board.defaultFilter);
  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-4 flex gap-2">
        {[{ id: "all", name: "전체" }, ...designers].map((d) => (
          <button
            key={d.id}
            onClick={() => setFilter(d.id)}
            className={clsx(
              "rounded-full px-4 py-1.5 text-sm",
              filter === d.id ? "bg-white text-ink" : "bg-white/20 text-white",
            )}
          >
            {d.id === "all" ? "전체 보기" : `${d.name} 화면`}
          </button>
        ))}
      </div>
      <div className="pointer-events-none overflow-hidden bg-paper">
        <BoardView config={config} customers={todaysCustomers(store.customers)} filter={filter} />
      </div>
    </div>
  );
}
