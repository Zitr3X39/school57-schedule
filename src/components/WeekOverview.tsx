"use client";

import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { weekDaySummaries, sortDaysOfWeek } from "@/lib/schedule/aggregate";
import type { WeekSchedule } from "@/lib/schedule/types";
import { DAY_OF_WEEK_RU_SHORT } from "@/lib/schedule/types";
import { cn, formatDateRu } from "@/lib/utils";
import { useNow } from "@/hooks/useNow";
import { RefreshCw } from "lucide-react";

interface Props {
  week: WeekSchedule | null;
  group: 1 | 2;
  selectedDate: string | null;
  onSelectDate: (iso: string) => void;
}

export function WeekOverview({ week, group, selectedDate, onSelectDate }: Props) {
  const now = useNow(60_000);
  const summaries = sortDaysOfWeek(weekDaySummaries(week, group, now));

  return (
    <GlassCard className="p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl md:text-3xl">Неделя</h2>
        {week?.weekStart && week.weekEnd && (
          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
            {formatDateRu(week.weekStart)} — {formatDateRu(week.weekEnd)}
          </div>
        )}
      </div>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {summaries.map((d, i) => {
          const active = selectedDate === d.date;
          return (
            <motion.button
              key={d.date}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.04 * i, ease: "easeOut" }}
              onClick={() => onSelectDate(d.date)}
              className={cn(
                "group relative text-left rounded-2xl p-3.5 border transition overflow-hidden",
                "border-surface bg-surface hover:bg-surface-2 hover:border-surface-strong",
                active && "border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/8",
                d.isToday && "border-[color:var(--color-accent)]/40",
              )}
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
                <span className={cn(d.isToday && "text-[color:var(--color-accent)]")}>
                  {DAY_OF_WEEK_RU_SHORT[d.dayOfWeek]}
                </span>
                <span className="tabular-nums">{d.date.slice(8, 10)}.{d.date.slice(5, 7)}</span>
              </div>
              <div className="mt-3 font-display text-2xl tabular-nums">
                {d.lessonCount}
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
                {d.lessonCount === 0 ? "выходной" : "уроков"}
              </div>
              {d.lessonCount > 0 && (
                <div className="mt-3 space-y-1">
                  {d.subjects.slice(0, 2).map((s) => (
                    <div
                      key={s}
                      className="text-[11px] text-fg-soft truncate"
                      title={s}
                    >
                      {s}
                    </div>
                  ))}
                  {d.subjects.length > 2 && (
                    <div className="text-[11px] text-[color:var(--color-fg-muted)]">
                      +{d.subjects.length - 2}
                    </div>
                  )}
                </div>
              )}
              {d.startTime && (
                <div className="mt-3 text-[10px] tabular-nums text-[color:var(--color-fg-muted)]">
                  {d.startTime} – {d.endTime}
                </div>
              )}
              {d.hasReplacements && (
                <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] bg-[color:var(--color-warn)]/15 text-[color:var(--color-warn)]">
                  <RefreshCw className="size-2.5" /> замена
                </div>
              )}
              {d.isToday && !active && (
                <div className="absolute inset-x-3 bottom-1 h-px bg-gradient-to-r from-[color:var(--color-accent)]/0 via-[color:var(--color-accent)]/60 to-[color:var(--color-accent)]/0" />
              )}
            </motion.button>
          );
        })}
      </div>
    </GlassCard>
  );
}
