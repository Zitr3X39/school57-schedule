/**
 * Time helpers that respect the school's local timezone (Калининградское время,
 * UTC+2). The UI is always rendered "as if" the user is in Kaliningrad — that
 * way an out-of-region preview deployment still shows the correct "current
 * lesson" for the school day.
 */

import { DAY_OF_WEEK_ORDER, type DayOfWeek } from "./schedule/types";

export const SCHOOL_TIMEZONE = "Europe/Kaliningrad"; // UTC+2

interface Parts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 Sunday .. 6 Saturday
  iso: string; // YYYY-MM-DD in school tz
  hhmm: string;
}

const FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  timeZone: SCHOOL_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  weekday: "short",
});

const RU_WEEKDAY_TO_INDEX: Record<string, number> = {
  вс: 0, вск: 0, "воскресенье": 0,
  пн: 1, пнд: 1, "понедельник": 1,
  вт: 2, втр: 2, "вторник": 2,
  ср: 3, срд: 3, "среда": 3,
  чт: 4, чтв: 4, "четверг": 4,
  пт: 5, птн: 5, "пятница": 5,
  сб: 6, сбт: 6, "суббота": 6,
};

export function partsInSchoolTz(date: Date): Parts {
  const out: Record<string, string> = {};
  for (const part of FORMATTER.formatToParts(date)) {
    if (part.type !== "literal") out[part.type] = part.value;
  }
  const year = Number(out.year);
  const month = Number(out.month);
  const day = Number(out.day);
  const hour = Number(out.hour) % 24;
  const minute = Number(out.minute);
  const weekdayKey = (out.weekday ?? "").toLowerCase().replace(/[^а-я]/g, "");
  const weekday = RU_WEEKDAY_TO_INDEX[weekdayKey] ?? 0;
  return {
    year,
    month,
    day,
    hour,
    minute,
    weekday,
    iso: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    hhmm: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

export function todayInSchoolTz(now = new Date()): { iso: string; dayOfWeek: DayOfWeek } {
  const parts = partsInSchoolTz(now);
  const idx = parts.weekday === 0 ? 6 : parts.weekday - 1;
  return { iso: parts.iso, dayOfWeek: DAY_OF_WEEK_ORDER[idx] };
}

export function nowMinutesInSchoolTz(now = new Date()): number {
  const parts = partsInSchoolTz(now);
  return parts.hour * 60 + parts.minute;
}

export function timeStringInSchoolTz(now = new Date()): string {
  return partsInSchoolTz(now).hhmm;
}

export function mondayWeekIdInSchoolTz(now = new Date()): string {
  const parts = partsInSchoolTz(now);
  // Use a UTC midpoint of that calendar day so DST quirks don't matter for
  // the offset arithmetic.
  const dayUtc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  // Compute days since Monday; in JS getUTCDay 0=Sun .. 1=Mon.
  const daysSinceMonday = (parts.weekday === 0 ? 6 : parts.weekday - 1);
  dayUtc.setUTCDate(dayUtc.getUTCDate() - daysSinceMonday);
  const y = dayUtc.getUTCFullYear();
  const m = String(dayUtc.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dayUtc.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}
