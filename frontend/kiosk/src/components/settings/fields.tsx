"use client";

import clsx from "clsx";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

export function SectionTitle({ title, eyebrow, help }: { title: string; eyebrow: string; help?: string }) {
  return (
    <div className="mb-8">
      <div className="eyebrow text-muted">{eyebrow}</div>
      <h2 className="headline-ko mt-3 text-3xl">{title}</h2>
      {help && <p className="mt-3 text-sm leading-relaxed text-ink/60">{help}</p>}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[13px] text-ink/70">{label}</span>
      <div className="mt-2">{children}</div>
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

const inputClass =
  "w-full border border-line bg-surface px-3.5 py-2.5 text-[15px] outline-none transition focus:border-ink";

export function TextInput({
  value,
  onChange,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input {...props} value={value} onChange={(e) => onChange(e.target.value)} className={clsx(inputClass, className)} />
  );
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(Math.min(max ?? n, Math.max(min ?? n, n)));
        }}
        className={clsx(inputClass, "w-28 tabular-nums")}
      />
      {suffix && <span className="text-sm text-muted">{suffix}</span>}
    </div>
  );
}

export function TextArea({ value, onChange, rows = 2 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(inputClass, "resize-none leading-relaxed")}
    />
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)} className={clsx(inputClass, "pr-8")}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** 목록 행 왼쪽의 순서 이동 버튼 */
export function ReorderButtons({
  index,
  length,
  onMove,
}: {
  index: number;
  length: number;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-label="위로"
        disabled={index === 0}
        onClick={() => onMove(-1)}
        className="p-0.5 text-ink/50 hover:text-ink disabled:opacity-20"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="아래로"
        disabled={index === length - 1}
        onClick={() => onMove(1)}
        className="p-0.5 text-ink/50 hover:text-ink disabled:opacity-20"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}

export function DeleteButton({ onClick, label = "삭제" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        if (window.confirm("이 항목을 삭제할까요? 게시하기 전까지는 고객 화면에 반영되지 않아요.")) onClick();
      }}
      className="p-1.5 text-ink/40 hover:text-ink"
    >
      <Trash2 className="h-4 w-4" strokeWidth={1.3} />
    </button>
  );
}

export function AddButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-ink px-5 py-2.5 text-sm transition hover:bg-ink hover:text-white"
    >
      + {children}
    </button>
  );
}

export function ListCard({ children, dimmed }: { children: React.ReactNode; dimmed?: boolean }) {
  return (
    <div className={clsx("border border-line bg-surface px-4 py-4 transition", dimmed && "bg-paper opacity-60")}>
      {children}
    </div>
  );
}

export function HiddenBadge() {
  return <span className="rounded-full bg-stone px-2 py-0.5 text-[11px] text-muted">숨김</span>;
}
