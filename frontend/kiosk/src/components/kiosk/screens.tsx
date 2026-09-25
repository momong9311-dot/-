"use client";

import clsx from "clsx";
import { ArrowRight, CalendarDays, Check, Delete, Home, MessageCircle } from "lucide-react";
import { Avatar, OptionalIcon, PrimaryButton, ServiceThumb } from "@/components/ui/primitives";
import { formatPhone } from "@/lib/format";
import type { Customer, KioskConfig, LanguageCode } from "@/lib/types";
import { BackButton, Headline, KioskFrame, StepIndicator } from "./KioskFrame";

// 각 화면은 config 만으로 그려지는 순수 컴포넌트다.
// 실제 키오스크와 설정 화면의 미리보기가 같은 컴포넌트를 쓴다.

const noop = () => {};

// ─── 01 WELCOME ───────────────────────────────────────

export function WelcomeScreen({
  config,
  lang = "ko",
  onLang = noop,
  onStart = noop,
}: {
  config: KioskConfig;
  lang?: LanguageCode;
  onLang?: (code: LanguageCode) => void;
  onStart?: () => void;
}) {
  const { copy, buttons } = config;
  const languages = config.languages.filter((l) => l.visible);
  const words = copy.supportingWords.split("/").map((w) => w.trim()).filter(Boolean);

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div className={clsx("absolute inset-0", !copy.heroImage && "hero-fallback")}>
        {copy.heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={copy.heroImage} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-paper/85 via-paper/55 to-paper/90" />
      </div>

      <KioskFrame config={config} className="!bg-transparent">
        <div className="mt-auto animate-fade-up">
          <p className="eyebrow text-ink/70">{copy.welcomeEyebrow}</p>
          <h1 className="serif-display mt-6 text-[76px] leading-[0.95] sm:text-[92px]">{copy.welcomeHeadline}</h1>
          <p className="pre-line mt-8 text-xl font-light leading-relaxed tracking-wide text-ink/80">
            {copy.welcomeCopy}
          </p>
        </div>

        {languages.length > 1 && (
          <div className="mt-14 flex gap-2">
            {languages.map((l) => (
              <button
                key={l.id}
                onClick={() => onLang(l.code)}
                className={clsx(
                  "relative h-14 flex-1 border text-sm transition",
                  lang === l.code ? "border-ink bg-surface/80 text-ink" : "border-line bg-surface/40 text-ink/60",
                )}
              >
                {l.label}
                {lang === l.code && <span className="absolute inset-x-6 bottom-2 h-px bg-green" />}
              </button>
            ))}
          </div>
        )}

        <PrimaryButton className="mt-6" onClick={onStart}>
          {buttons.start}
        </PrimaryButton>

        <div className="mt-14 flex items-end justify-between gap-6">
          <div className="eyebrow !text-[10px] leading-loose text-ink/60">
            {words.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>
          <span className="mb-2 h-px flex-1 bg-ink/20" />
          <div className="eyebrow !text-[10px] text-right leading-loose text-ink/60">{copy.footerMessage}</div>
        </div>
      </KioskFrame>
    </div>
  );
}

// ─── 02 RESERVATION CHECK ─────────────────────────────

const KEYPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "del"];

export function ReservationScreen({
  config,
  phone = "",
  error,
  onPhone = noop,
  onCheck = noop,
  onWalkIn = noop,
  onConsult = noop,
  onBack = noop,
}: {
  config: KioskConfig;
  phone?: string;
  error?: string;
  onPhone?: (digits: string) => void;
  onCheck?: () => void;
  onWalkIn?: () => void;
  onConsult?: () => void;
  onBack?: () => void;
}) {
  const { copy, buttons } = config;
  const press = (k: string) => {
    if (k === "clear") return onPhone("");
    if (k === "del") return onPhone(phone.slice(0, -1));
    if (phone.length < 11) onPhone(phone + k);
  };

  return (
    <KioskFrame config={config} footer={<BackButton label={buttons.back} onClick={onBack} />}>
      <StepIndicator step={1} />
      <div className="mt-10">
        <Headline title={copy.reservationHeadline} copy={copy.reservationCopy} />
      </div>

      <div className="mt-10 flex h-20 items-stretch border border-line bg-surface">
        <span className="flex items-center border-r border-line px-6 text-ink/70">+82</span>
        <span
          className={clsx(
            "flex flex-1 items-center px-6 text-2xl tracking-wider",
            phone ? "text-ink" : "text-base tracking-normal text-muted",
          )}
        >
          {phone ? formatPhone(phone) : "휴대폰 번호를 입력해주세요"}
        </span>
      </div>
      {error && <p className="mt-3 text-sm text-green">{error}</p>}

      <div className="mt-4 grid grid-cols-3 gap-2">
        {KEYPAD.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className="flex h-16 items-center justify-center border border-line-soft bg-surface/70 text-2xl font-light active:bg-stone"
          >
            {k === "del" ? (
              <Delete className="h-6 w-6" strokeWidth={1.2} />
            ) : k === "clear" ? (
              <span className="text-sm text-muted">전체 삭제</span>
            ) : (
              k
            )}
          </button>
        ))}
      </div>

      <PrimaryButton className="mt-6" onClick={onCheck} disabled={phone.length < 10}>
        {buttons.checkReservation}
      </PrimaryButton>

      <div className="my-8 flex items-center gap-4 text-sm text-muted">
        <span className="h-px flex-1 bg-line" />
        또는
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: CalendarDays, title: buttons.walkIn, sub: buttons.walkInSub, onClick: onWalkIn },
          { icon: MessageCircle, title: buttons.consultOnly, sub: buttons.consultOnlySub, onClick: onConsult },
        ].map(({ icon: Icon, title, sub, onClick }) => (
          <button
            key={title}
            onClick={onClick}
            className="flex min-h-36 flex-col items-center justify-center gap-3 border border-line bg-surface/60 px-4 py-6 text-center active:border-ink"
          >
            <Icon className="h-6 w-6 text-ink/70" strokeWidth={1.1} />
            <span className="text-[15px]">{title}</span>
            <span className="text-xs text-muted">{sub}</span>
          </button>
        ))}
      </div>
    </KioskFrame>
  );
}

// ─── 03 VISIT PURPOSE ─────────────────────────────────

export function PurposeScreen({
  config,
  lang = "ko",
  highlightIds = [],
  onSelect = noop,
  onBack = noop,
}: {
  config: KioskConfig;
  lang?: LanguageCode;
  highlightIds?: string[];
  onSelect?: (serviceId: string) => void;
  onBack?: () => void;
}) {
  const { copy, buttons } = config;
  const services = config.services.filter((s) => s.visible);
  const en = lang !== "ko";

  return (
    <KioskFrame config={config} footer={<BackButton label={buttons.back} onClick={onBack} />}>
      <StepIndicator step={2} />
      <div className="mt-10">
        <Headline title={copy.purposeHeadline} copy={copy.purposeCopy} />
      </div>

      <div className="mt-10 flex flex-col gap-3">
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={clsx(
              "group flex h-24 items-center overflow-hidden border bg-surface text-left transition active:border-ink",
              highlightIds.includes(s.id) ? "border-green" : "border-line",
              s.signature && "border-l-[3px] border-l-green",
            )}
          >
            <ServiceThumb service={s} size={96} />
            <div className="flex-1 px-6">
              <div className="text-xl">{en ? s.en : s.ko}</div>
              <div className="eyebrow mt-1.5 !text-[10px] text-muted">{en ? s.ko : s.en}</div>
            </div>
            {highlightIds.includes(s.id) && (
              <span className="mr-4 rounded-full bg-green px-2.5 py-1 text-[11px] text-white">예약</span>
            )}
            <ArrowRight className="mr-7 h-5 w-5 text-ink/60" strokeWidth={1.2} />
          </button>
        ))}
      </div>
    </KioskFrame>
  );
}

// ─── 04 DESIGNER SELECTION ────────────────────────────

export function DesignerScreen({
  config,
  selectedId,
  reservedId,
  onSelect = noop,
  onNext = noop,
  onBack = noop,
}: {
  config: KioskConfig;
  selectedId?: string;
  reservedId?: string;
  onSelect?: (id: string) => void;
  onNext?: () => void;
  onBack?: () => void;
}) {
  const { copy, buttons } = config;
  const designers = config.designers.filter((d) => d.visible);

  return (
    <KioskFrame config={config} footer={<BackButton label={buttons.back} onClick={onBack} />}>
      <StepIndicator step={3} />
      <div className="mt-10">
        <Headline title={copy.designerHeadline} copy={copy.designerCopy} />
      </div>

      <div role="radiogroup" className="mt-10 flex flex-col gap-3">
        {designers.map((d) => {
          const selected = selectedId === d.id;
          const closed = d.status === "closed" && d.id !== reservedId;
          return (
            <button
              key={d.id}
              role="radio"
              aria-checked={selected}
              disabled={closed}
              onClick={() => onSelect(d.id)}
              className={clsx(
                "flex min-h-24 items-center gap-5 border bg-surface px-4 py-3 text-left transition",
                selected ? "border-green ring-1 ring-green" : "border-line",
                closed && "opacity-40",
              )}
            >
              <Avatar designer={d} size={68} />
              <div className="flex-1">
                <div className="text-xl">{d.name}</div>
                <div className="mt-1 text-sm text-muted">{closed ? "오늘 예약 마감" : d.role}</div>
              </div>
              {d.id === reservedId && (
                <span className="rounded-full bg-green px-2.5 py-1 text-[11px] text-white">예약됨</span>
              )}
              <span
                className={clsx(
                  "mr-2 flex h-7 w-7 items-center justify-center rounded-full border",
                  selected ? "border-green bg-green text-white" : "border-line",
                )}
              >
                {selected && <Check className="h-4 w-4" strokeWidth={2} />}
              </span>
            </button>
          );
        })}
      </div>

      <PrimaryButton className="mt-8" onClick={onNext} disabled={!selectedId}>
        {buttons.next}
      </PrimaryButton>
    </KioskFrame>
  );
}

// ─── 05 CHECK-IN COMPLETE ─────────────────────────────

export function CompleteScreen({
  config,
  customer,
  waitMinutes,
  secondsLeft,
  onMore = noop,
  onHome = noop,
}: {
  config: KioskConfig;
  customer: Pick<Customer, "ticket" | "designerId">;
  waitMinutes: number;
  secondsLeft?: number;
  onMore?: () => void;
  onHome?: () => void;
}) {
  const { copy, buttons } = config;
  const designer = config.designers.find((d) => d.id === customer.designerId);

  return (
    <KioskFrame config={config}>
      <StepIndicator step={4} />
      <div className="mt-10">
        <Headline title={copy.completeHeadline} copy={copy.completeCopy} />
      </div>

      <div className="mt-10 animate-fade-up border border-line bg-surface px-8 py-10 text-center">
        <div className="eyebrow text-muted">대기번호 · WAITING NO.</div>
        <div className="serif-display mt-4 text-[88px] leading-none">{customer.ticket}</div>
        <div className="mx-auto mt-6 h-px w-16 bg-line" />
        <div className="mt-5 text-lg">
          예상 대기시간 <span className="text-green">약 {waitMinutes}분</span>
        </div>
      </div>

      {designer && (
        <div className="mt-10 flex flex-col items-center">
          <div className="flex w-full items-center gap-4 text-sm text-muted">
            <span className="h-px flex-1 bg-line" />
            담당 디자이너
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="mt-5 flex items-center gap-4">
            <Avatar designer={designer} size={56} />
            <div>
              <div className="text-lg">{designer.name}</div>
              <div className="text-sm text-muted">{designer.role}</div>
            </div>
          </div>
        </div>
      )}

      <p className="pre-line mt-10 text-center text-lg font-light leading-relaxed text-ink/70">
        “{copy.brandMessage}”
      </p>

      <div className="mt-auto pt-10">
        <button
          onClick={onMore}
          className="mb-3 flex w-full items-center justify-center gap-2 py-3 text-[15px] text-green"
        >
          {buttons.moreServices}
          <ArrowRight className="h-4 w-4" strokeWidth={1.4} />
        </button>
        <button
          onClick={onHome}
          className="flex h-20 w-full items-center justify-center gap-3 border border-ink/80 text-lg active:bg-stone"
        >
          <Home className="h-5 w-5" strokeWidth={1.2} />
          {buttons.home}
        </button>
        {secondsLeft !== undefined && (
          <p className="mt-4 text-center text-xs text-muted">{secondsLeft}초 후 처음 화면으로 돌아갑니다.</p>
        )}
      </div>
    </KioskFrame>
  );
}

// ─── 06 OPTIONAL SERVICES ─────────────────────────────

export function OptionalScreen({
  config,
  ticket,
  requestedIds = [],
  onRequest = noop,
  onDone = noop,
}: {
  config: KioskConfig;
  ticket?: string;
  requestedIds?: string[];
  onRequest?: (id: string) => void;
  onDone?: () => void;
}) {
  const { copy, buttons } = config;
  const options = config.optionalServices.filter((o) => o.visible);

  return (
    <KioskFrame
      config={config}
      right={ticket ? <div className="eyebrow !tracking-[0.2em]">WAITING NO. {ticket}</div> : undefined}
      footer={
        <div>
          <button onClick={onDone} className="flex h-14 items-center gap-2 text-[15px] text-ink/70">
            {requestedIds.length ? buttons.home : buttons.skipOptional}
            <ArrowRight className="h-4 w-4" strokeWidth={1.2} />
          </button>
          <div className="mt-8 flex items-center gap-4">
            <span className="h-px w-10 bg-ink/30" />
            <span className="eyebrow !text-[10px] text-ink/60">{copy.welcomeEyebrow}</span>
          </div>
        </div>
      }
    >
      <Headline title={copy.optionalHeadline} copy={copy.optionalCopy} />

      <div className="mt-10 flex flex-col gap-3">
        {options.map((o) => {
          const requested = requestedIds.includes(o.id);
          return (
            <button
              key={o.id}
              onClick={() => onRequest(o.id)}
              disabled={requested}
              className={clsx(
                "flex min-h-24 items-center gap-5 border bg-surface px-6 text-left transition",
                requested ? "border-green" : "border-line active:border-ink",
                o.signature && "border-l-[3px] border-l-green",
              )}
            >
              <OptionalIcon icon={o.icon} className="h-7 w-7 text-ink/70" />
              <div className="flex-1">
                <div className="text-lg">{o.title}</div>
                <div className="mt-1 text-sm text-muted">{requested ? "직원에게 전달했어요" : o.description}</div>
              </div>
              {requested ? (
                <Check className="h-5 w-5 text-green" strokeWidth={1.6} />
              ) : (
                <ArrowRight className="h-5 w-5 text-ink/60" strokeWidth={1.2} />
              )}
            </button>
          );
        })}
      </div>
    </KioskFrame>
  );
}
