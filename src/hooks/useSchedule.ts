"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchClassesIndex,
  fetchSchedule,
  fetchWeeksMeta,
} from "@/lib/schedule/api-client";

export function useClassesQuery() {
  return useQuery({
    queryKey: ["classes-index"],
    queryFn: fetchClassesIndex,
    staleTime: 60 * 60 * 1000,
  });
}

export function useWeeksMetaQuery() {
  return useQuery({
    queryKey: ["weeks-meta"],
    queryFn: fetchWeeksMeta,
    staleTime: 60 * 60 * 1000,
  });
}

export function useScheduleQuery(args: {
  className: string | null;
  weekId: string | null;
}) {
  return useQuery({
    queryKey: ["schedule", args.className, args.weekId],
    queryFn: () =>
      fetchSchedule({ className: args.className!, weekId: args.weekId! }),
    enabled: Boolean(args.className && args.weekId),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}
