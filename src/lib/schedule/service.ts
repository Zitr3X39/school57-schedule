/**
 * High-level service that combines fetcher, parser, normalizer, validator
 * and cache. Server-only (uses Node fs + network).
 */

import { fetchClassPage, fetchIndexPage } from "./fetcher";
import { parseClassPage } from "./parser/class-page";
import { parseIndexPage } from "./parser/index-page";
import { applyReplacements } from "./normalizer";
import { fillClassroomHourGaps } from "./homeroom";
import { validateSchedule } from "./validator";
import {
  CLASSES_TTL_SECONDS,
  SCHEDULE_TTL_SECONDS,
} from "./config";
import { classesCache, scheduleCache } from "./cache";
import type {
  ParseReport,
  SchoolClassesIndex,
  WeekSchedule,
} from "./types";

export interface ScheduleResult {
  schedule: WeekSchedule;
  report: ParseReport;
  source: { url: string; fromFixture: boolean };
}

export async function getClassesIndex(): Promise<SchoolClassesIndex> {
  const cached = classesCache.get("index");
  if (cached) return cached;
  const fetched = await fetchIndexPage();
  const parsed = parseIndexPage(fetched.html);
  classesCache.set("index", parsed, CLASSES_TTL_SECONDS);
  return parsed;
}

export interface GetScheduleArgs {
  className: string;
  weekId?: string;
}

export async function getSchedule(args: GetScheduleArgs): Promise<ScheduleResult> {
  const cacheKey = `${args.className}::${args.weekId ?? "current"}`;
  const cachedSchedule = scheduleCache.get(cacheKey);
  if (cachedSchedule) {
    return {
      schedule: cachedSchedule,
      report: {
        ok: true,
        classesFound: 1,
        daysFound: cachedSchedule.days.length,
        lessonsFound: cachedSchedule.days.reduce(
          (acc, d) => acc + d.lessons.length,
          0,
        ),
        replacementsFound: cachedSchedule.replacements.length,
        warnings: [],
        errors: [],
      },
      source: { url: cachedSchedule.sourceUrl ?? "", fromFixture: false },
    };
  }

  const fetched = await fetchClassPage(args.className, args.weekId);
  const parsed = parseClassPage({
    html: fetched.html,
    className: args.className,
    sourceUrl: fetched.url,
  });
  const withReplacements = applyReplacements(parsed.schedule);
  const withClassroomHours = fillClassroomHourGaps(withReplacements);
  const validated = validateSchedule(withClassroomHours, parsed.report);
  scheduleCache.set(cacheKey, validated.schedule, SCHEDULE_TTL_SECONDS);
  return {
    schedule: validated.schedule,
    report: validated.report,
    source: { url: fetched.url, fromFixture: fetched.fromFixture },
  };
}
