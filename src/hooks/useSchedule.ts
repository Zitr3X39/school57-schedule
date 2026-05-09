"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClassesIndex, fetchSchedule } from "@/lib/schedule/api-client";

export function useClassesQuery() {
  return useQuery({
    queryKey: ["classes-index"],
    queryFn: fetchClassesIndex,
    staleTime: 60 * 60 * 1000,
  });
}

export function useScheduleQuery(args: {
  className: string | null;
  weekId?: string;
}) {
  return useQuery({
    queryKey: ["schedule", args.className, args.weekId ?? null],
    queryFn: () => fetchSchedule({ className: args.className!, weekId: args.weekId }),
    enabled: Boolean(args.className),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}
