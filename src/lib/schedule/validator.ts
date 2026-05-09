import type { Lesson, ParseReport, WeekSchedule } from "./types";

/**
 * Validation layer. Runs after the parser and before the data is exposed to
 * the API / UI. Drops obviously-invalid lessons and reports the issues.
 */

const MIN_LESSON_NUMBER = 0;
const MAX_LESSON_NUMBER = 12;

export interface ValidationOutcome {
  schedule: WeekSchedule;
  report: ParseReport;
}

export function validateSchedule(
  schedule: WeekSchedule,
  baseReport: ParseReport,
): ValidationOutcome {
  const warnings = [...baseReport.warnings];
  const errors = [...baseReport.errors];

  const dedupedDays = schedule.days.map((day) => {
    const seen = new Map<string, Lesson>();
    for (const lesson of day.lessons) {
      const issue = lessonIssue(lesson);
      if (issue) {
        warnings.push(`${lesson.className} ${lesson.date} #${lesson.lessonNumber}: ${issue}`);
        continue;
      }
      const key = `${lesson.lessonNumber}|${lesson.group ?? "x"}|${lesson.subject}`;
      if (!seen.has(key)) seen.set(key, lesson);
    }
    return { ...day, lessons: Array.from(seen.values()) };
  });

  const lessonsTotal = dedupedDays.reduce((acc, d) => acc + d.lessons.length, 0);

  return {
    schedule: { ...schedule, days: dedupedDays },
    report: {
      ...baseReport,
      ok: lessonsTotal > 0,
      lessonsFound: lessonsTotal,
      warnings,
      errors,
    },
  };
}

function lessonIssue(l: Lesson): string | null {
  if (!l.subject || l.subject.length < 2) return "empty subject";
  if (
    !Number.isInteger(l.lessonNumber) ||
    l.lessonNumber < MIN_LESSON_NUMBER ||
    l.lessonNumber > MAX_LESSON_NUMBER
  ) {
    return `lesson number out of range (${l.lessonNumber})`;
  }
  if (!isHHMM(l.startTime) || !isHHMM(l.endTime)) {
    return `bad time (${l.startTime}-${l.endTime})`;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(l.date)) return `bad date (${l.date})`;
  if (l.group !== null && l.group !== 1 && l.group !== 2) {
    return `bad group (${l.group})`;
  }
  return null;
}

function isHHMM(t: string): boolean {
  return /^\d{2}:\d{2}$/.test(t);
}
