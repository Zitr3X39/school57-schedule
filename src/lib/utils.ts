import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format an ISO `YYYY-MM-DD` to "DD месяц". */
export function formatDateRu(iso: string, opts?: { weekday?: boolean }): string {
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ];
  const weekdays = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const main = `${dt.getUTCDate()} ${months[dt.getUTCMonth()]}`;
  if (opts?.weekday) return `${weekdays[dt.getUTCDay()]} · ${main}`;
  return main;
}

export function pluralizeRu(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const lastDigit = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (lastDigit > 1 && lastDigit < 5) return forms[1];
  if (lastDigit === 1) return forms[0];
  return forms[2];
}

/** Format a number of minutes as "Xч Yм" or "Xм" if under an hour. */
export function formatDurationRu(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes));
  if (m < 60) return `${m} ${pluralizeRu(m, ["минута", "минуты", "минут"])}`;
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  if (mins === 0) return `${hours} ${pluralizeRu(hours, ["час", "часа", "часов"])}`;
  return `${hours} ${pluralizeRu(hours, ["час", "часа", "часов"])} ${mins} ${pluralizeRu(mins, ["минута", "минуты", "минут"])}`;
}

/** Format a number of minutes compactly as "Mh Mm" / "Mm". */
export function formatCountdown(totalMinutes: number): string {
  const m = Math.max(0, Math.floor(totalMinutes));
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (rest === 0) return `${h} ч`;
  return `${h} ч ${rest} мин`;
}

/** Simple polyfill for crypto.randomUUID for older runtimes. */
export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
