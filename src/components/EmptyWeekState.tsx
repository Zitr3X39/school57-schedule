"use client";

import { motion } from "framer-motion";
import { Calendar, ArrowLeft } from "lucide-react";
import { GlassCard } from "./GlassCard";
import {
  classifyVacationWeek,
  formatWeekRangeRu,
  vacationLabel,
  vacationEmoji,
  type WeekRange,
} from "@/lib/schedule/calendar";

interface Props {
  range: WeekRange;
  shift: number;
  onReset: () => void;
}

/**
 * Render when the user navigates to a week without published data.
 * Shows either a "vacation" card or a "not published yet / archived" card.
 */
export function EmptyWeekState({ range, shift, onReset }: Props) {
  const vacation = classifyVacationWeek(range.weekStart);
  const future = shift > 0;
  const headline = vacation
    ? vacationLabel(vacation)
    : future
    ? "Расписание ещё не опубликовано"
    : "Прошедшая неделя";
  const sub = vacation
    ? "В этот период занятий нет."
    : future
    ? "Школа выложит расписание ближе к началу недели. Когда подключим автообновление — оно появится здесь автоматически."
    : "Мы храним только текущую опубликованную неделю — старые расписания школа не отдаёт.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
    >
      <GlassCard className="p-8 md:p-12 text-center" highlight>
        <div className="mx-auto flex max-w-md flex-col items-center gap-4">
          <div className="text-5xl md:text-6xl">
            {vacation ? vacationEmoji(vacation) : "📅"}
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-2xl md:text-3xl">{headline}</h3>
            <div className="text-sm text-[color:var(--color-fg-muted)] tabular-nums">
              {formatWeekRangeRu(range)}
            </div>
          </div>
          <p className="text-sm text-[color:var(--color-fg-muted)] leading-relaxed">
            {sub}
          </p>
          <button
            type="button"
            onClick={onReset}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-[color:var(--color-accent)]/12 px-4 py-2 text-sm text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/18 transition"
          >
            <ArrowLeft className="size-4" />
            Вернуться к учебной неделе
          </button>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
            <Calendar className="size-3" />
            автообновление в Pack 3
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
