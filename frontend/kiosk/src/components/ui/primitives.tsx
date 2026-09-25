"use client";

import clsx from "clsx";
import { ArrowRight, Coffee, Shirt, ShoppingBag, Sparkles, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatClock, formatDate } from "@/lib/format";
import type { DateFormat, Designer, OptionalServiceIcon, Service } from "@/lib/types";

export function BrandMark({ name, descriptor, className }: { name: string; descriptor: string; className?: string }) {
  return (
    <div className={clsx("leading-tight", className)}>
      <div className="serif-display text-[15px] tracking-[0.35em] uppercase">{name}</div>
      <div className="eyebrow mt-1 !text-[9px] text-muted">{descriptor}</div>
    </div>
  );
}

/** 1초마다 갱신되는 날짜·시각. 서버 렌더와 어긋나지 않도록 마운트 후에만 그린다 */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function Clock({ format = "en-long", className }: { format?: DateFormat; className?: string }) {
  const now = useNow(10_000);
  return (
    <div className={clsx("eyebrow text-right !tracking-[0.2em] leading-relaxed", className)}>
      <div>{now ? formatDate(now, format) : " "}</div>
      <div>{now ? formatClock(now) : " "}</div>
    </div>
  );
}

export function PrimaryButton({
  children,
  className,
  arrow = true,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { arrow?: boolean }) {
  return (
    <button
      {...props}
      className={clsx(
        "flex h-20 w-full items-center justify-between rounded-full bg-green px-9 text-lg text-white transition",
        "active:scale-[0.99] active:bg-[#16291f] disabled:cursor-not-allowed disabled:bg-line disabled:text-muted",
        className,
      )}
    >
      <span className="tracking-wide">{children}</span>
      {arrow && <ArrowRight className="h-5 w-5" strokeWidth={1.4} />}
    </button>
  );
}

export function Avatar({ designer, size = 64 }: { designer: Pick<Designer, "name" | "photo" | "isAny">; size?: number }) {
  const style = { width: size, height: size };
  if (designer.isAny) {
    return (
      <div style={style} className="flex shrink-0 items-center justify-center rounded-md bg-stone">
        <User className="h-1/2 w-1/2 text-muted" strokeWidth={1} />
      </div>
    );
  }
  if (designer.photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={designer.photo} alt={designer.name} style={style} className="shrink-0 rounded-md object-cover" />;
  }
  return (
    <div
      style={style}
      className="serif-display flex shrink-0 items-center justify-center rounded-md bg-stone text-[1.4em] text-ink/70"
    >
      {designer.name.slice(0, 1)}
    </div>
  );
}

/** 시술 썸네일. 사진이 없으면 영문 이니셜 타이포 타일로 대신한다 */
export function ServiceThumb({ service, size = 88 }: { service: Service; size?: number }) {
  const style = { width: size, height: size };
  if (service.thumbnail) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={service.thumbnail} alt={service.ko} style={style} className="shrink-0 object-cover" />;
  }
  return (
    <div
      style={style}
      className={clsx(
        "serif-display flex shrink-0 items-center justify-center text-3xl italic",
        service.signature ? "bg-green text-white" : "bg-stone text-ink/60",
      )}
    >
      {service.en.slice(0, 1)}
    </div>
  );
}

const OPTIONAL_ICONS: Record<OptionalServiceIcon, typeof Coffee> = {
  coffee: Coffee,
  hanger: Shirt,
  bag: ShoppingBag,
  sparkle: Sparkles,
};

export function OptionalIcon({ icon, className }: { icon: OptionalServiceIcon; className?: string }) {
  const Icon = OPTIONAL_ICONS[icon] ?? Sparkles;
  return <Icon className={className} strokeWidth={1.2} />;
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative h-6 w-11 shrink-0 rounded-full transition",
        checked ? "bg-green" : "bg-line",
      )}
    >
      <span
        className={clsx(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all",
          checked ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
  );
}

/** 이미지를 골라 작은 data URL 로 줄여 돌려준다 (localStorage 용량 보호) */
export function ImagePicker({
  value,
  onChange,
  maxSize = 320,
  label = "사진 변경",
}: {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  maxSize?: number;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);

  async function handle(file: File) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    onChange(canvas.toDataURL("image/jpeg", 0.82));
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="rounded-full border border-line px-4 py-2 text-xs hover:border-ink"
      >
        {value ? label : "사진 올리기"}
      </button>
      {value && (
        <button type="button" onClick={() => onChange(undefined)} className="text-xs text-muted underline">
          삭제
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handle(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
