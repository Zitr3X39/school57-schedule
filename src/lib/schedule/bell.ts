import type { BellSchedule, TimeOfDay } from "./types";

/**
 * Default bell schedule for МАОУ СОШ №57 г. Калининград.
 * Lessons are 40 minutes with breaks. The user can override per device via
 * the settings drawer (persisted in localStorage).
 *
 * If we ever discover the school publishes its bell schedule somewhere, we
 * should swap this with the real one — until then this is a sensible default
 * that mirrors typical Калининград schools.
 */
export const DEFAULT_BELL_SCHEDULE: BellSchedule = [
  { lessonNumber: 1, startTime: "08:00", endTime: "08:40" },
  { lessonNumber: 2, startTime: "08:50", endTime: "09:30" },
  { lessonNumber: 3, startTime: "09:50", endTime: "10:30" },
  { lessonNumber: 4, startTime: "10:50", endTime: "11:30" },
  { lessonNumber: 5, startTime: "11:40", endTime: "12:20" },
  { lessonNumber: 6, startTime: "12:30", endTime: "13:10" },
  { lessonNumber: 7, startTime: "13:20", endTime: "14:00" },
  { lessonNumber: 8, startTime: "14:10", endTime: "14:50" },
  { lessonNumber: 9, startTime: "15:00", endTime: "15:40" },
];

export function bellFor(
  schedule: BellSchedule,
  lessonNumber: number,
): { startTime: TimeOfDay; endTime: TimeOfDay } {
  const entry = schedule.find((e) => e.lessonNumber === lessonNumber);
  if (entry) return { startTime: entry.startTime, endTime: entry.endTime };
  // Synthesize plausible times if a lesson number is outside our bell schedule.
  // Keeps the data layer well-formed even if a quirky lesson #10 appears.
  const last = schedule[schedule.length - 1];
  const offset = lessonNumber - last.lessonNumber;
  const start = addMinutes(last.endTime, 10 + offset * 50);
  const end = addMinutes(start, 40);
  return { startTime: start, endTime: end };
}

export function timeToMinutes(t: TimeOfDay): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function addMinutes(t: TimeOfDay, mins: number): TimeOfDay {
  const total = timeToMinutes(t) + mins;
  const h = Math.floor(((total % (24 * 60)) + 24 * 60) % (24 * 60) / 60);
  const m = ((total % 60) + 60) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function minutesBetween(a: TimeOfDay, b: TimeOfDay): number {
  return timeToMinutes(b) - timeToMinutes(a);
}

/** Normalize a free-form "08:00", "8.00", "8 00" to canonical "HH:MM". */
export function normalizeTime(input: string | null | undefined): TimeOfDay | null {
  if (!input) return null;
  const m = input.replace(/\s+/g, "").match(/^(\d{1,2})[:.\-_](\d{1,2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
