"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, ArrowRight, Sparkles, Coffee } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { useNow } from "@/hooks/useNow";
import { partsInSchoolTz } from "@/lib/now";
import { currentAndNext } from "@/lib/schedule/aggregate";
import type { WeekSchedule } from "@/lib/schedule/types";
import { formatCountdown, formatDateRu } from "@/lib/utils";

interface HeroProps {
  week: WeekSchedule | null;
  group: 1 | 2;
  className: string;
}

export function Hero({ week, group, className }: HeroProps) {
  const now = useNow(15_000);
  const parts = partsInSchoolTz(now);
  const { current, next, minutesUntilNext, minutesLeft } = currentAndNext(week, group, now);

  const todayHuman = formatDateRu(parts.iso, { weekday: true });

  return (
    <GlassCard glow={Boolean(current)} highlight className="p-6 md:p-9">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
            <Sparkles className="size-3.5" />
            {className} класс · группа {group}
          </div>
          <div className="flex items-baseline gap-3">
            <div
              suppressHydrationWarning
              className="font-display text-6xl md:text-7xl font-semibold leading-none tabular-nums"
            >
              {parts.hhmm}
            </div>
            <span className="text-sm text-[color:var(--color-fg-muted)] capitalize">
              {todayHuman}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <CurrentSlot
          current={current}
          minutesLeft={minutesLeft}
          minutesUntilNext={minutesUntilNext}
          next={next}
        />
        <NextSlot next={next} minutesUntilNext={minutesUntilNext} hasCurrent={Boolean(current)} />
      </div>
    </GlassCard>
  );
}

interface CurrentSlotProps {
  current: ReturnType<typeof currentAndNext>["current"];
  next: ReturnType<typeof currentAndNext>["next"];
  minutesLeft: number | null;
  minutesUntilNext: number | null;
}

function CurrentSlot({ current, next, minutesLeft, minutesUntilNext }: CurrentSlotProps) {
  if (current) {
    const progressPct = Math.round(current.progress * 100);
    return (
      <div className="rounded-2xl border border-[color:var(--color-accent)]/25 bg-gradient-to-br from-[color:var(--color-accent)]/10 to-[color:var(--color-accent-2)]/10 p-5 md:p-6 relative overflow-hidden">
        <motion.div
          className="absolute -inset-1 rounded-2xl bg-[radial-gradient(60%_60%_at_30%_30%,rgba(94,234,212,0.20),transparent_70%)]"
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative space-y-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
            <span className="flex items-center gap-2">
              <span className="relative inline-flex">
                <span className="absolute inline-flex size-2 rounded-full bg-[color:var(--color-accent)] opacity-75 animate-ping" />
                <span className="relative inline-flex size-2 rounded-full bg-[color:var(--color-accent)]" />
              </span>
              сейчас идёт · {current.lessonNumber} урок
            </span>
            <span className="tabular-nums text-[color:var(--color-fg-muted)]">
              {minutesLeft !== null ? `осталось ${formatCountdown(minutesLeft)}` : ""}
            </span>
          </div>
          <div className="font-display text-3xl md:text-4xl leading-tight">
            {current.subject}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[color:var(--color-fg-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" /> {current.startTime} – {current.endTime}
            </span>
            {current.room && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" /> каб. {current.room}
              </span>
            )}
            {current.teacher && (
              <span className="inline-flex items-center gap-1.5">{current.teacher}</span>
            )}
          </div>
          <div className="space-y-1">
            <div className="h-1.5 rounded-full bg-surface overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[color:var(--color-accent)] to-[color:var(--color-accent-2)]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <div className="text-[10px] tabular-nums text-[color:var(--color-fg-muted)] flex justify-between">
              <span>{current.startTime}</span>
              <span>{progressPct}%</span>
              <span>{current.endTime}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // No current lesson — show "перемена" or "пока ничего"
  if (next && minutesUntilNext !== null) {
    return (
      <div className="rounded-2xl border border-surface bg-surface p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[color:var(--color-warn)]">
          <Coffee className="size-3.5" /> перемена
        </div>
        <div className="font-display text-2xl md:text-3xl">
          до начала урока {formatCountdown(minutesUntilNext)}
        </div>
        <div className="text-sm text-[color:var(--color-fg-muted)]">
          Следующий — {next.subject}
          {next.room ? `, каб. ${next.room}` : ""}
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-surface bg-surface p-5 md:p-6">
      <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
        свободно
      </div>
      <div className="mt-2 font-display text-2xl md:text-3xl">
        Сегодня уроков больше нет
      </div>
      {next && (
        <div className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
          Следующий урок — {formatDateRu(next.date, { weekday: true })}, {next.subject}, {next.startTime}
        </div>
      )}
    </div>
  );
}

interface NextSlotProps {
  next: ReturnType<typeof currentAndNext>["next"];
  minutesUntilNext: number | null;
  hasCurrent: boolean;
}

function NextSlot({ next, minutesUntilNext, hasCurrent }: NextSlotProps) {
  if (!next) {
    return (
      <div className="rounded-2xl border border-surface bg-surface p-5 md:p-6">
        <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
          далее
        </div>
        <div className="mt-3 text-sm text-[color:var(--color-fg-muted)]">
          На этой неделе больше уроков нет
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-surface bg-surface p-5 md:p-6 space-y-3 group transition hover:border-surface-strong">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
        <span>далее · {next.lessonNumber} урок</span>
        {hasCurrent && minutesUntilNext !== null && (
          <span className="tabular-nums">через {formatCountdown(minutesUntilNext)}</span>
        )}
      </div>
      <div className="font-display text-2xl md:text-3xl leading-tight">{next.subject}</div>
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-[color:var(--color-fg-muted)]">
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <Clock className="size-4" /> {next.startTime}
        </span>
        {next.room && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" /> каб. {next.room}
          </span>
        )}
      </div>
      {next.room && (
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--color-accent)] hover:text-fg transition"
        >
          куда идти
          <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition" />
        </button>
      )}
    </div>
  );
}
