"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { GraduationCap, MapPin, RefreshCw, BookOpen } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { useNow } from "@/hooks/useNow";
import { deriveStatus, todayLessons } from "@/lib/schedule/aggregate";
import type { WeekSchedule } from "@/lib/schedule/types";
import { cn, formatCountdown } from "@/lib/utils";
import { timeToMinutes } from "@/lib/schedule/bell";
import { todayInSchoolTz, nowMinutesInSchoolTz } from "@/lib/now";
import { subjectGradient } from "@/lib/subject-colors";

interface TimelineProps {
  week: WeekSchedule | null;
  group: 1 | 2;
}

export function Timeline({ week, group }: TimelineProps) {
  const now = useNow(15_000);
  const today = todayInSchoolTz(now);
  const nowMin = nowMinutesInSchoolTz(now);

  const lessons = useMemo(() => todayLessons(week, group), [week, group]);
  if (!week) {
    return (
      <GlassCard className="p-6">
        <SectionHead title="Сегодня" subtitle={today.iso} />
        <div className="mt-6 text-sm text-[color:var(--color-fg-muted)]">
          Загружаем расписание…
        </div>
      </GlassCard>
    );
  }
  if (lessons.length === 0) {
    return (
      <GlassCard className="p-6">
        <SectionHead
          title="Сегодня"
          subtitle="выходной — отдыхай"
        />
        <div className="mt-8 grid place-items-center text-[color:var(--color-fg-muted)]">
          <BookOpen className="size-10 opacity-30" />
          <p className="mt-3 text-sm">Уроков на сегодня нет.</p>
        </div>
      </GlassCard>
    );
  }
  return (
    <GlassCard className="p-6">
      <SectionHead
        title="Сегодня"
        subtitle={`${lessons.length} ${pluralLessons(lessons.length)} · ${lessons[0].startTime}–${lessons[lessons.length - 1].endTime}`}
      />
      <ol className="mt-6 relative">
        <div
          aria-hidden
          className="absolute left-[1.55rem] top-2 bottom-2 w-px"
          style={{
            background:
              "linear-gradient(to bottom, var(--border) 0%, var(--border-strong) 50%, var(--border) 100%)",
          }}
        />
        {lessons.map((l, i) => {
          const derived = deriveStatus(l, now);
          const showBreakBefore = i > 0 && timeToMinutes(l.startTime) - timeToMinutes(lessons[i - 1].endTime) >= 5;
          return (
            <li key={l.id}>
              {showBreakBefore && (
                <BreakRow
                  start={lessons[i - 1].endTime}
                  end={l.startTime}
                  isCurrent={
                    nowMin >= timeToMinutes(lessons[i - 1].endTime) &&
                    nowMin < timeToMinutes(l.startTime) &&
                    today.iso === l.date
                  }
                />
              )}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 320,
                  damping: 28,
                  delay: 0.035 * i,
                }}
              >
                <LessonRow lesson={derived} />
              </motion.div>
            </li>
          );
        })}
      </ol>
    </GlassCard>
  );
}

function SectionHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="font-display text-2xl md:text-3xl">{title}</h2>
      <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)] tabular-nums">
        {subtitle}
      </div>
    </div>
  );
}

interface LessonRowProps {
  lesson: ReturnType<typeof deriveStatus>;
}

function LessonRow({ lesson }: LessonRowProps) {
  const isCurrent = lesson.status === "current";
  const isPast = lesson.status === "past";
  const grad = subjectGradient(lesson.subject);
  return (
    <div
      className={cn(
        "group relative grid grid-cols-[3rem_1fr] gap-4 items-start py-3.5 pl-2 pr-3 rounded-2xl transition-colors",
        isCurrent && "bg-surface",
        !isCurrent && !isPast && "hover:bg-surface-2",
      )}
      style={
        isCurrent
          ? {
              background: `linear-gradient(90deg, ${grad.fade} 0%, var(--surface) 60%)`,
            }
          : undefined
      }
    >
      <div className="relative flex flex-col items-center pt-0.5">
        <div
          className={cn(
            "z-10 size-3 rounded-full border-2 transition",
            isCurrent && "shadow-[0_0_18px_currentColor]",
            isPast && "border-surface-strong bg-surface",
            !isCurrent && !isPast && "border-surface-strong bg-transparent group-hover:scale-125",
          )}
          style={
            isCurrent
              ? { color: grad.solid, background: grad.solid, borderColor: grad.solid }
              : !isPast
                ? { borderColor: grad.solid + "80" }
                : undefined
          }
        />
        <span
          className={cn(
            "mt-2 text-[10px] tabular-nums uppercase tracking-[0.14em]",
            isCurrent && "text-[color:var(--color-accent)]",
            isPast && "text-[color:var(--color-fg-muted)]/60",
            !isCurrent && !isPast && "text-[color:var(--color-fg-muted)]",
          )}
        >
          {lesson.lessonNumber}
        </span>
      </div>
      <div className={cn("flex-1 min-w-0", isPast && "opacity-50")}>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-lg md:text-xl text-fg truncate">
            {lesson.subject}
          </span>
          {lesson.group !== null && (
            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.16em] bg-surface border border-surface text-[color:var(--color-fg-muted)]">
              группа {lesson.group}
            </span>
          )}
          {lesson.isReplacement && (
            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.16em] border border-[color:var(--color-warn)]/40 text-[color:var(--color-warn)] inline-flex items-center gap-1">
              <RefreshCw className="size-2.5" /> замена
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[color:var(--color-fg-muted)]">
          <span className="tabular-nums text-fg-soft">
            {lesson.startTime}–{lesson.endTime}
          </span>
          {lesson.room && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" /> каб. {lesson.room}
            </span>
          )}
          {lesson.teacher && (
            <span className="inline-flex items-center gap-1.5 truncate max-w-[18ch] md:max-w-none">
              <GraduationCap className="size-3.5" /> {lesson.teacher}
            </span>
          )}
        </div>
        {lesson.notes && (
          <div className="mt-1.5 text-[12px] text-fg-muted">
            {lesson.notes}
          </div>
        )}
      </div>
    </div>
  );
}

interface BreakRowProps {
  start: string;
  end: string;
  isCurrent: boolean;
}

function BreakRow({ start, end, isCurrent }: BreakRowProps) {
  const minutes = timeToMinutes(end) - timeToMinutes(start);
  return (
    <div className="grid grid-cols-[3rem_1fr] items-center text-[11px] text-[color:var(--color-fg-muted)] py-1.5">
      <div className="flex justify-center">
        <span className="size-1.5 rounded-full bg-surface-2" />
      </div>
      <div
        className={cn(
          "flex items-center gap-3 pl-2",
          isCurrent && "text-[color:var(--color-warn)]",
        )}
      >
        <span className="uppercase tracking-[0.16em]">перемена</span>
        <span className="tabular-nums">{minutes} мин</span>
        {isCurrent && (
          <span className="ml-2 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-[0.18em] border border-[color:var(--color-warn)]/30 text-[color:var(--color-warn)]">
            идёт сейчас · до {end}
          </span>
        )}
      </div>
    </div>
  );
}

function pluralLessons(n: number): string {
  const abs = Math.abs(n) % 100;
  const ld = abs % 10;
  if (abs > 10 && abs < 20) return "уроков";
  if (ld === 1) return "урок";
  if (ld >= 2 && ld <= 4) return "урока";
  return "уроков";
}

// Suppress unused warnings in environments that don't need formatCountdown here yet.
// (kept import to allow future use without re-importing).
void formatCountdown;
