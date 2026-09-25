"use client";

import clsx from "clsx";
import { Check, Settings } from "lucide-react";
import Link from "next/link";
import { BrandMark, useNow } from "@/components/ui/primitives";
import { formatClock, formatDate, serviceNames } from "@/lib/format";
import type { AppConfig, Customer } from "@/lib/types";

/** 완료 고객 유지를 끄면, 완료 후 이 시간이 지난 고객은 현황판에서 사라진다 */
const COMPLETED_GRACE_MS = 10 * 60_000;

export function arrangeCustomers(config: AppConfig, customers: Customer[], filter: string, now = Date.now()) {
  const { board } = config.board;
  const mine = filter === "all" ? customers : customers.filter((c) => c.designerId === filter);

  const waiting = mine
    .filter((c) => c.status === "waiting")
    .sort((a, b) =>
      board.sortRule === "checkInTime"
        ? a.checkInAt - b.checkInAt
        : a.reservationTime.localeCompare(b.reservationTime) || a.checkInAt - b.checkInAt,
    );

  const completedAll = mine.filter((c) => c.status === "completed");
  const completed = completedAll
    .filter((c) => board.keepCompleted || now - (c.completedAt ?? 0) < COMPLETED_GRACE_MS)
    .sort((a, b) =>
      board.completedOrder === "recentFirst"
        ? (b.completedAt ?? 0) - (a.completedAt ?? 0)
        : a.reservationTime.localeCompare(b.reservationTime),
    );

  return { waiting, completed, completedCount: completedAll.length };
}

export function BoardView({
  config,
  customers,
  filter,
  selectedId,
  compact = false,
  onFilter,
  onToggle,
  onOpen,
}: {
  config: AppConfig;
  customers: Customer[];
  filter: string;
  selectedId?: string;
  /** 설정 화면 미리보기용 축소 모드 */
  compact?: boolean;
  onFilter?: (id: string) => void;
  onToggle?: (c: Customer) => void;
  onOpen?: (c: Customer) => void;
}) {
  const now = useNow(30_000);
  const { kiosk } = config;
  const { display } = config.board;
  const { waiting, completed, completedCount } = arrangeCustomers(config, customers, filter);
  const filters = [{ id: "all", name: "전체" }, ...kiosk.designers.filter((d) => d.visible && !d.isAny)];
  const designerName = (id: string) => kiosk.designers.find((d) => d.id === id)?.name ?? "미배정";

  const row = (c: Customer, done: boolean) => (
    <div
      key={c.id}
      onClick={() => onOpen?.(c)}
      className={clsx(
        "grid cursor-pointer grid-cols-[1.1fr_1.6fr_1fr_2fr_auto] items-center gap-6 border-b transition",
        compact ? "min-h-12 px-3" : "min-h-[92px] px-6",
        done ? "border-line-soft text-ink/40" : "border-line hover:bg-surface",
        selectedId === c.id && "bg-surface ring-1 ring-inset ring-green/40",
      )}
    >
      <div className={clsx(compact ? "text-xs" : "text-lg", !done && "text-ink/70")}>{designerName(c.designerId)}</div>
      <div className={clsx(compact ? "text-sm" : "text-[28px]", !done && "font-medium")}>{c.customerName}</div>
      <div className={clsx("tabular-nums", compact ? "text-sm" : "text-[28px] font-light")}>{c.reservationTime}</div>
      <div className={clsx(compact ? "text-xs" : "text-lg")}>{serviceNames(c.serviceIds, kiosk.services)}</div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.(c);
        }}
        title={done ? "눌러서 대기로 되돌리기" : "눌러서 완료로 변경"}
        className={clsx(
          "flex items-center justify-center gap-2 rounded-full border transition",
          compact ? "h-7 min-w-16 px-3 text-xs" : "h-14 min-w-36 px-6 text-lg",
          done
            ? "border-transparent text-ink/40"
            : "border-green text-green hover:bg-green hover:text-white active:bg-green active:text-white",
        )}
      >
        {done ? (
          <>
            {display.completedLabel}
            <Check className="h-4 w-4" strokeWidth={1.5} />
          </>
        ) : (
          <>
            <span className="h-2 w-2 rounded-full bg-current" />
            {display.waitingLabel}
          </>
        )}
      </button>
    </div>
  );

  const header = (labels: boolean) =>
    labels && (
      <div
        className={clsx(
          "eyebrow grid grid-cols-[1.1fr_1.6fr_1fr_2fr_auto] gap-6 border-b border-ink/80 text-muted",
          compact ? "!text-[8px] px-3 pb-2" : "px-6 pb-3",
        )}
      >
        <span>담당 디자이너</span>
        <span>고객명</span>
        <span>예약시간</span>
        <span>시술</span>
        <span className={compact ? "min-w-16 text-center" : "min-w-36 text-center"}>상태</span>
      </div>
    );

  return (
    <div className={clsx("bg-paper", compact ? "p-5" : "min-h-dvh px-8 py-10 lg:px-16")}>
      <header className="flex items-start justify-between gap-8">
        <BrandMark name={kiosk.salonName} descriptor={kiosk.descriptor} />
        <div className="text-center">
          <div className={clsx("serif-display", compact ? "text-2xl" : "text-5xl")}>Today Check-In</div>
          <div className="eyebrow mt-3 text-muted">
            {now ? formatDate(now, display.dateFormat) : " "}
            {!compact && now && <span className="ml-4">{formatClock(now)}</span>}
          </div>
        </div>
        <div className="flex items-start gap-6">
          <div className={clsx("flex items-baseline gap-5", compact ? "text-sm" : "text-xl")}>
            <span>
              {display.waitingLabel}{" "}
              <span className={clsx("serif-display text-green", compact ? "text-2xl" : "text-5xl")}>
                {waiting.length}
              </span>
            </span>
            <span className="text-ink/30">·</span>
            <span className="text-muted">
              {display.completedLabel}{" "}
              <span className={clsx("serif-display", compact ? "text-2xl" : "text-5xl")}>{completedCount}</span>
            </span>
          </div>
          {!compact && (
            <Link href="/board/settings" className="mt-2 text-muted hover:text-ink" aria-label="설정">
              <Settings className="h-5 w-5" strokeWidth={1.2} />
            </Link>
          )}
        </div>
      </header>

      <nav className={clsx("flex gap-8 border-b border-line", compact ? "mt-6 text-xs" : "mt-12 text-lg")}>
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => onFilter?.(f.id)}
            className={clsx(
              "-mb-px border-b-2 pb-3 transition",
              filter === f.id ? "border-green text-ink" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {f.name}
          </button>
        ))}
      </nav>

      <section className={compact ? "mt-6" : "mt-14"}>
        <div className="mb-5 flex items-baseline gap-4">
          <h2 className={clsx("headline-ko", compact ? "text-xl" : "text-4xl")}>{display.waitingLabel}</h2>
          <span className={clsx("text-muted", compact ? "text-[10px]" : "text-sm")}>
            현재 응대를 기다리고 있는 고객입니다.
          </span>
        </div>
        {header(true)}
        {waiting.length ? (
          waiting.map((c) => row(c, false))
        ) : (
          <p className={clsx("text-muted", compact ? "px-3 py-4 text-xs" : "px-6 py-10 text-lg")}>
            기다리는 고객이 없습니다.
          </p>
        )}
      </section>

      {display.showCompleted && (
        <section className={compact ? "mt-8" : "mt-20"}>
          <div className="mb-5 flex items-baseline gap-4">
            <h2 className={clsx("headline-ko text-ink/50", compact ? "text-xl" : "text-4xl")}>
              {display.completedLabel}
            </h2>
            <span className={clsx("text-muted", compact ? "text-[10px]" : "text-sm")}>응대가 완료된 고객입니다.</span>
          </div>
          {completed.map((c) => row(c, true))}
        </section>
      )}

      {!compact && (
        <footer className="eyebrow mt-20 text-center !text-[10px] text-muted">{kiosk.copy.footerMessage}</footer>
      )}
    </div>
  );
}
