"use client";

import { useCallback, useEffect, useState } from "react";
import { nowHHmm } from "@/lib/format";
import { addOptionalService, checkIn, findReservation, useStore } from "@/lib/store";
import type { Customer, KioskConfig, LanguageCode, Reservation } from "@/lib/types";
import {
  CompleteScreen,
  DesignerScreen,
  OptionalScreen,
  PurposeScreen,
  ReservationScreen,
  WelcomeScreen,
} from "./screens";

type Step = "welcome" | "reservation" | "purpose" | "designer" | "complete" | "optional";
type Entry = "reservation" | "walkin" | "consult";

interface Flow {
  step: Step;
  lang: LanguageCode;
  phone: string;
  error?: string;
  entry?: Entry;
  reservation?: Reservation;
  serviceIds: string[];
  designerId?: string;
  result?: { customer: Customer; waitMinutes: number };
  requested: string[];
}

const INITIAL: Flow = { step: "welcome", lang: "ko", phone: "", serviceIds: [], requested: [] };

/** 손님이 자리를 떠나도 다음 손님을 위해 처음 화면으로 돌아가는 시간 */
const IDLE_RESET_MS = 90_000;

export default function KioskApp() {
  const store = useStore();
  const config = store.published;
  const kiosk = config.kiosk;
  const [flow, setFlow] = useState<Flow>(INITIAL);

  const update = (patch: Partial<Flow>) => setFlow((f) => ({ ...f, ...patch }));
  const reset = useCallback(() => setFlow((f) => ({ ...INITIAL, lang: f.lang })), []);

  // 무입력 자동 초기화
  useEffect(() => {
    if (flow.step === "welcome") return;
    let timer = window.setTimeout(reset, IDLE_RESET_MS);
    const bump = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(reset, IDLE_RESET_MS);
    };
    window.addEventListener("pointerdown", bump);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", bump);
    };
  }, [flow.step, reset]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [flow.step]);

  const signature = kiosk.services.find((s) => s.signature && s.visible) ?? kiosk.services[0];

  function walkInName() {
    return flow.phone.length >= 4 ? `현장 고객 (${flow.phone.slice(-4)})` : "현장 고객";
  }

  function finish(designerId: string) {
    const r = flow.reservation;
    const result = checkIn(config, {
      customerName: r?.customerName ?? walkInName(),
      designerId,
      reservationTime: r?.reservationTime ?? nowHHmm(),
      serviceIds: flow.serviceIds,
      reservationId: r?.id,
    });
    update({ step: "complete", designerId, result });
  }

  switch (flow.step) {
    case "welcome":
      return (
        <WelcomeScreen
          config={kiosk}
          lang={flow.lang}
          onLang={(lang) => update({ lang })}
          onStart={() => update({ step: "reservation" })}
        />
      );

    case "reservation":
      return (
        <ReservationScreen
          config={kiosk}
          phone={flow.phone}
          error={flow.error}
          onPhone={(phone) => update({ phone, error: undefined })}
          onBack={reset}
          onCheck={() => {
            const reservation = findReservation(flow.phone);
            if (!reservation) {
              update({ error: "예약을 찾지 못했어요. 아래 ‘현장 접수하기’로 진행해주세요." });
              return;
            }
            update({
              step: "purpose",
              entry: "reservation",
              reservation,
              serviceIds: reservation.serviceIds,
              designerId: reservation.designerId,
            });
          }}
          onWalkIn={() => update({ step: "purpose", entry: "walkin", reservation: undefined, designerId: undefined })}
          onConsult={() =>
            update({
              step: "designer",
              entry: "consult",
              reservation: undefined,
              designerId: undefined,
              serviceIds: signature ? [signature.id] : [],
            })
          }
        />
      );

    case "purpose":
      return (
        <PurposeScreen
          config={kiosk}
          lang={flow.lang}
          highlightIds={flow.reservation?.serviceIds}
          onBack={() => update({ step: "reservation" })}
          onSelect={(id) => {
            // 예약 손님이 예약한 시술을 고르면 예약 내용을 그대로 유지한다
            const reserved = flow.reservation?.serviceIds ?? [];
            update({ step: "designer", serviceIds: reserved.includes(id) ? reserved : [id] });
          }}
        />
      );

    case "designer":
      return (
        <DesignerScreen
          config={kiosk}
          selectedId={flow.designerId}
          reservedId={flow.reservation?.designerId}
          onSelect={(designerId) => update({ designerId })}
          onBack={() => update({ step: flow.entry === "consult" ? "reservation" : "purpose" })}
          onNext={() => flow.designerId && finish(flow.designerId)}
        />
      );

    case "complete":
      return flow.result ? (
        <CompleteStep
          config={kiosk}
          customer={flow.result.customer}
          waitMinutes={flow.result.waitMinutes}
          onMore={() => update({ step: "optional" })}
          onHome={reset}
        />
      ) : null;

    case "optional":
      return (
        <OptionalScreen
          config={kiosk}
          ticket={flow.result?.customer.ticket}
          requestedIds={flow.requested}
          onRequest={(id) => {
            if (flow.result) addOptionalService(flow.result.customer.id, id);
            update({ requested: [...flow.requested, id] });
          }}
          onDone={reset}
        />
      );
  }
}

/** 완료 화면: 설정한 시간이 지나면 처음 화면으로 돌아간다 */
function CompleteStep({
  config,
  customer,
  waitMinutes,
  onMore,
  onHome,
}: {
  config: KioskConfig;
  customer: Customer;
  waitMinutes: number;
  onMore: () => void;
  onHome: () => void;
}) {
  const total = config.wait.autoReturnSeconds;
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 500);
    return () => window.clearInterval(id);
  }, [startedAt]);

  const secondsLeft = Math.max(0, total - elapsed);
  useEffect(() => {
    if (secondsLeft === 0) onHome();
  }, [secondsLeft, onHome]);

  return (
    <CompleteScreen
      config={config}
      customer={customer}
      waitMinutes={waitMinutes}
      secondsLeft={secondsLeft}
      onMore={onMore}
      onHome={onHome}
    />
  );
}
