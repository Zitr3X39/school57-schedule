"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { GlassCard } from "./GlassCard";
import { subjectStats } from "@/lib/schedule/aggregate";
import type { WeekSchedule } from "@/lib/schedule/types";
import { DAY_OF_WEEK_RU_SHORT, type DayOfWeek } from "@/lib/schedule/types";
import { cn } from "@/lib/utils";

interface Props {
  week: WeekSchedule | null;
  group: 1 | 2;
}

export function SubjectAnalytics({ week, group }: Props) {
  const stats = useMemo(() => subjectStats(week, group), [week, group]);
  const max = stats.reduce((m, s) => Math.max(m, s.count), 0);

  const heatmap = useMemo(() => buildHeatmap(week, group), [week, group]);

  if (!week) {
    return (
      <GlassCard className="p-6">
        <h2 className="font-display text-2xl md:text-3xl">Аналитика предметов</h2>
        <div className="mt-6 text-sm text-[color:var(--color-fg-muted)]">
          Загружаем данные…
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6" highlight>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl md:text-3xl">Аналитика недели</h2>
        <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
          группа {group}
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-fg-muted)]">
            частота предметов
          </div>
          <ul className="mt-3 space-y-2.5">
            {stats.slice(0, 8).map((s, i) => (
              <li key={s.subject} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm truncate" title={s.subject}>
                    {s.subject}
                  </span>
                  <span className="text-xs tabular-nums text-[color:var(--color-fg-muted)]">
                    {s.count} ур · {Math.round(s.minutes / 60 * 10) / 10} ч
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[color:var(--color-accent)] via-[color:var(--color-accent-3)] to-[color:var(--color-accent-2)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${max > 0 ? (s.count / max) * 100 : 0}%` }}
                    transition={{ duration: 0.6, delay: 0.04 * i, ease: "easeOut" }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-fg-muted)]">
            нагрузка по дням
          </div>
          <Heatmap heatmap={heatmap} />
        </div>
      </div>
    </GlassCard>
  );
}

interface HeatmapEntry {
  dayOfWeek: DayOfWeek;
  hours: number[]; // length 9, lessons 1..9, 1 if has lesson, 0 otherwise
  count: number;
}

function buildHeatmap(week: WeekSchedule | null, group: 1 | 2): HeatmapEntry[] {
  if (!week) return [];
  const ordered = [...week.days].sort((a, b) => a.date.localeCompare(b.date));
  return ordered.map((d) => {
    const hours = Array(9).fill(0) as number[];
    let count = 0;
    for (const l of d.lessons) {
      if (l.group !== null && l.group !== group) continue;
      if (l.lessonNumber >= 1 && l.lessonNumber <= 9) {
        hours[l.lessonNumber - 1] = 1;
        count++;
      }
    }
    return { dayOfWeek: d.dayOfWeek, hours, count };
  });
}

function Heatmap({ heatmap }: { heatmap: HeatmapEntry[] }) {
  const max = Math.max(1, ...heatmap.map((d) => d.count));
  return (
    <div className="mt-3 space-y-2">
      {heatmap.map((d) => (
        <div key={d.dayOfWeek} className="flex items-center gap-3">
          <span className="w-10 text-xs uppercase tracking-[0.16em] text-[color:var(--color-fg-muted)]">
            {DAY_OF_WEEK_RU_SHORT[d.dayOfWeek]}
          </span>
          <div className="flex-1 grid grid-cols-9 gap-1">
            {d.hours.map((h, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-5 rounded-md transition",
                  h ? "bg-[color:var(--color-accent)]/40" : "bg-surface",
                  h && "shadow-[0_0_10px_rgba(94,234,212,0.18)]",
                )}
                title={`Урок ${idx + 1}`}
              />
            ))}
          </div>
          <span className="w-6 text-right text-xs tabular-nums text-[color:var(--color-fg-muted)]">
            {d.count}
          </span>
          <div
            className="w-1 rounded-full"
            style={{
              height: `${10 + (d.count / max) * 22}px`,
              background:
                "linear-gradient(180deg, rgba(94,234,212,0.6), rgba(167,139,250,0.5))",
            }}
          />
        </div>
      ))}
    </div>
  );
}
