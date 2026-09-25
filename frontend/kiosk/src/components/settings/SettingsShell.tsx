"use client";

import clsx from "clsx";
import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatClock } from "@/lib/format";
import { publish, saveDraft, useStore } from "@/lib/store";
import type { AppConfig } from "@/lib/types";

export interface SettingsSection {
  id: string;
  ko: string;
  en: string;
  render: (config: AppConfig, onChange: (next: AppConfig) => void) => React.ReactNode;
}

/**
 * 설정 화면 공통 틀.
 * 편집 내용은 먼저 화면 안(작업본)에만 있고 → 저장하면 초안으로 → 게시하면 고객 화면에 반영된다.
 */
export function SettingsShell({
  title,
  sections,
  backHref,
  backLabel,
  preview,
  fullPreview,
}: {
  title: string;
  sections: SettingsSection[];
  backHref: string;
  backLabel: string;
  preview: (config: AppConfig, sectionId: string) => React.ReactNode;
  fullPreview: (config: AppConfig) => React.ReactNode;
}) {
  const store = useStore();
  const [working, setWorking] = useState<AppConfig | null>(null);
  const [active, setActive] = useState(sections[0].id);
  const [showPreview, setShowPreview] = useState(false);
  const [notice, setNotice] = useState<string>();

  const config = working ?? store.draft;
  const dirty = working !== null && JSON.stringify(working) !== JSON.stringify(store.draft);
  const unpublished = JSON.stringify(config) !== JSON.stringify(store.published);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(undefined), 2500);
    return () => window.clearTimeout(id);
  }, [notice]);

  const status = dirty
    ? "저장하지 않은 변경 있음"
    : unpublished
      ? `DRAFT${store.draftSavedAt ? ` · 마지막 저장 ${formatClock(new Date(store.draftSavedAt))}` : ""}`
      : `게시됨${store.publishedAt ? ` · ${formatClock(new Date(store.publishedAt))}` : ""}`;

  const section = sections.find((s) => s.id === active) ?? sections[0];

  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-30 flex h-18 items-center justify-between gap-6 border-b border-line bg-paper/95 px-8 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <span className="serif-display text-[15px] tracking-[0.35em]">{config.kiosk.salonName}</span>
          <span className="text-line">|</span>
          <span className="eyebrow text-muted">{title}</span>
        </div>
        <div className={clsx("eyebrow !tracking-[0.15em]", dirty ? "text-green" : "text-muted")}>{status}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWorking(null)}
            disabled={!dirty}
            className="px-4 py-2.5 text-sm text-ink/70 disabled:opacity-30"
          >
            취소
          </button>
          <button onClick={() => setShowPreview(true)} className="rounded-full border border-line px-5 py-2.5 text-sm hover:border-ink">
            미리보기
          </button>
          <button
            onClick={() => {
              saveDraft(config);
              setWorking(null);
              setNotice("초안을 저장했어요. 게시하기 전까지 고객 화면은 그대로예요.");
            }}
            disabled={!dirty}
            className="rounded-full border border-ink px-5 py-2.5 text-sm disabled:border-line disabled:text-muted"
          >
            저장
          </button>
          <button
            onClick={() => {
              publish(config);
              setWorking(null);
              setNotice("게시했어요. 키오스크와 현황판에 바로 반영됩니다.");
            }}
            disabled={!dirty && !unpublished}
            className="rounded-full bg-green px-6 py-2.5 text-sm text-white disabled:bg-line disabled:text-muted"
          >
            게시하기
          </button>
        </div>
      </header>

      <div className="grid grid-cols-[220px_minmax(0,1fr)_400px] gap-0 xl:grid-cols-[240px_minmax(0,1fr)_440px]">
        <nav className="sticky top-18 flex h-[calc(100dvh-72px)] flex-col border-r border-line px-5 py-8">
          {sections.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={clsx(
                "relative flex items-baseline gap-3 py-3 pl-4 text-left transition",
                active === s.id ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              {active === s.id && <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-green" />}
              <span className="eyebrow !text-[10px] !tracking-[0.15em]">{String(i + 1).padStart(2, "0")}</span>
              <span>
                <span className="block text-[15px]">{s.ko}</span>
                <span className="eyebrow !text-[9px] text-muted">{s.en}</span>
              </span>
            </button>
          ))}
          <Link href={backHref} className="mt-auto flex items-center gap-2 pl-4 text-sm text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.3} />
            {backLabel}
          </Link>
        </nav>

        <main className="min-w-0 px-10 py-10">
          {section.render(config, (next) => setWorking(next))}
        </main>

        <aside className="sticky top-18 h-[calc(100dvh-72px)] overflow-y-auto border-l border-line bg-surface/50 px-6 py-8">
          <div className="eyebrow mb-4 text-muted">LIVE PREVIEW</div>
          {preview(config, section.id)}
          <p className="mt-4 text-xs leading-relaxed text-muted">
            미리보기는 아직 게시하지 않은 내용까지 보여줍니다. 고객 화면에는 ‘게시하기’를 눌러야 반영돼요.
          </p>
        </aside>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink/40 backdrop-blur-sm">
          <div className="flex items-center justify-between bg-paper px-8 py-4">
            <span className="eyebrow">PREVIEW · 게시 전 확인</span>
            <button onClick={() => setShowPreview(false)} aria-label="닫기">
              <X className="h-6 w-6" strokeWidth={1.2} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-8">{fullPreview(config)}</div>
        </div>
      )}

      {notice && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-6 py-3 text-sm text-white shadow-lg">
          {notice}
        </div>
      )}
    </div>
  );
}
