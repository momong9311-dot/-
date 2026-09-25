"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_CONFIG, DEFAULT_RESERVATIONS, seedCustomers } from "./defaults";
import type { AppConfig, Customer, CustomerStatus, Reservation } from "./types";

// 백엔드 연동 전까지는 브라우저 localStorage 에 저장한다.
// 같은 브라우저의 다른 탭(키오스크 ↔ 현황판)은 storage 이벤트로 바로 동기화된다.
const KEYS = {
  published: "mm-kiosk:config:published",
  draft: "mm-kiosk:config:draft",
  draftSavedAt: "mm-kiosk:config:draftSavedAt",
  publishedAt: "mm-kiosk:config:publishedAt",
  customers: "mm-kiosk:customers",
  reservations: "mm-kiosk:reservations",
} as const;

export interface StoreState {
  hydrated: boolean;
  published: AppConfig;
  draft: AppConfig;
  draftSavedAt?: number;
  publishedAt?: number;
  customers: Customer[];
  reservations: Reservation[];
}

const SERVER_STATE: StoreState = {
  hydrated: false,
  published: DEFAULT_CONFIG,
  draft: DEFAULT_CONFIG,
  customers: [],
  reservations: DEFAULT_RESERVATIONS,
};

let state: StoreState = SERVER_STATE;
const listeners = new Set<() => void>();

function read<T>(key: string): T | undefined {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 용량 초과 등 — 메모리 상태는 유지한다
  }
}

/** 저장된 설정에 새로 추가된 필드가 빠져 있어도 기본값으로 채운다 */
function withDefaults(stored: Partial<AppConfig> | undefined): AppConfig {
  if (!stored) return DEFAULT_CONFIG;
  const k = stored.kiosk ?? DEFAULT_CONFIG.kiosk;
  const b = stored.board ?? DEFAULT_CONFIG.board;
  return {
    kiosk: {
      ...DEFAULT_CONFIG.kiosk,
      ...k,
      copy: { ...DEFAULT_CONFIG.kiosk.copy, ...k.copy },
      buttons: { ...DEFAULT_CONFIG.kiosk.buttons, ...k.buttons },
      wait: { ...DEFAULT_CONFIG.kiosk.wait, ...k.wait },
    },
    board: {
      display: { ...DEFAULT_CONFIG.board.display, ...b.display },
      board: { ...DEFAULT_CONFIG.board.board, ...b.board },
    },
  };
}

function loadFromStorage(): StoreState {
  let customers = read<Customer[]>(KEYS.customers);
  if (!customers) {
    customers = seedCustomers();
    write(KEYS.customers, customers);
  }
  const published = withDefaults(read<AppConfig>(KEYS.published));
  return {
    hydrated: true,
    published,
    draft: withDefaults(read<AppConfig>(KEYS.draft) ?? published),
    draftSavedAt: read<number>(KEYS.draftSavedAt),
    publishedAt: read<number>(KEYS.publishedAt),
    customers,
    reservations: read<Reservation[]>(KEYS.reservations) ?? DEFAULT_RESERVATIONS,
  };
}

function emit() {
  listeners.forEach((l) => l());
}

function setState(next: StoreState) {
  state = next;
  emit();
}

function subscribe(listener: () => void) {
  if (!state.hydrated && typeof window !== "undefined") {
    state = loadFromStorage();
  }
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key && e.key.startsWith("mm-kiosk:")) setState(loadFromStorage());
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  if (!state.hydrated && typeof window !== "undefined") {
    state = loadFromStorage();
  }
  return state;
}

export function useStore(): StoreState {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_STATE);
}

// ─── 날짜 · 번호 유틸 ─────────────────────────────────────

export function isToday(ts: number) {
  const d = new Date(ts);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function todaysCustomers(customers: Customer[]) {
  return customers.filter((c) => isToday(c.checkInAt));
}

export function formatTicket(n: number, prefix: string, digits: number) {
  return `${prefix} ${String(n).padStart(digits, "0")}`.trim();
}

function nextTicketNumber(customers: Customer[]) {
  const nums = todaysCustomers(customers).map((c) => Number(c.ticket.replace(/\D/g, "")) || 0);
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

// ─── 설정 ─────────────────────────────────────────────

export function saveDraft(draft: AppConfig) {
  const at = Date.now();
  write(KEYS.draft, draft);
  write(KEYS.draftSavedAt, at);
  setState({ ...state, draft, draftSavedAt: at });
}

export function publish(draft: AppConfig) {
  const at = Date.now();
  write(KEYS.draft, draft);
  write(KEYS.published, draft);
  write(KEYS.draftSavedAt, at);
  write(KEYS.publishedAt, at);
  setState({ ...state, draft, published: draft, draftSavedAt: at, publishedAt: at });
}

export function resetDemoData() {
  const customers = seedCustomers();
  write(KEYS.customers, customers);
  write(KEYS.reservations, DEFAULT_RESERVATIONS);
  setState({ ...state, customers, reservations: DEFAULT_RESERVATIONS });
}

export function resetConfig() {
  publish(DEFAULT_CONFIG);
}

// ─── 고객 ─────────────────────────────────────────────

function setCustomers(customers: Customer[]) {
  write(KEYS.customers, customers);
  setState({ ...state, customers });
}

export function findReservation(phone: string): Reservation | undefined {
  const digits = phone.replace(/\D/g, "");
  return state.reservations.find((r) => r.phone === digits);
}

/** '지정 안함'이면 대기 인원이 가장 적은 예약 가능 디자이너에게 배정한다 */
export function resolveDesigner(config: AppConfig, designerId: string): string {
  const designer = config.kiosk.designers.find((d) => d.id === designerId);
  if (designer && !designer.isAny) return designer.id;
  const candidates = config.kiosk.designers.filter((d) => !d.isAny && d.visible && d.status === "available");
  if (!candidates.length) return designerId;
  const waiting = todaysCustomers(state.customers).filter((c) => c.status === "waiting");
  const load = (id: string) => waiting.filter((c) => c.designerId === id).length;
  return candidates.reduce((best, d) => (load(d.id) < load(best.id) ? d : best)).id;
}

export function estimateWaitMinutes(config: AppConfig, designerId: string) {
  const ahead = todaysCustomers(state.customers).filter(
    (c) => c.status === "waiting" && c.designerId === designerId,
  ).length;
  return config.kiosk.wait.defaultWaitMinutes * Math.max(1, ahead);
}

export interface CheckInInput {
  customerName: string;
  designerId: string;
  reservationTime: string;
  serviceIds: string[];
  reservationId?: string;
}

export function checkIn(config: AppConfig, input: CheckInInput): { customer: Customer; waitMinutes: number } {
  const designerId = resolveDesigner(config, input.designerId);
  const waitMinutes = estimateWaitMinutes(config, designerId);
  const { numberPrefix, numberDigits } = config.kiosk.wait;
  const customer: Customer = {
    id: `c-${Date.now().toString(36)}`,
    customerName: input.customerName,
    designerId,
    reservationTime: input.reservationTime,
    serviceIds: input.serviceIds,
    status: "waiting",
    ticket: formatTicket(nextTicketNumber(state.customers), numberPrefix, numberDigits),
    checkInAt: Date.now(),
  };
  setCustomers([...state.customers, customer]);
  // 예상 대기시간은 체크인 직전 대기 인원 기준
  return { customer, waitMinutes };
}

export function setCustomerStatus(id: string, status: CustomerStatus) {
  setCustomers(
    state.customers.map((c) =>
      c.id === id ? { ...c, status, completedAt: status === "completed" ? Date.now() : undefined } : c,
    ),
  );
}

export function updateCustomer(id: string, patch: Partial<Customer>) {
  setCustomers(state.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)));
}

export function addOptionalService(id: string, optionalServiceId: string) {
  const c = state.customers.find((x) => x.id === id);
  if (!c) return;
  const current = c.optionalServiceIds ?? [];
  if (current.includes(optionalServiceId)) return;
  updateCustomer(id, { optionalServiceIds: [...current, optionalServiceId] });
}
