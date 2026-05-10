"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft,
  ChevronRight,
  GraduationCap,
  MapPin,
  Search,
  X,
} from "lucide-react";
import type { Lesson, WeekSchedule } from "@/lib/schedule/types";
import { DAY_OF_WEEK_RU_SHORT } from "@/lib/schedule/types";
import { subjectGradient } from "@/lib/subject-colors";

type Kind = "teachers" | "rooms";

interface Props {
  open: boolean;
  onClose: () => void;
  kind: Kind;
  week: WeekSchedule | null;
  group: 1 | 2;
}

interface DirectoryEntry {
  /** The teacher name or room number. */
  key: string;
  /** All lessons in the week filtered to this entry, sorted by date+lessonNumber. */
  lessons: Lesson[];
}

const COPY = {
  teachers: {
    title: "Учителя",
    subtitle: "Учителя, у которых ты учишься на этой неделе",
    placeholder: "Поиск по фамилии…",
    empty: "На этой неделе нет уроков с указанным учителем.",
    icon: GraduationCap,
  },
  rooms: {
    title: "Кабинеты",
    subtitle: "Кабинеты, в которых проходят твои уроки",
    placeholder: "Поиск по номеру кабинета…",
    empty: "На этой неделе ни один кабинет не указан.",
    icon: MapPin,
  },
} as const;

export function DirectoryPanel({ open, onClose, kind, week, group }: Props) {
  const [query, setQuery] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Reset on open / kind change without setState-in-effect.
  const [openMemo, setOpenMemo] = useState({ open, kind });
  if (open !== openMemo.open || kind !== openMemo.kind) {
    setOpenMemo({ open, kind });
    if (open) {
      setQuery("");
      setActiveKey(null);
    }
  }

  // Build directory entries (teachers / rooms) from the current week + group.
  const entries: DirectoryEntry[] = useMemo(() => {
    if (!week) return [];
    const map = new Map<string, Lesson[]>();
    for (const day of week.days) {
      for (const l of day.lessons) {
        if (l.group !== null && l.group !== group) continue;
        const key = kind === "teachers" ? l.teacher : l.room;
        if (!key || !key.trim()) continue;
        const list = map.get(key) ?? [];
        list.push(l);
        map.set(key, list);
      }
    }
    return Array.from(map.entries())
      .map(([key, lessons]) => ({
        key,
        lessons: lessons.sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.lessonNumber - b.lessonNumber;
        }),
      }))
      .sort((a, b) => collator.compare(a.key, b.key));
  }, [week, group, kind]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.key.toLowerCase().includes(q));
  }, [entries, query]);

  const active = activeKey
    ? entries.find((e) => e.key === activeKey) ?? null
    : null;

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Close on escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (activeKey) {
          setActiveKey(null);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, activeKey]);

  const copy = COPY[kind];
  const Icon = copy.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/55 backdrop-blur-md md:items-start md:pt-[10vh] md:px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full md:max-w-2xl"
          >
            <div className="flex flex-col h-[100dvh] md:h-auto md:max-h-[80vh] md:rounded-3xl border-0 md:border border-surface bg-[color:var(--bg-elev)]/95 backdrop-blur-2xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-surface">
                {active ? (
                  <button
                    type="button"
                    onClick={() => setActiveKey(null)}
                    className="rounded-full p-1.5 text-fg-muted hover:text-fg hover:bg-surface-2 transition"
                    aria-label="назад к списку"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                ) : (
                  <Icon className="size-4 text-fg-muted" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase tracking-[0.18em] text-fg-muted">
                    {active ? copy.title : copy.title}
                  </div>
                  <div className="font-display text-lg md:text-xl truncate">
                    {active ? active.key : copy.subtitle}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-fg-muted hover:text-fg hover:bg-surface-2 transition"
                  aria-label="закрыть"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto">
                {!active ? (
                  <ListView
                    entries={filtered}
                    query={query}
                    setQuery={setQuery}
                    onPick={setActiveKey}
                    placeholder={copy.placeholder}
                    empty={
                      entries.length === 0
                        ? copy.empty
                        : `Ничего не найдено для «${query}»`
                    }
                    kind={kind}
                  />
                ) : (
                  <DetailView entry={active} kind={kind} />
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const collator = new Intl.Collator("ru", { sensitivity: "base", numeric: true });

interface ListProps {
  entries: DirectoryEntry[];
  query: string;
  setQuery: (q: string) => void;
  onPick: (key: string) => void;
  placeholder: string;
  empty: string;
  kind: Kind;
}

function ListView({
  entries,
  query,
  setQuery,
  onPick,
  placeholder,
  empty,
  kind,
}: ListProps) {
  return (
    <div>
      <div className="sticky top-0 z-10 bg-[color:var(--bg-elev)]/95 backdrop-blur-md border-b border-surface px-5 py-3 flex items-center gap-3">
        <Search className="size-4 text-fg-muted" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-fg-muted/70"
        />
      </div>

      {entries.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-fg-muted">{empty}</div>
      ) : (
        <ul className="p-2">
          {entries.map((e, i) => {
            const subjects = uniq(e.lessons.map((l) => l.subject));
            return (
              <motion.li
                key={e.key}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: Math.min(0.025 * i, 0.25) }}
              >
                <button
                  type="button"
                  onClick={() => onPick(e.key)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl border border-transparent hover:border-surface-strong hover:bg-surface-2 transition text-left"
                >
                  <Avatar value={e.key} kind={kind} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[15px] truncate">{e.key}</div>
                    <div className="text-xs text-fg-muted truncate">
                      {e.lessons.length}{" "}
                      {pluralLessons(e.lessons.length)}
                      {" · "}
                      {subjects.slice(0, 3).join(", ")}
                      {subjects.length > 3 && " …"}
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-fg-muted" />
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface DetailProps {
  entry: DirectoryEntry;
  kind: Kind;
}

function DetailView({ entry, kind }: DetailProps) {
  const byDate = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const l of entry.lessons) {
      const list = map.get(l.date) ?? [];
      list.push(l);
      map.set(l.date, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [entry]);

  return (
    <div className="px-3 py-3 space-y-4">
      <div className="px-3 py-2 text-xs text-fg-muted">
        Всего {entry.lessons.length} {pluralLessons(entry.lessons.length)} на неделе.
      </div>
      {byDate.map(([date, lessons]) => (
        <div key={date}>
          <div className="px-3 py-1 flex items-baseline gap-2 text-[10px] uppercase tracking-[0.18em] text-fg-muted">
            <span>{DAY_OF_WEEK_RU_SHORT[lessons[0].dayOfWeek]}</span>
            <span className="tabular-nums">{date.slice(8, 10)}.{date.slice(5, 7)}</span>
          </div>
          <ul className="mt-1 space-y-1.5">
            {lessons.map((l) => {
              const grad = subjectGradient(l.subject);
              return (
                <li
                  key={l.id}
                  className="relative overflow-hidden rounded-2xl border border-surface bg-surface px-3 py-2.5"
                  style={{ borderLeft: `3px solid ${grad.solid}` }}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-40"
                    style={{
                      background: `radial-gradient(60% 80% at 0% 50%, ${grad.fade}, transparent 70%)`,
                    }}
                  />
                  <div className="relative flex items-baseline gap-3">
                    <span className="text-[10px] tabular-nums uppercase tracking-[0.16em] text-fg-muted w-6">
                      {l.lessonNumber}
                    </span>
                    <span className="font-display text-[15px] flex-1 truncate">
                      {l.subject}
                    </span>
                    <span className="tabular-nums text-[11px] text-fg-soft">
                      {l.startTime}–{l.endTime}
                    </span>
                  </div>
                  <div className="relative mt-1 ml-8 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-fg-muted">
                    <span className="tabular-nums">{l.className}</span>
                    {l.group !== null && (
                      <span className="px-1.5 rounded text-[9px] uppercase tracking-[0.14em] bg-surface-2 border border-surface">
                        гр {l.group}
                      </span>
                    )}
                    {kind === "teachers" && l.room && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" /> каб. {l.room}
                      </span>
                    )}
                    {kind === "rooms" && l.teacher && (
                      <span className="inline-flex items-center gap-1 truncate">
                        <GraduationCap className="size-3" /> {l.teacher}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Avatar({ value, kind }: { value: string; kind: Kind }) {
  const grad = subjectGradient(value);
  const initials = kind === "teachers" ? teacherInitials(value) : value;
  return (
    <div
      className="grid size-10 shrink-0 place-items-center rounded-xl text-[12px] font-semibold tabular-nums"
      style={{
        background: grad.gradient,
        color: "#0b0e16",
        boxShadow: `inset 0 0 0 1px ${grad.solid}40`,
      }}
    >
      {initials}
    </div>
  );
}

function teacherInitials(name: string): string {
  // "Иванова И. И." -> "ИИ"; "Петров А.Б." -> "ПА"; fallback first letter.
  const cleaned = name.replace(/\./g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const a = parts[0][0] ?? "";
  const b = parts[1][0] ?? "";
  return (a + b).toUpperCase();
}

function uniq<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}

function pluralLessons(n: number): string {
  const abs = Math.abs(n) % 100;
  const ld = abs % 10;
  if (abs > 10 && abs < 20) return "уроков";
  if (ld === 1) return "урок";
  if (ld >= 2 && ld <= 4) return "урока";
  return "уроков";
}
