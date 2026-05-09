"use client";

import type {
  ParseReport,
  SchoolClassesIndex,
  WeekSchedule,
} from "./types";

export interface ApiOk<T> {
  ok: true;
  data: T;
  report?: ParseReport;
  source?: { url: string; fromFixture: boolean };
}

export interface ApiErr {
  ok: false;
  error: string;
}

export type ApiResponse<T> = ApiOk<T> | ApiErr;

// In static-export builds (GitHub Pages) we read pre-baked JSON. The same
// JSON files are served from /public during local dev, so the same code path
// works in both modes.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

interface IndexFileShape extends SchoolClassesIndex {
  source: { url: string; fromFixture: boolean };
  classesWithRealData?: string[];
}

interface ScheduleFileShape {
  schedule: WeekSchedule;
  source: { url: string; fromFixture: boolean };
  isDemoData?: boolean;
}

export async function fetchClassesIndex(): Promise<SchoolClassesIndex> {
  const res = await fetch(`${BASE_PATH}/data/index.json`, {
    cache: "force-cache",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} loading classes index`);
  }
  const json = (await res.json()) as IndexFileShape;
  return json;
}

export interface FetchScheduleArgs {
  className: string;
  weekId?: string;
}

export interface ScheduleResponseShape {
  schedule: WeekSchedule;
  report?: ParseReport;
  source?: { url: string; fromFixture: boolean };
  isDemoData?: boolean;
}

export async function fetchSchedule(
  args: FetchScheduleArgs,
): Promise<ScheduleResponseShape> {
  const filename = encodeURIComponent(args.className);
  const res = await fetch(`${BASE_PATH}/data/schedule/${filename}.json`, {
    cache: "force-cache",
  });
  if (!res.ok) {
    throw new Error(
      `Расписание для класса ${args.className} не найдено (HTTP ${res.status})`,
    );
  }
  const json = (await res.json()) as ScheduleFileShape;
  return {
    schedule: json.schedule,
    source: json.source,
    isDemoData: json.isDemoData,
  };
}
