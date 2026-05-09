/**
 * Natural-language-ish search over the schedule. Given a query and a week,
 * returns a small set of result types.
 *
 * Example queries:
 *   "алгебра" → all algebra lessons of the week
 *   "где английский" → lessons + rooms for English
 *   "что сейчас" → current lesson
 *   "уроки во вторник" → lessons on tuesday
 *   "информатика группа 2" → informatika lessons for group 2
 */

import type { Lesson, WeekSchedule } from "./schedule/types";
import { DAY_OF_WEEK_RU } from "./schedule/types";
import { todayInSchoolTz, nowMinutesInSchoolTz } from "./now";
import { timeToMinutes } from "./schedule/bell";

export type SearchResultKind = "lesson" | "info";

export interface SearchResult {
  kind: SearchResultKind;
  /** Concise primary text. */
  title: string;
  /** Optional secondary text. */
  subtitle?: string;
  /** Optional payload — a lesson or arbitrary info. */
  lesson?: Lesson;
  /** Score, higher is better. */
  score: number;
}

const DAY_KEYWORDS: Array<{ key: keyof typeof DAY_OF_WEEK_RU; words: string[] }> = [
  { key: "monday", words: ["понедельник", "пнд", "пн"] },
  { key: "tuesday", words: ["вторник", "вт"] },
  { key: "wednesday", words: ["среда", "среду", "ср"] },
  { key: "thursday", words: ["четверг", "чт"] },
  { key: "friday", words: ["пятница", "пятницу", "пт"] },
  { key: "saturday", words: ["суббота", "субботу", "сб"] },
  { key: "sunday", words: ["воскресенье", "вс"] },
];

const STOP_WORDS = new Set([
  "что", "где", "какой", "какая", "какие", "сейчас", "следующий", "следующая",
  "следующее", "уроки", "урок", "во", "в", "на", "по", "и", "или", "группа",
  "подгруппа", "класс",
]);

interface ParsedIntent {
  current: boolean;
  next: boolean;
  group: 1 | 2 | null;
  day: keyof typeof DAY_OF_WEEK_RU | null;
  terms: string[];
}

function parseIntent(query: string): ParsedIntent {
  const words = query.toLowerCase().split(/[^а-яёa-z0-9]+/u).filter(Boolean);
  const intent: ParsedIntent = {
    current: false,
    next: false,
    group: null,
    day: null,
    terms: [],
  };
  for (const word of words) {
    if (word === "сейчас" || word === "текущий" || word === "текущая") {
      intent.current = true;
      continue;
    }
    if (word === "следующий" || word === "следующая" || word === "далее" || word === "потом") {
      intent.next = true;
      continue;
    }
    if (/^г?руппа?[12]$/.test(word)) {
      intent.group = word.endsWith("1") ? 1 : 2;
      continue;
    }
    const dayMatch = DAY_KEYWORDS.find((d) => d.words.includes(word));
    if (dayMatch) {
      intent.day = dayMatch.key;
      continue;
    }
    if (STOP_WORDS.has(word)) continue;
    intent.terms.push(word);
  }
  // "1" / "2" right after explicit "группа"
  const m = query.toLowerCase().match(/группа?\s*([12])/);
  if (m) intent.group = m[1] === "1" ? 1 : 2;
  return intent;
}

function lessonMatches(lesson: Lesson, terms: string[]): number {
  if (terms.length === 0) return 0;
  let score = 0;
  const haystack =
    `${lesson.subject} ${lesson.teacher ?? ""} ${lesson.room ?? ""} ${lesson.notes ?? ""}`.toLowerCase();
  for (const term of terms) {
    if (haystack.includes(term)) score += 5;
    else if (haystack.includes(term.slice(0, Math.max(3, term.length - 2)))) score += 2;
  }
  return score;
}

export function searchSchedule(
  query: string,
  week: WeekSchedule,
  group: 1 | 2,
): SearchResult[] {
  if (!query.trim()) return [];
  const intent = parseIntent(query);
  const today = todayInSchoolTz();
  const nowMin = nowMinutesInSchoolTz();

  let candidates: Lesson[] = week.days.flatMap((d) =>
    d.lessons.filter((l) => l.group === null || l.group === (intent.group ?? group)),
  );

  if (intent.day) {
    candidates = candidates.filter((l) => l.dayOfWeek === intent.day);
  }

  if (intent.current) {
    const lesson = candidates.find(
      (l) =>
        l.date === today.iso &&
        timeToMinutes(l.startTime) <= nowMin &&
        timeToMinutes(l.endTime) >= nowMin,
    );
    if (lesson) {
      return [{
        kind: "lesson",
        title: `Сейчас — ${lesson.subject}`,
        subtitle: `${lesson.startTime} – ${lesson.endTime} · каб. ${lesson.room ?? "—"} · ${lesson.teacher ?? "—"}`,
        lesson,
        score: 100,
      }];
    }
    return [{ kind: "info", title: "Сейчас уроков нет", score: 100 }];
  }
  if (intent.next) {
    const lesson = candidates.find(
      (l) => l.date === today.iso && timeToMinutes(l.startTime) > nowMin,
    );
    if (lesson) {
      return [{
        kind: "lesson",
        title: `Следующий — ${lesson.subject}`,
        subtitle: `${lesson.startTime} · каб. ${lesson.room ?? "—"} · ${lesson.teacher ?? "—"}`,
        lesson,
        score: 100,
      }];
    }
    return [{ kind: "info", title: "Следующих уроков сегодня нет", score: 100 }];
  }

  if (intent.terms.length === 0 && intent.day) {
    return candidates.slice(0, 16).map((l) => ({
      kind: "lesson",
      title: `${l.subject} — ${DAY_OF_WEEK_RU[l.dayOfWeek]}`,
      subtitle: `${l.startTime} · каб. ${l.room ?? "—"} · ${l.teacher ?? "—"}`,
      lesson: l,
      score: 50,
    }));
  }

  const scored = candidates
    .map<SearchResult>((l) => ({
      kind: "lesson" as const,
      title: l.subject,
      subtitle: `${DAY_OF_WEEK_RU[l.dayOfWeek]} · ${l.startTime} · каб. ${l.room ?? "—"} · ${l.teacher ?? "—"}`,
      lesson: l,
      score: lessonMatches(l, intent.terms),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 24);
}

export function teacherSearch(query: string, week: WeekSchedule): SearchResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const teachers = new Map<string, Lesson[]>();
  for (const day of week.days) {
    for (const l of day.lessons) {
      if (!l.teacher) continue;
      const arr = teachers.get(l.teacher) ?? [];
      arr.push(l);
      teachers.set(l.teacher, arr);
    }
  }
  const results: SearchResult[] = [];
  for (const [teacher, lessons] of teachers.entries()) {
    const lower = teacher.toLowerCase();
    const score = terms.reduce((s, t) => s + (lower.includes(t) ? 5 : 0), 0);
    if (score === 0) continue;
    results.push({
      kind: "info",
      title: teacher,
      subtitle: `${lessons.length} уроков на неделе`,
      score,
    });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 16);
}
