import type { Lesson, WeekSchedule } from "@/lib/schedule/types";

/**
 * A lesson is considered to "have homework" only if its `notes` field has
 * meaningful content. The school site frequently emits placeholders like
 * "Без задания" / "нет домашнего задания" / "—", sometimes duplicated.
 * After stripping those, anything left is real homework worth a checkbox.
 */
// JavaScript `\b` only respects ASCII word chars — Cyrillic falls outside,
// so we anchor manually with non-letter boundaries via Unicode categories.
const PLACEHOLDER_RE =
  /(^|\P{L})(без\s*задания|нет\s+домашнего\s+задания|нет\s*задания|не\s+задано|n\/a|—|–)(?=\P{L}|$)/giu;

export function lessonHasHomework(lesson: Lesson): boolean {
  if (!lesson.notes) return false;
  const stripped = lesson.notes
    .replace(PLACEHOLDER_RE, " ")
    .replace(/[—–\-\s]+/g, " ")
    .trim();
  return stripped.length > 0;
}

/**
 * Stats about homework completion for a given week and selected group.
 * Used for badges / counters.
 */
export interface HomeworkStats {
  total: number;
  done: number;
  remaining: number;
}

export function homeworkStats(
  week: WeekSchedule | null,
  group: 1 | 2,
  done: Record<string, true>,
): HomeworkStats {
  if (!week) return { total: 0, done: 0, remaining: 0 };
  let total = 0;
  let completed = 0;
  for (const day of week.days) {
    for (const l of day.lessons) {
      if (l.group !== null && l.group !== group) continue;
      if (!lessonHasHomework(l)) continue;
      total++;
      if (done[l.id]) completed++;
    }
  }
  return { total, done: completed, remaining: total - completed };
}
