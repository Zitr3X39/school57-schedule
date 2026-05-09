import * as cheerio from "cheerio";
import type { Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";
import { createLogger } from "../logger";
import { bellFor, DEFAULT_BELL_SCHEDULE } from "../bell";
import {
  DAY_OF_WEEK_RU,
  type DayOfWeek,
  type DaySchedule,
  type Lesson,
  type ParseReport,
  type Replacement,
  type WeekSchedule,
} from "../types";
import { classPageUrl } from "../config";
import { stableLessonId } from "../normalizer";

const log = createLogger("parser:class");

interface ParseClassPageInput {
  html: string;
  className?: string;
  /** URL the HTML was fetched from (used to extract weekId if missing). */
  sourceUrl?: string;
}

interface ParseClassPageOutput {
  schedule: WeekSchedule;
  report: ParseReport;
}

/**
 * Parse a class.php page into a normalized WeekSchedule.
 *
 * The page structure (from sample HTML):
 *
 *  - `<h1>Расписание уроков. {className} класс</h1>`
 *  - Week switcher with prev/next links: `class.php?...&week=YYYYMMDD`
 *    and a centered text like "04–09 мая 2026".
 *  - Replacements section under `<h3>Замены уроков</h3>` with
 *    `.pagecontent-miniblock` items containing date + `<s>old</s> <span>new</span>`.
 *  - Daily schedule blocks: `.ReviewItem__info-from` with
 *    `DD.MM.YYYY / DayOfWeek` followed by a `<table>` whose rows are
 *    `<tr><td>{lesson_num}</td><td>{subject}</td><td>{teacher}</td>
 *    <td>{room}</td><td homework>...</td></tr>`.
 *
 * Group 1/2 splits are detected by consecutive rows with the same lesson
 * number on the same day.
 */
export function parseClassPage(input: ParseClassPageInput): ParseClassPageOutput {
  const { html, sourceUrl } = input;
  const $ = cheerio.load(html);

  const className = input.className ?? extractClassName($) ?? "?";
  const heading = $("h1").first().text().trim();

  const { weekId, prevWeekId, nextWeekId } = extractWeekIds($);

  const days = extractDays($, className);
  const replacements = extractReplacements($);
  const { weekStart, weekEnd } = computeWeekBounds(weekId, days);

  const lessonsTotal = days.reduce((acc, d) => acc + d.lessons.length, 0);

  const report: ParseReport = {
    ok: lessonsTotal > 0,
    classesFound: 1,
    daysFound: days.length,
    lessonsFound: lessonsTotal,
    replacementsFound: replacements.length,
    warnings: [],
    errors: [],
  };

  if (lessonsTotal === 0) {
    const msg = `class page parsed 0 lessons (heading="${heading}")`;
    report.errors.push(msg);
    log.error(msg);
  } else {
    log.info("parsed class page", {
      className,
      days: days.length,
      lessons: lessonsTotal,
      replacements: replacements.length,
    });
  }

  const schedule: WeekSchedule = {
    className,
    weekId: weekId ?? deriveWeekIdFromDays(days) ?? "",
    weekStart,
    weekEnd,
    days,
    replacements,
    prevWeekId,
    nextWeekId,
    sourceType: "html",
    sourceUrl: sourceUrl ?? classPageUrl(className, weekId ?? undefined),
    parsedAt: new Date().toISOString(),
  };

  return { schedule, report };
}

function extractClassName($: cheerio.CheerioAPI): string | null {
  const h1 = $("h1").first().text().trim();
  // "Расписание уроков. 10Д класс"
  const m = h1.match(/(\d{1,2}[А-Яа-яA-Za-z])\s*класс/);
  if (m) return m[1].toUpperCase();
  // Fallback: read from breadcrumb `<li>… {N}{X} класс</li>`.
  const liText = $(".breadcrumb li").last().text().trim();
  const m2 = liText.match(/(\d{1,2}[А-Яа-яA-Za-z])/);
  return m2 ? m2[1].toUpperCase() : null;
}

function extractWeekIds($: cheerio.CheerioAPI): {
  weekId: string | null;
  prevWeekId: string | null;
  nextWeekId: string | null;
} {
  const switcherLinks = $(".switcher a.switcher__link");
  let prev: string | null = null;
  let next: string | null = null;
  switcherLinks.each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const m = href.match(/[?&]week=(\d{8})/);
    if (!m) return;
    const tip = $(el).attr("data-original-title") ?? "";
    if (/пред/i.test(tip)) prev = m[1];
    else if (/след/i.test(tip)) next = m[1];
  });
  // Compute the displayed week as the one strictly between prev and next.
  let current: string | null = null;
  if (prev && next) {
    current = midpointWeekId(prev, next);
  } else if (prev) {
    current = addDaysToWeekId(prev, 7);
  } else if (next) {
    current = addDaysToWeekId(next, -7);
  }
  return { weekId: current, prevWeekId: prev, nextWeekId: next };
}

/** Adds N days to a YYYYMMDD week id. */
function addDaysToWeekId(weekId: string, deltaDays: number): string {
  const y = Number(weekId.slice(0, 4));
  const m = Number(weekId.slice(4, 6));
  const d = Number(weekId.slice(6, 8));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

function midpointWeekId(prev: string, next: string): string {
  const a = weekIdToDateUTC(prev).getTime();
  const b = weekIdToDateUTC(next).getTime();
  const mid = new Date((a + b) / 2);
  const yy = mid.getUTCFullYear();
  const mm = String(mid.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(mid.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

function weekIdToDateUTC(weekId: string): Date {
  const y = Number(weekId.slice(0, 4));
  const m = Number(weekId.slice(4, 6));
  const d = Number(weekId.slice(6, 8));
  return new Date(Date.UTC(y, m - 1, d));
}

function extractDays($: cheerio.CheerioAPI, className: string): DaySchedule[] {
  const result: DaySchedule[] = [];
  const dayHeaders = $(".ReviewItem__info-from");
  dayHeaders.each((_, header) => {
    const text = $(header).text().trim();
    const m = text.match(/(\d{2})\.(\d{2})\.(\d{4})\s*\/\s*([А-Яа-я]+)/);
    if (!m) {
      log.warn("could not parse day header", { text });
      return;
    }
    const date = `${m[3]}-${m[2]}-${m[1]}`;
    const dayOfWeek = parseDayOfWeekRu(m[4]);
    if (!dayOfWeek) {
      log.warn("unknown day of week", { value: m[4] });
      return;
    }

    // The lessons table is the next `.table-responsive` element after the
    // day header. Be lenient about what kind of element it is.
    const table = $(header).nextAll(".table-responsive").first().find("table");
    const lessons = parseLessonRows($, table, className, date, dayOfWeek);
    result.push({ date, dayOfWeek, lessons });
  });
  return result;
}

function parseLessonRows(
  _$: cheerio.CheerioAPI,
  table: Cheerio<AnyNode>,
  className: string,
  date: string,
  dayOfWeek: DayOfWeek,
): Lesson[] {
  const rows = table.find("tr");
  const collected: Array<{
    lessonNumber: number;
    subject: string;
    teacher: string | null;
    room: string | null;
    notes: string | null;
  }> = [];

  rows.each((_, tr) => {
    const tds = _$(tr).children("td");
    if (tds.length === 0) return; // header row
    const num = Number(tds.eq(0).text().trim());
    if (!Number.isFinite(num) || num <= 0) return;
    const subject = collapseSpaces(tds.eq(1).text());
    const teacher = collapseSpaces(tds.eq(2).text());
    const room = collapseSpaces(tds.eq(3).text());
    const homeworkCell = tds.eq(4);
    const notes = extractHomework(_$, homeworkCell);
    if (!subject) return;
    collected.push({
      lessonNumber: num,
      subject,
      teacher: teacher || null,
      room: room || null,
      notes,
    });
  });

  // Detect group splits: consecutive rows with the same lessonNumber become
  // group 1 / group 2. If the same lessonNumber repeats more than twice we
  // dedupe identical rows and keep distinct ones.
  const lessons: Lesson[] = [];
  let i = 0;
  while (i < collected.length) {
    const curr = collected[i];
    const sameNumber: typeof collected = [curr];
    let j = i + 1;
    while (j < collected.length && collected[j].lessonNumber === curr.lessonNumber) {
      sameNumber.push(collected[j]);
      j++;
    }
    // Dedupe truly-identical rows that the source occasionally emits.
    const distinct = dedupeBy(sameNumber, (r) =>
      `${r.subject}|${r.teacher ?? ""}|${r.room ?? ""}|${r.notes ?? ""}`,
    );
    if (distinct.length === 1) {
      lessons.push(buildLesson(className, date, dayOfWeek, distinct[0], null));
    } else {
      distinct.slice(0, 2).forEach((row, idx) => {
        lessons.push(
          buildLesson(className, date, dayOfWeek, row, (idx + 1) as 1 | 2),
        );
      });
      // If somehow >2 distinct rows survived (rare), append the rest as
      // additional group entries to preserve information.
      if (distinct.length > 2) {
        distinct.slice(2).forEach((row) => {
          lessons.push(buildLesson(className, date, dayOfWeek, row, 2));
        });
      }
    }
    i = j;
  }

  return lessons;
}

function buildLesson(
  className: string,
  date: string,
  dayOfWeek: DayOfWeek,
  row: { lessonNumber: number; subject: string; teacher: string | null; room: string | null; notes: string | null },
  group: 1 | 2 | null,
): Lesson {
  const { startTime, endTime } = bellFor(DEFAULT_BELL_SCHEDULE, row.lessonNumber);
  const id = stableLessonId({
    className,
    date,
    lessonNumber: row.lessonNumber,
    subject: row.subject,
    group,
  });
  return {
    id,
    className,
    date,
    dayOfWeek,
    lessonNumber: row.lessonNumber,
    startTime,
    endTime,
    subject: row.subject,
    teacher: row.teacher,
    room: row.room,
    group,
    subgroup: null,
    isReplacement: false,
    notes: row.notes,
    sourceType: "html",
    parsedAt: new Date().toISOString(),
  };
}

function extractHomework($: cheerio.CheerioAPI, td: Cheerio<AnyNode>): string | null {
  if (!td || td.length === 0) return null;
  const text = collapseSpaces(td.text());
  if (!text) return null;
  if (/нет\s+домашнего/i.test(text)) return null;
  // Take everything after the optional "Д/З на DD.MM.YYYY" prefix.
  const cleaned = text.replace(/Д\/З\s*на\s*\d{2}\.\d{2}\.\d{4}/gi, "").trim();
  if (!cleaned) return null;
  return cleaned;
}

function collapseSpaces(s: string | null | undefined): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function dedupeBy<T>(arr: T[], key: (v: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const v of arr) {
    const k = key(v);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}

function parseDayOfWeekRu(input: string): DayOfWeek | null {
  const value = input.trim().toLowerCase();
  for (const [key, ru] of Object.entries(DAY_OF_WEEK_RU)) {
    if (ru.toLowerCase() === value) return key as DayOfWeek;
  }
  return null;
}

function extractReplacements($: cheerio.CheerioAPI): Replacement[] {
  const out: Replacement[] = [];
  const block = $(".shedule__calendar-changes");
  block.find(".pagecontent-miniblock").each((_, el) => {
    const dateText = $(el).find("strong").first().text().trim();
    const m = dateText.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (!m) return;
    const date = `${m[3]}-${m[2]}-${m[1]}`;
    const fromSubject = collapseSpaces($(el).find("s").first().text());
    const toSubject = collapseSpaces($(el).find("span").first().text());
    if (!fromSubject || !toSubject) return;
    out.push({ date, fromSubject, toSubject });
  });
  return out;
}

function deriveWeekIdFromDays(days: DaySchedule[]): string | null {
  const monday = days.find((d) => d.dayOfWeek === "monday");
  if (!monday) return null;
  const [y, m, d] = monday.date.split("-");
  return `${y}${m}${d}`;
}

function computeWeekBounds(
  weekId: string | null,
  days: DaySchedule[],
): { weekStart: string; weekEnd: string } {
  let start: Date | null = null;
  let end: Date | null = null;
  if (weekId) {
    start = weekIdToDateUTC(weekId);
    end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
  } else if (days.length > 0) {
    const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
    const first = new Date(`${sorted[0].date}T00:00:00Z`);
    const last = new Date(`${sorted[sorted.length - 1].date}T00:00:00Z`);
    start = first;
    end = last;
  }
  if (!start || !end) {
    return { weekStart: "", weekEnd: "" };
  }
  return { weekStart: toIsoDate(start), weekEnd: toIsoDate(end) };
}

function toIsoDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
