"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from "lucide-react";
import { GlassCard } from "./GlassCard";
import {
  classifyVacationWeek,
  formatWeekRangeRu,
  vacationLabel,
  vacationEmoji,
  type WeekRange,
} from "@/lib/schedule/calendar";
import { cn } from "@/lib/utils";

interface Props {
  range: WeekRange;
  /** 0 = published week (real data); negative = past, positive = future. */
  shift: number;
  /** True when this week has actual published data. */
  hasData: boolean;
  onShift: (delta: number) => void;
  onReset: () => void;
}

/**
 * Top-level week navigator. Sticky-feeling card that shows the current
 * week range, prev/next arrows, and a quick "this week" reset.
 *
 * When `shift !== 0`, it adds a soft accent + status text below.
 */
export function WeekPager({ range, shift, hasData, onShift, onReset }: Props) {
  const vacation = classifyVacationWeek(range.weekStart);
  const label = formatWeekRangeRu(range);
  const isPublished = shift === 0;
  const status = !hasData
    ? vacation
      ? `${vacationEmoji(vacation)} ${vacationLabel(vacation)}`
      : shift > 0
      ? "Расписание ещё не опубликовано"
      : "Архив прошлой недели не сохранён"
    : null;

  return (
    <GlassCard
      className={cn(
        "px-5 py-4 md:px-6 md:py-5 transition",
        !isPublished && "border-[color:var(--color-accent)]/25",
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onShift(-1)}
          className="rounded-full p-2 text-fg-muted hover:text-fg hover:bg-surface-2 transition"
          aria-label="предыдущая неделя"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="flex-1 min-w-0 text-center">
          <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.18em] text-fg-muted">
            <Calendar className="size-3" />
            {isPublished ? "учебная неделя" : shift > 0 ? "будущая неделя" : "прошлая неделя"}
          </div>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={range.weekStart}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="font-display text-base md:text-lg leading-tight tabular-nums"
            >
              {label}
            </motion.div>
          </AnimatePresence>
          {status && (
            <div className="mt-0.5 text-[11px] text-[color:var(--color-fg-muted)]">
              {status}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onShift(1)}
          className="rounded-full p-2 text-fg-muted hover:text-fg hover:bg-surface-2 transition"
          aria-label="следующая неделя"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {!isPublished && (
        <div className="mt-3 flex items-center justify-center">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.14em] bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/15 transition"
          >
            <Sparkles className="size-3" />
            к учебной неделе
          </button>
        </div>
      )}
    </GlassCard>
  );
}
