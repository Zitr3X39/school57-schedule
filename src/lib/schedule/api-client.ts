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

export async function fetchClassesIndex(): Promise<SchoolClassesIndex> {
  const res = await fetch("/api/classes", { cache: "no-store" });
  const json = (await res.json()) as ApiResponse<SchoolClassesIndex>;
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

export interface FetchScheduleArgs {
  className: string;
  weekId?: string;
}

export interface ScheduleResponseShape {
  schedule: WeekSchedule;
  report?: ParseReport;
  source?: { url: string; fromFixture: boolean };
}

export async function fetchSchedule(
  args: FetchScheduleArgs,
): Promise<ScheduleResponseShape> {
  const params = new URLSearchParams();
  params.set("class", args.className);
  if (args.weekId) params.set("week", args.weekId);
  const res = await fetch(`/api/schedule?${params.toString()}`, {
    cache: "no-store",
  });
  const json = (await res.json()) as ApiResponse<WeekSchedule>;
  if (!json.ok) throw new Error(json.error);
  return { schedule: json.data, report: json.report, source: json.source };
}
