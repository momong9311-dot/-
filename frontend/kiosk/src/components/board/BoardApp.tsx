"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import { useState } from "react";
import { serviceNames } from "@/lib/format";
import { setCustomerStatus, todaysCustomers, updateCustomer, useStore } from "@/lib/store";
import type { AppConfig, Customer, VisitType } from "@/lib/types";
import { BoardView } from "./BoardView";

export default function BoardApp() {
  const store = useStore();
  const config = store.published;
  const customers = todaysCustomers(store.customers);
  const [filterOverride, setFilter] = useState<string>();
  const [openId, setOpenId] = useState<string>();

  // 기본 필터가 숨겨진 디자이너를 가리키면 전체로 되돌린다
  const defaultFilter = config.board.board.defaultFilter;
  const validDefault =
    defaultFilter === "all" || config.kiosk.designers.some((d) => d.id === defaultFilter && d.visible)
      ? defaultFilter
      : "all";
  const filter = filterOverride ?? validDefault;
  const open = customers.find((c) => c.id === openId);

  const toggle = (c: Customer) => setCustomerStatus(c.id, c.status === "waiting" ? "completed" : "waiting");

  return (
    <>
      <BoardView
        config={config}
        customers={customers}
        filter={filter}
        selectedId={openId}
        onFilter={setFilter}
        onToggle={toggle}
        onOpen={(c) => setOpenId(c.id)}
      />
      {open && <DetailPanel config={config} customer={open} onClose={() => setOpenId(undefined)} onToggle={toggle} />}
    </>
  );
}

function DetailPanel({
  config,
  customer,
  onClose,
  onToggle,
}: {
  config: AppConfig;
  customer: Customer;
  onClose: () => void;
  onToggle: (c: Customer) => void;
}) {
  const { kiosk } = config;
  const { display } = config.board;
  const designer = kiosk.designers.find((d) => d.id === customer.designerId);
  const waiting = customer.status === "waiting";
  const requested = (customer.optionalServiceIds ?? [])
    .map((id) => kiosk.optionalServices.find((o) => o.id === id)?.title)
    .filter(Boolean);

  const rows: [string, React.ReactNode][] = [
    ["담당 디자이너", designer ? `${designer.name} ${designer.isAny ? "" : designer.role}` : "미배정"],
    ["예약시간", <span key="t" className="tabular-nums">{customer.reservationTime}</span>],
    ["시술", serviceNames(customer.serviceIds, kiosk.services)],
    [
      "상태",
      <span
        key="s"
        className={clsx(
          "rounded-full px-3 py-1 text-sm",
          waiting ? "border border-green text-green" : "bg-stone text-ink/50",
        )}
      >
        {waiting ? display.waitingLabel : display.completedLabel}
      </span>,
    ],
  ];
  if (requested.length) rows.push(["요청 서비스", requested.join(", ")]);

  const visitTypes: [VisitType, string][] = [
    ["first", "첫 방문"],
    ["return", "재방문"],
  ];

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-paper/60 backdrop-blur-[1px]" />
      <aside className="relative flex h-full w-full max-w-[460px] flex-col overflow-y-auto border-l border-line bg-surface px-10 py-10 shadow-[-20px_0_60px_rgba(0,0,0,0.05)]">
        <div className="flex items-start justify-between">
          <span className="eyebrow text-muted">CUSTOMER · {customer.ticket}</span>
          <button onClick={onClose} aria-label="닫기" className="-m-2 p-2 text-ink/60 hover:text-ink">
            <X className="h-6 w-6" strokeWidth={1.2} />
          </button>
        </div>
        <h2 className="headline-ko mt-6 text-[40px]">{customer.customerName}</h2>

        <dl className="mt-10 border-t border-line">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-b border-line-soft py-5">
              <dt className="text-sm text-muted">{k}</dt>
              <dd className="text-right text-lg">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8">
          <div className="text-sm text-muted">방문 구분</div>
          <div className="mt-3 flex gap-2">
            {visitTypes.map(([value, label]) => (
              <button
                key={value}
                onClick={() => updateCustomer(customer.id, { visitType: value })}
                className={clsx(
                  "h-11 flex-1 rounded-full border text-sm transition",
                  customer.visitType === value ? "border-ink bg-ink text-white" : "border-line text-ink/70",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="mt-8 block">
          <span className="text-sm text-muted">간단 메모</span>
          <textarea
            value={customer.memo ?? ""}
            onChange={(e) => updateCustomer(customer.id, { memo: e.target.value })}
            placeholder="예: 앞머리 길이 유지 희망"
            rows={4}
            className="mt-3 w-full resize-none border border-line bg-paper/50 p-4 text-[15px] outline-none focus:border-ink"
          />
        </label>

        <div className="mt-auto pt-10">
          <button
            onClick={() => {
              onToggle(customer);
              if (waiting) onClose();
            }}
            className={clsx(
              "h-16 w-full rounded-full text-lg transition",
              waiting ? "bg-green text-white active:bg-[#16291f]" : "border border-ink text-ink",
            )}
          >
            {waiting ? `${display.completedLabel}로 변경` : `${display.waitingLabel}로 되돌리기`}
          </button>
          <p className="mt-3 text-center text-xs text-muted">
            {waiting ? "한 번 탭하면 완료 목록으로 이동합니다." : "잘못 누른 경우 대기로 되돌릴 수 있어요."}
          </p>
        </div>
      </aside>
    </div>
  );
}
