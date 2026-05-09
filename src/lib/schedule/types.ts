/**
 * Domain types for the school-schedule app.
 *
 * The unified Lesson schema is the contract between the parser layer and the UI.
 * It does not depend on the source representation (HTML / JSON / API) so the
 * downstream code does not care how the data was obtained.
 */

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export const DAY_OF_WEEK_RU: Record<DayOfWeek, string> = {
  monday: "Понедельник",
  tuesday: "Вторник",
  wednesday: "Среда",
  thursday: "Четверг",
  friday: "Пятница",
  saturday: "Суббота",
  sunday: "Воскресенье",
};

export const DAY_OF_WEEK_RU_SHORT: Record<DayOfWeek, string> = {
  monday: "Пн",
  tuesday: "Вт",
  wednesday: "Ср",
  thursday: "Чт",
  friday: "Пт",
  saturday: "Сб",
  sunday: "Вс",
};

export const DAY_OF_WEEK_ORDER: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/** Time of day in `HH:MM` (24h). */
export type TimeOfDay = string;

/** Source from which a Lesson was parsed. */
export type LessonSourceType = "html" | "json" | "api" | "fixture" | "manual";

/**
 * A single normalized lesson. `lessonNumber` is the ordinal of the lesson
 * within the school day (1-indexed). `group` distinguishes a subgroup split
 * (`null` means no split, `1` / `2` are subgroups).
 */
export interface Lesson {
  /** Stable id derived from class+date+lessonNumber+group+subject. */
  id: string;
  /** e.g. "10Д", "5А". */
  className: string;
  /** ISO calendar date `YYYY-MM-DD` in school local time. */
  date: string;
  dayOfWeek: DayOfWeek;
  lessonNumber: number;
  startTime: TimeOfDay;
  endTime: TimeOfDay;
  subject: string;
  teacher: string | null;
  room: string | null;
  /** Subgroup index when the class is split (null when not split). */
  group: 1 | 2 | null;
  /** Free-form subgroup label (rare, e.g. "девочки"). */
  subgroup: string | null;
  /** Whether this is a substitution (Замена). */
  isReplacement: boolean;
  /** Optional homework / notes. */
  notes: string | null;
  /** Where the data came from. */
  sourceType: LessonSourceType;
  /** ISO timestamp when this entry was parsed. */
  parsedAt: string;
}

/** A schedule replacement entry as published by the school. */
export interface Replacement {
  /** ISO date the replacement applies to. */
  date: string;
  /** Subject that was replaced. */
  fromSubject: string;
  /** Subject the lesson was replaced with. */
  toSubject: string;
}

export interface DaySchedule {
  date: string;
  dayOfWeek: DayOfWeek;
  lessons: Lesson[];
}

export interface WeekSchedule {
  className: string;
  /** Week ID in `YYYYMMDD` (Monday) — same convention the source site uses. */
  weekId: string;
  /** Monday of the week, ISO date. */
  weekStart: string;
  /** Sunday of the week, ISO date. */
  weekEnd: string;
  /** Days in chronological order. May be 5–7 days. */
  days: DaySchedule[];
  replacements: Replacement[];
  /** Navigation links if the source provides previous / next weeks. */
  prevWeekId: string | null;
  nextWeekId: string | null;
  /** Where the schedule was parsed from. */
  sourceType: LessonSourceType;
  /** Source-specific URL the data was fetched from. */
  sourceUrl: string | null;
  parsedAt: string;
}

/** A grade & list of classes inside it. */
export interface ClassGroup {
  /** Free-form heading from the source page (e.g. "Начальная школа"). */
  heading: string;
  /** Class names in display order, e.g. ["1А","1Б"]. */
  classes: string[];
}

export interface SchoolClassesIndex {
  schoolName: string;
  schoolUid: string;
  groups: ClassGroup[];
  /** Flat list of all classes for quick search. */
  allClasses: string[];
  parsedAt: string;
  sourceType: LessonSourceType;
  sourceUrl: string | null;
}

/** Result of a parser pass — used for the validation layer. */
export interface ParseReport {
  ok: boolean;
  classesFound: number;
  daysFound: number;
  lessonsFound: number;
  replacementsFound: number;
  warnings: string[];
  errors: string[];
}

/** A single bell-schedule entry. */
export interface BellEntry {
  lessonNumber: number;
  startTime: TimeOfDay;
  endTime: TimeOfDay;
}

export type BellSchedule = BellEntry[];
