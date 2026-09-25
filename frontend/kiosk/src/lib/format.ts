import type { DateFormat, KioskConfig, Service } from "./types";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function formatDate(d: Date, format: DateFormat = "en-long") {
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  switch (format) {
    case "ko-long":
      return `${y}년 ${m + 1}월 ${day}일`;
    case "dot":
      return `${y}.${String(m + 1).padStart(2, "0")}.${String(day).padStart(2, "0")}`;
    default:
      return `${MONTHS[m]} ${day}, ${y}`;
  }
}

export function formatClock(d: Date) {
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, "0")} ${ampm}`;
}

export function nowHHmm() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatPhone(digits: string) {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export function serviceNames(ids: string[], services: Service[], lang: "ko" | "en" = "ko") {
  return ids
    .map((id) => services.find((s) => s.id === id))
    .filter((s): s is Service => Boolean(s))
    .map((s) => (lang === "en" ? s.en : s.ko))
    .join(" + ");
}

export function designerById(config: KioskConfig, id: string) {
  return config.designers.find((d) => d.id === id);
}

/** 배열 안에서 index 항목을 한 칸 위/아래로 옮긴다 */
export function move<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const to = index + dir;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}
