/**
 * "Разговоры о важном" / classroom-hour gap filler.
 *
 * The school's published timetable leaves a hole in the lesson numbering
 * on days when the homeroom hour is held — e.g. 10Д Tuesday has lessons
 * 1, 2, 3, 4, 5, 6, 8 (lesson 7 is missing). Per the school administration,
 * those holes are NOT free periods, they are the homeroom hour
 * ("Разговоры о важном"). This module synthesises a Lesson at every internal
 * gap so the UI shows the homeroom hour at its real position in the day.
 *
 * The teacher / room of the homeroom hour is not published anywhere on
 * keo.gov39.ru — we keep a static mapping in
 * `src/data/homeroom-teachers.json` that the project owner fills in over
 * time. Until a class is mapped, the synthesised lesson shows the subject
 * label and a generic "Классный руководитель" placeholder.
 */
import homeroomData from "@/data/homeroom-teachers.json";
import { bellFor, DEFAULT_BELL_SCHEDULE } from "./bell";
import { stableLessonId } from "./normalizer";
import type { DaySchedule, Lesson, WeekSchedule } from "./types";

export const CLASSROOM_HOUR_LABEL = "Разговоры о важном";
export const HOMEROOM_TEACHER_PLACEHOLDER = "Классный руководитель";

interface HomeroomMappingEntry {
  teacher: string;
  room: string | null;
}

interface HomeroomDataShape {
  homerooms: Record<string, HomeroomMappingEntry>;
}

const data = homeroomData as unknown as HomeroomDataShape;
const HOMEROOMS: Record<string, HomeroomMappingEntry> = data.homerooms ?? {};

/** Look up the homeroom teacher mapping for a class, if any. */
export function getHomeroom(className: string): HomeroomMappingEntry | null {
  return HOMEROOMS[className] ?? null;
}

/**
 * Fill internal lesson-number gaps within each day with a synthetic
 * "Разговоры о важном" lesson. Returns a new WeekSchedule (immutable).
 */
export function fillClassroomHourGaps(week: WeekSchedule): WeekSchedule {
  const homeroom = getHomeroom(week.className);
  const days = week.days.map((day) => fillDayGaps(day, week.className, homeroom));
  return { ...week, days };
}

function fillDayGaps(
  day: DaySchedule,
  className: string,
  homeroom: HomeroomMappingEntry | null,
): DaySchedule {
  if (day.lessons.length === 0) return day;
  const present = new Set(day.lessons.map((l) => l.lessonNumber));
  const min = Math.min(...present);
  const max = Math.max(...present);
  const missing: number[] = [];
  for (let n = min; n <= max; n++) {
    if (!present.has(n)) missing.push(n);
  }
  if (missing.length === 0) return day;

  const synthetic: Lesson[] = missing.map((n) =>
    buildClassroomHour(className, day.date, day.dayOfWeek, n, homeroom),
  );
  const merged = [...day.lessons, ...synthetic].sort((a, b) => {
    if (a.lessonNumber !== b.lessonNumber) return a.lessonNumber - b.lessonNumber;
    if (a.group === b.group) return 0;
    if (a.group === null) return -1;
    if (b.group === null) return 1;
    return a.group - b.group;
  });
  return { ...day, lessons: merged };
}

function buildClassroomHour(
  className: string,
  date: string,
  dayOfWeek: DaySchedule["dayOfWeek"],
  lessonNumber: number,
  homeroom: HomeroomMappingEntry | null,
): Lesson {
  const { startTime, endTime } = bellFor(DEFAULT_BELL_SCHEDULE, lessonNumber);
  const id = stableLessonId({
    className,
    date,
    lessonNumber,
    subject: CLASSROOM_HOUR_LABEL,
    group: null,
  });
  return {
    id,
    className,
    date,
    dayOfWeek,
    lessonNumber,
    startTime,
    endTime,
    subject: CLASSROOM_HOUR_LABEL,
    teacher: homeroom?.teacher ?? HOMEROOM_TEACHER_PLACEHOLDER,
    room: homeroom?.room ?? null,
    group: null,
    subgroup: null,
    isReplacement: false,
    notes: null,
    sourceType: "manual",
    parsedAt: new Date().toISOString(),
  };
}
