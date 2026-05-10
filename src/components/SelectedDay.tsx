"use client";

import { useMemo } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  MapPin,
  RefreshCw,
  X,
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import type { DayOfWeek, Lesson, WeekSchedule } from "@/lib/schedule/types";
import { DAY_OF_WEEK_RU } from "@/lib/schedule/types";
import { cn, formatDateRu } from "@/lib/utils";
import { todayInSchoolTz } from "@/lib/now";
import { subjectGradient } from "@/lib/subject-colors";
import { useStore } from "@/store/useStore";
import { lessonHasHomework } from "@/lib/homework";

interface Props {
  week: WeekSchedule | null;
  group: 1 | 2;
  date: string | null;
  onClose: () => void;
  /** Set when SelectedDay is allowed to switch dates by swipe / arrow / dots. */
  onChangeDate?: (iso: string) => void;
}

// Drag distance / velocity thresholds for committing a swipe.
const SWIPE_DISTANCE_THRESHOLD = 60;
const SWIPE_VELOCITY_THRESHOLD = 350;

export function SelectedDay({ week, group, date, onClose, onChangeDate }: Props) {
  return (
    <AnimatePresence mode="wait">
      {date && (
        <SelectedDayPager
          key={date}
          week={week}
          group={group}
          date={date}
          onClose={onClose}
          onChangeDate={onChangeDate}
        />
      )}
    </AnimatePresence>
  );
}

function SelectedDayPager({
  week,
  group,
  date,
  onClose,
  onChangeDate,
}: Props & { date: string }) {
  const days = useMemo(() => week?.days ?? [], [week]);
  const idx = useMemo(
    () => Math.max(0, days.findIndex((d) => d.date === date)),
    [days, date],
  );
  const day = days[idx];
  const today = todayInSchoolTz();
  const isToday = date === today.iso;

  function go(delta: number) {
    if (!onChangeDate || days.length === 0) return;
    const target = idx + delta;
    if (target < 0 || target >= days.length) return;
    onChangeDate(days[target].date);
  }

  function onDragEnd(_e: unknown, info: PanInfo) {
    const { offset, velocity } = info;
    if (
      offset.x < -SWIPE_DISTANCE_THRESHOLD ||
      velocity.x < -SWIPE_VELOCITY_THRESHOLD
    ) {
      go(1);
    } else if (
      offset.x > SWIPE_DISTANCE_THRESHOLD ||
      velocity.x > SWIPE_VELOCITY_THRESHOLD
    ) {
      go(-1);
    }
  }

  if (!day) return null;
  const lessons = day.lessons.filter((l) => l.group === null || l.group === group);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
    >
      <GlassCard className="p-6 md:p-7" highlight>
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <div
              className={cn(
                "text-xs uppercase tracking-[0.18em]",
                isToday
                  ? "text-[color:var(--color-accent)]"
                  : "text-fg-muted",
              )}
            >
              {DAY_OF_WEEK_RU[day.dayOfWeek as DayOfWeek]}
              {isToday && " · сегодня"}
            </div>
            <h3 className="mt-1 font-display text-2xl md:text-3xl">{formatDateRu(date)}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-fg-muted hover:text-fg hover:bg-surface-2"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Day pager: dots + arrows. Hidden when there's only one day. */}
        {onChangeDate && days.length > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={idx === 0}
              className="rounded-full p-2 text-fg-muted hover:text-fg hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition"
              aria-label="предыдущий день"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="flex flex-1 items-center justify-center gap-1.5">
              {days.map((d, i) => (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => onChangeDate(d.date)}
                  aria-label={`день ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === idx
                      ? "w-8 bg-[color:var(--color-accent)]"
                      : "w-1.5 bg-surface-strong hover:bg-surface-2",
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={idx === days.length - 1}
              className="rounded-full p-2 text-fg-muted hover:text-fg hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition"
              aria-label="следующий день"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}

        {lessons.length === 0 ? (
          <div className="mt-6 text-sm text-fg-muted">В этот день уроков нет.</div>
        ) : (
          <motion.ol
            className="mt-6 space-y-2 touch-pan-y select-none"
            drag={onChangeDate && days.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={onDragEnd}
          >
            {lessons.map((l, i) => (
              <motion.li
                key={l.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 320,
                  damping: 28,
                  delay: i * 0.025,
                }}
              >
                <LessonCardSimple lesson={l} />
              </motion.li>
            ))}
          </motion.ol>
        )}

        {onChangeDate && days.length > 1 && (
          <div className="mt-4 text-center text-[10px] uppercase tracking-[0.18em] text-fg-muted md:hidden">
            ← свайп для смены дня →
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

function LessonCardSimple({ lesson }: { lesson: Lesson }) {
  const grad = subjectGradient(lesson.subject);
  const hasHw = lessonHasHomework(lesson);
  const done = useStore((s) => (hasHw ? Boolean(s.homeworkDone[lesson.id]) : false));
  const toggle = useStore((s) => s.toggleHomework);
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-surface bg-surface px-4 py-3 transition-colors hover:bg-surface-2",
        done && "opacity-60",
      )}
      style={{
        // Tinted left border using the subject's hue
        borderLeft: `3px solid ${grad.solid}`,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background: `radial-gradient(60% 80% at 0% 50%, ${grad.fade}, transparent 70%)`,
        }}
      />
      <div className="relative flex items-baseline gap-3">
        <span className="text-[11px] tabular-nums uppercase tracking-[0.16em] text-fg-muted w-7">
          {lesson.lessonNumber}
        </span>
        <span
          className={cn(
            "font-display text-lg flex-1 truncate",
            done && "line-through decoration-1 decoration-fg-muted",
          )}
        >
          {lesson.subject}
        </span>
        <span className="tabular-nums text-xs text-fg-soft">
          {lesson.startTime}–{lesson.endTime}
        </span>
      </div>
      <div className="relative mt-1.5 ml-10 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted">
        {lesson.group !== null && (
          <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-[0.14em] bg-surface-2 border border-surface">
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
      {hasHw && (
        <div className="relative mt-2 ml-10 flex items-start gap-2">
          <HomeworkCheckbox
            done={done}
            onToggle={() => toggle(lesson.id)}
            color={grad.solid}
          />
          <span
            className={cn(
              "flex-1 text-[12px] text-fg-soft leading-snug pt-px",
              done && "line-through decoration-1 decoration-fg-muted text-fg-muted",
            )}
          >
            {lesson.notes}
          </span>
        </div>
      )}
    </div>
  );
}

interface HomeworkCheckboxProps {
  done: boolean;
  onToggle: () => void;
  /** Subject hex color used as the filled accent. */
  color: string;
}

export function HomeworkCheckbox({ done, onToggle, color }: HomeworkCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? "Снять отметку" : "Отметить как сделано"}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "relative grid size-[18px] shrink-0 place-items-center rounded-md border transition-colors",
        done
          ? "border-transparent"
          : "border-[color:var(--border-strong)] hover:border-fg-muted bg-surface-2",
      )}
      style={done ? { backgroundColor: color } : undefined}
    >
      <AnimatePresence initial={false}>
        {done && (
          <motion.span
            key="check"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 360, damping: 22 }}
          >
            <Check className="size-3 text-[#0b0e16]" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
