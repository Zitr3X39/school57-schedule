import type { DayOfWeek, Lesson, WeekSchedule } from "./types";
import { DAY_OF_WEEK_ORDER } from "./types";
import { todayInSchoolTz, nowMinutesInSchoolTz } from "@/lib/now";
import { timeToMinutes } from "./bell";

export interface DerivedLesson extends Lesson {
  /** "past", "current", "upcoming" relative to school time. */
  status: "past" | "current" | "upcoming";
  /** Progress 0..1 if status === "current", 0 otherwise. */
  progress: number;
}

export function lessonsForGroup(
  week: WeekSchedule | null | undefined,
  group: 1 | 2,
  dayIso?: string,
): Lesson[] {
  if (!week) return [];
  const days = dayIso ? week.days.filter((d) => d.date === dayIso) : week.days;
  return days.flatMap((d) =>
    d.lessons.filter((l) => l.group === null || l.group === group),
  );
}

export function todayLessons(week: WeekSchedule | null | undefined, group: 1 | 2): Lesson[] {
  if (!week) return [];
  const today = todayInSchoolTz();
  return lessonsForGroup(week, group, today.iso);
}

export function deriveStatus(lesson: Lesson, now: Date = new Date()): DerivedLesson {
  const today = todayInSchoolTz(now);
  const nowMin = nowMinutesInSchoolTz(now);
  if (lesson.date !== today.iso) {
    const ordered = compareDate(lesson.date, today.iso);
    return {
      ...lesson,
      status: ordered < 0 ? "past" : "upcoming",
      progress: 0,
    };
  }
  const start = timeToMinutes(lesson.startTime);
  const end = timeToMinutes(lesson.endTime);
  if (nowMin < start) {
    return { ...lesson, status: "upcoming", progress: 0 };
  }
  if (nowMin >= end) {
    return { ...lesson, status: "past", progress: 1 };
  }
  return {
    ...lesson,
    status: "current",
    progress: Math.min(1, Math.max(0, (nowMin - start) / Math.max(1, end - start))),
  };
}

function compareDate(a: string, b: string): -1 | 0 | 1 {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export interface CurrentNext {
  current: DerivedLesson | null;
  next: DerivedLesson | null;
  /** Minutes until the next lesson begins (when current is null). */
  minutesUntilNext: number | null;
  /** Minutes left in the current lesson. */
  minutesLeft: number | null;
}

export function currentAndNext(
  week: WeekSchedule | null | undefined,
  group: 1 | 2,
  now: Date = new Date(),
): CurrentNext {
  const today = todayInSchoolTz(now);
  const nowMin = nowMinutesInSchoolTz(now);
  const lessons = todayLessons(week, group);
  let current: Lesson | null = null;
  let next: Lesson | null = null;
  for (const l of lessons) {
    const start = timeToMinutes(l.startTime);
    const end = timeToMinutes(l.endTime);
    if (start <= nowMin && nowMin < end) current = l;
    else if (start > nowMin && next === null) next = l;
  }

  // If nothing today, find the next future lesson in the week.
  if (!current && !next) {
    const futureWeekLessons =
      lessonsForGroup(week, group)
        .filter((l) => l.date > today.iso)
        .sort((a, b) =>
          a.date === b.date ? a.lessonNumber - b.lessonNumber : a.date.localeCompare(b.date),
        );
    if (futureWeekLessons.length > 0) {
      next = futureWeekLessons[0];
    }
  }

  return {
    current: current ? deriveStatus(current, now) : null,
    next: next ? deriveStatus(next, now) : null,
    minutesUntilNext: next
      ? next.date === today.iso
        ? Math.max(0, timeToMinutes(next.startTime) - nowMin)
        : null
      : null,
    minutesLeft: current
      ? Math.max(0, timeToMinutes(current.endTime) - nowMin)
      : null,
  };
}

export interface SubjectStat {
  subject: string;
  count: number;
  /** How many minutes per week. */
  minutes: number;
}

export function subjectStats(
  week: WeekSchedule | null | undefined,
  group: 1 | 2,
): SubjectStat[] {
  if (!week) return [];
  const counts = new Map<string, { count: number; minutes: number }>();
  for (const d of week.days) {
    for (const l of d.lessons) {
      if (l.group !== null && l.group !== group) continue;
      const entry = counts.get(l.subject) ?? { count: 0, minutes: 0 };
      entry.count++;
      entry.minutes += timeToMinutes(l.endTime) - timeToMinutes(l.startTime);
      counts.set(l.subject, entry);
    }
  }
  return Array.from(counts.entries())
    .map(([subject, v]) => ({ subject, ...v }))
    .sort((a, b) => b.count - a.count);
}

export interface DaySummary {
  date: string;
  dayOfWeek: DayOfWeek;
  lessonCount: number;
  /** Subjects without dupes, in lesson order. */
  subjects: string[];
  startTime: string | null;
  endTime: string | null;
  hasReplacements: boolean;
  /** True when this date matches "today" in school tz. */
  isToday: boolean;
}

export function weekDaySummaries(
  week: WeekSchedule | null | undefined,
  group: 1 | 2,
  now: Date = new Date(),
): DaySummary[] {
  if (!week) return [];
  const today = todayInSchoolTz(now);
  return week.days.map((d) => {
    const lessons = d.lessons.filter((l) => l.group === null || l.group === group);
    const subjects: string[] = [];
    for (const l of lessons) {
      if (!subjects.includes(l.subject)) subjects.push(l.subject);
    }
    const startTime = lessons.length > 0 ? lessons[0].startTime : null;
    const endTime = lessons.length > 0 ? lessons[lessons.length - 1].endTime : null;
    const hasReplacements = lessons.some((l) => l.isReplacement);
    return {
      date: d.date,
      dayOfWeek: d.dayOfWeek,
      lessonCount: lessons.length,
      subjects,
      startTime,
      endTime,
      hasReplacements,
      isToday: d.date === today.iso,
    };
  });
}

/** Sort a week's days into Mon..Sun order regardless of input. */
export function sortDaysOfWeek<T extends { dayOfWeek: DayOfWeek }>(items: T[]): T[] {
  const order = new Map(DAY_OF_WEEK_ORDER.map((d, i) => [d, i] as const));
  return [...items].sort((a, b) => (order.get(a.dayOfWeek) ?? 0) - (order.get(b.dayOfWeek) ?? 0));
}
