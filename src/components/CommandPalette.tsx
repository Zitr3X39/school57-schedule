"use client";

import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Clock, MapPin, GraduationCap, Search, Sparkles } from "lucide-react";
import { searchSchedule } from "@/lib/natural-search";
import type { WeekSchedule } from "@/lib/schedule/types";
import { DAY_OF_WEEK_RU_SHORT } from "@/lib/schedule/types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  week: WeekSchedule | null;
  group: 1 | 2;
  onPickDay: (iso: string) => void;
  onChangeClass: () => void;
  onChangeGroup: (g: 1 | 2) => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  week,
  group,
  onPickDay,
  onChangeClass,
  onChangeGroup,
}: Props) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isOpen = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isOpen) {
        e.preventDefault();
        onOpenChange(true);
      }
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  // Reset query when palette transitions from closed to open. Tracked via a
  // memoized last-state to avoid setState-in-effect lint warning.
  const [openMemo, setOpenMemo] = useState(open);
  if (open !== openMemo) {
    setOpenMemo(open);
    if (open) setQuery("");
  }

  const results = useMemo(() => {
    if (!week) return [];
    return searchSchedule(query, week, group);
  }, [query, week, group]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-black/55 backdrop-blur-md"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl"
          >
            <div className="rounded-3xl border border-surface bg-[#0a0e1c]/85 backdrop-blur-2xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] overflow-hidden">
              <Command label="Командная строка" shouldFilter={false}>
                <div className="flex items-center gap-3 px-5 py-4 border-b border-surface">
                  <Search className="size-4 text-[color:var(--color-fg-muted)]" />
                  <Command.Input
                    autoFocus
                    placeholder="что сейчас, где английский, уроки во вторник…"
                    value={query}
                    onValueChange={setQuery}
                    className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-[color:var(--color-fg-muted)]/70"
                  />
                  <kbd className="hidden md:inline-flex items-center rounded px-1.5 py-0.5 text-[10px] tabular-nums bg-surface text-[color:var(--color-fg-muted)] border border-surface font-mono">
                    esc
                  </kbd>
                </div>
                <Command.List className="max-h-[55vh] overflow-y-auto p-2">
                  {results.length === 0 && query === "" && (
                    <SuggestionsBlock
                      onChangeClass={() => {
                        onOpenChange(false);
                        onChangeClass();
                      }}
                      onChangeGroup={(g) => {
                        onChangeGroup(g);
                      }}
                      group={group}
                      onPick={(iso) => {
                        onPickDay(iso);
                        onOpenChange(false);
                      }}
                      week={week}
                    />
                  )}
                  {results.length === 0 && query !== "" && (
                    <Command.Empty className="px-3 py-6 text-center text-sm text-[color:var(--color-fg-muted)]">
                      Ничего не найдено для «{query}»
                    </Command.Empty>
                  )}
                  {results.length > 0 && (
                    <Command.Group heading="Результаты" className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)] px-2 py-1">
                      {results.map((r, i) => (
                        <Command.Item
                          key={r.lesson?.id ?? `${r.title}-${i}`}
                          value={`${r.title}-${i}`}
                          onSelect={() => {
                            if (r.lesson) {
                              onPickDay(r.lesson.date);
                              onOpenChange(false);
                            }
                          }}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl px-3 py-2.5 cursor-pointer",
                            "data-[selected=true]:bg-surface",
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {r.title}
                              {r.lesson?.group !== null && r.lesson?.group !== undefined && (
                                <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-[0.16em] bg-surface text-[color:var(--color-fg-muted)] border border-surface">
                                  гр {r.lesson.group}
                                </span>
                              )}
                            </div>
                            {r.subtitle && (
                              <div className="text-xs text-[color:var(--color-fg-muted)] truncate">
                                {r.subtitle}
                              </div>
                            )}
                          </div>
                          {r.lesson && (
                            <span className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)] tabular-nums whitespace-nowrap">
                              {DAY_OF_WEEK_RU_SHORT[r.lesson.dayOfWeek]} · {r.lesson.startTime}
                            </span>
                          )}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}
                </Command.List>
                <div className="flex items-center justify-between px-5 py-2.5 border-t border-surface text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="size-3" /> естественный язык
                  </span>
                  <span className="font-mono tracking-normal">↑↓ навигация · enter выбор</span>
                </div>
              </Command>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface SuggestionsBlockProps {
  group: 1 | 2;
  week: WeekSchedule | null;
  onChangeClass: () => void;
  onChangeGroup: (g: 1 | 2) => void;
  onPick: (iso: string) => void;
}

function SuggestionsBlock({ group, week, onChangeClass, onChangeGroup, onPick }: SuggestionsBlockProps) {
  return (
    <div className="space-y-4 p-2">
      <div>
        <div className="px-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
          быстро
        </div>
        <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <SuggestRow
            icon={<Clock className="size-4" />}
            label="Что сейчас"
            hint="что сейчас"
          />
          <SuggestRow
            icon={<MapPin className="size-4" />}
            label="Куда идти"
            hint="где английский"
          />
          <SuggestRow
            icon={<GraduationCap className="size-4" />}
            label="Найти учителя"
            hint="егорова"
          />
          <SuggestRow
            icon={<Sparkles className="size-4" />}
            label="Урок группы"
            hint="информатика группа 2"
          />
        </div>
      </div>
      {week && (
        <div>
          <div className="px-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
            дни недели
          </div>
          <div className="mt-1 grid grid-cols-3 sm:grid-cols-7 gap-1">
            {week.days.map((d) => (
              <button
                key={d.date}
                type="button"
                onClick={() => onPick(d.date)}
                className="rounded-xl px-2 py-2 text-xs hover:bg-surface-2 transition flex flex-col items-center gap-0.5"
              >
                <span className="uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
                  {DAY_OF_WEEK_RU_SHORT[d.dayOfWeek]}
                </span>
                <span className="tabular-nums">
                  {d.date.slice(8, 10)}.{d.date.slice(5, 7)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between px-2 pt-2">
        <button
          type="button"
          onClick={onChangeClass}
          className="text-xs text-[color:var(--color-accent)] hover:text-fg transition"
        >
          Сменить класс
        </button>
        <div className="inline-flex rounded-full border border-surface bg-surface p-0.5">
          {([1, 2] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onChangeGroup(g)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium tabular-nums",
                group === g
                  ? "bg-surface text-fg"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              гр {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SuggestRow({
  icon,
  label,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-2 transition">
      <div className="text-[color:var(--color-fg-muted)]">{icon}</div>
      <div className="flex-1">
        <div className="text-sm">{label}</div>
        <div className="text-[11px] text-[color:var(--color-fg-muted)]">«{hint}»</div>
      </div>
    </div>
  );
}
