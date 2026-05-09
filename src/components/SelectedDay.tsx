"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, MapPin, RefreshCw, X } from "lucide-react";
import { GlassCard } from "./GlassCard";
import type { DayOfWeek, Lesson, WeekSchedule } from "@/lib/schedule/types";
import { DAY_OF_WEEK_RU } from "@/lib/schedule/types";
import { cn, formatDateRu } from "@/lib/utils";
import { todayInSchoolTz } from "@/lib/now";

interface Props {
  week: WeekSchedule | null;
  group: 1 | 2;
  date: string | null;
  onClose: () => void;
}

export function SelectedDay({ week, group, date, onClose }: Props) {
  return (
    <AnimatePresence>
      {date && (
        <SelectedDayInner
          key={date}
          week={week}
          group={group}
          date={date}
          onClose={onClose}
        />
      )}
    </AnimatePresence>
  );
}

function SelectedDayInner({ week, group, date, onClose }: Props & { date: string }) {
  const day = week?.days.find((d) => d.date === date);
  if (!day) return null;
  const lessons = day.lessons.filter((l) => l.group === null || l.group === group);
  const today = todayInSchoolTz();
  const isToday = date === today.iso;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <GlassCard className="p-6">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <div className={cn(
              "text-xs uppercase tracking-[0.18em]",
              isToday ? "text-[color:var(--color-accent)]" : "text-[color:var(--color-fg-muted)]",
            )}>
              {DAY_OF_WEEK_RU[day.dayOfWeek as DayOfWeek]}
              {isToday && " · сегодня"}
            </div>
            <h3 className="mt-1 font-display text-2xl md:text-3xl">{formatDateRu(date)}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[color:var(--color-fg-muted)] hover:text-white hover:bg-white/5"
          >
            <X className="size-4" />
          </button>
        </div>
        {lessons.length === 0 ? (
          <div className="mt-6 text-sm text-[color:var(--color-fg-muted)]">
            В этот день уроков нет.
          </div>
        ) : (
          <ol className="mt-6 space-y-2">
            {lessons.map((l, i) => (
              <motion.li
                key={l.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
              >
                <LessonCardSimple lesson={l} />
              </motion.li>
            ))}
          </ol>
        )}
      </GlassCard>
    </motion.div>
  );
}

function LessonCardSimple({ lesson }: { lesson: Lesson }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3">
      <div className="flex items-baseline gap-3">
        <span className="text-[11px] tabular-nums uppercase tracking-[0.16em] text-[color:var(--color-fg-muted)] w-7">
          {lesson.lessonNumber}
        </span>
        <span className="font-display text-lg flex-1 truncate">{lesson.subject}</span>
        <span className="tabular-nums text-xs text-white/70">
          {lesson.startTime}–{lesson.endTime}
        </span>
      </div>
      <div className="mt-1.5 ml-10 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[color:var(--color-fg-muted)]">
        {lesson.group !== null && (
          <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-[0.14em] bg-white/5 border border-white/10">
            гр {lesson.group}
          </span>
        )}
        {lesson.room && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" /> каб. {lesson.room}
          </span>
        )}
        {lesson.teacher && (
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="size-3.5" /> {lesson.teacher}
          </span>
        )}
        {lesson.isReplacement && (
          <span className="inline-flex items-center gap-1.5 text-[color:var(--color-warn)]">
            <RefreshCw className="size-3" /> замена
          </span>
        )}
      </div>
      {lesson.notes && (
        <div className="mt-1.5 ml-10 text-[12px] text-white/60">{lesson.notes}</div>
      )}
    </div>
  );
}
