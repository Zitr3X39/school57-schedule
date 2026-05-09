import type { DayOfWeek, Lesson, Replacement, WeekSchedule } from "./types";

/**
 * Normalizer / dedupe / replacement application layer.
 */

export interface StableLessonIdInput {
  className: string;
  date: string;
  lessonNumber: number;
  subject: string;
  group: 1 | 2 | null;
}

/** Generate a stable id for a lesson — used as React keys and cache lookup. */
export function stableLessonId(input: StableLessonIdInput): string {
  const groupPart = input.group ?? "x";
  return [
    input.className,
    input.date,
    input.lessonNumber,
    groupPart,
    slug(input.subject),
  ].join("::");
}

function slug(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^а-яёa-z0-9]+/giu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/**
 * Apply replacements to a parsed week. The keo.gov39.ru source already shows
 * the replaced lessons inline within the day tables — the standalone
 * replacements list is duplicate metadata. We use it to mark already-parsed
 * lessons with `isReplacement: true` so the UI can highlight them.
 */
export function applyReplacements(week: WeekSchedule): WeekSchedule {
  if (week.replacements.length === 0) return week;
  const replacementsByDate = new Map<string, Replacement[]>();
  for (const r of week.replacements) {
    const arr = replacementsByDate.get(r.date) ?? [];
    arr.push(r);
    replacementsByDate.set(r.date, arr);
  }
  const days = week.days.map((day) => {
    const repls = replacementsByDate.get(day.date) ?? [];
    if (repls.length === 0) return day;
    const lessons = day.lessons.map((lesson) => {
      const isReplaced = repls.some((r) =>
        normalizeForCompare(r.toSubject) === normalizeForCompare(lesson.subject),
      );
      return isReplaced ? { ...lesson, isReplacement: true } : lesson;
    });
    return { ...day, lessons };
  });
  return { ...week, days };
}

function normalizeForCompare(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Filter lessons by an active group. When a lesson is shared (no group split)
 * it always appears. When the lesson is split, only the matching group's
 * lesson is shown.
 */
export function filterLessonsByGroup(lessons: Lesson[], group: 1 | 2): Lesson[] {
  return lessons.filter((l) => l.group === null || l.group === group);
}

/** Sort lessons by lessonNumber ascending; if equal, group 1 first. */
export function sortLessons(lessons: Lesson[]): Lesson[] {
  return [...lessons].sort((a, b) => {
    if (a.lessonNumber !== b.lessonNumber) return a.lessonNumber - b.lessonNumber;
    if (a.group === b.group) return 0;
    if (a.group === null) return -1;
    if (b.group === null) return 1;
    return a.group - b.group;
  });
}

export function dayOfWeekFromIso(iso: string): DayOfWeek {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const idx = dt.getUTCDay(); // 0..6, 0 = Sunday
  const map: DayOfWeek[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return map[idx];
}
