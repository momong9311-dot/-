"use client";

import clsx from "clsx";
import { ArrowLeft } from "lucide-react";
import { BrandMark, Clock } from "@/components/ui/primitives";
import type { KioskConfig } from "@/lib/types";

export function StepIndicator({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <div className="flex items-center gap-4">
      <span className="eyebrow shrink-0 !tracking-[0.25em]">
        STEP {String(step).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
      <div className="flex flex-1 gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={clsx("h-px flex-1", i < step ? "bg-green" : "bg-line")} />
        ))}
      </div>
    </div>
  );
}

export function BackButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex h-14 items-center gap-3 pr-6 text-[15px] text-ink/70 active:text-ink">
      <ArrowLeft className="h-5 w-5" strokeWidth={1.2} />
      {label}
    </button>
  );
}

/** 모든 키오스크 화면이 공유하는 세로형 프레임: 헤더 · 본문 · 하단 */
export function KioskFrame({
  config,
  right,
  children,
  footer,
  className,
}: {
  config: KioskConfig;
  right?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("relative flex min-h-full flex-1 flex-col bg-paper px-8 pb-8 pt-9 sm:px-12", className)}>
      <header className="flex items-start justify-between">
        <BrandMark name={config.salonName} descriptor={config.descriptor} />
        {right ?? <Clock />}
      </header>
      <main className="flex flex-1 flex-col pt-12">{children}</main>
      {footer && <footer className="pt-8">{footer}</footer>}
    </div>
  );
}

export function Headline({ title, copy }: { title: string; copy?: string }) {
  return (
    <div className="animate-fade-up">
      <h1 className="headline-ko text-[40px] sm:text-[44px]">{title}</h1>
      {copy && <p className="pre-line mt-5 text-[15px] leading-relaxed text-ink/60">{copy}</p>}
    </div>
  );
}
