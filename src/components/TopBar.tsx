"use client";

import { GraduationCap, Search, ChevronDown, Sparkles } from "lucide-react";
import type { WeekSchedule } from "@/lib/schedule/types";
import { useNow } from "@/hooks/useNow";
import { partsInSchoolTz } from "@/lib/now";
import { ThemeToggle } from "./ThemeToggle";

interface TopBarProps {
  className: string;
  group: 1 | 2;
  source?: { fromFixture: boolean; url: string } | null;
  week?: WeekSchedule | null;
  onChangeClass: () => void;
  onOpenCommand: () => void;
}

export function TopBar({ className, group, source, onChangeClass, onOpenCommand }: TopBarProps) {
  const now = useNow(60_000);
  const parts = partsInSchoolTz(now);
  return (
    <header className="sticky top-0 z-20 backdrop-blur-xl bg-[color:var(--bg)]/55 border-b border-[color:var(--border)]">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-xl bg-gradient-to-br from-[color:var(--color-accent)]/40 to-[color:var(--color-accent-2)]/40 grid place-items-center">
            <Sparkles className="size-4" />
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--fg-muted)]">
              МАОУ СОШ №57
            </div>
            <div className="font-display text-sm md:text-base truncate">
              Расписание · {className} · группа {group}
            </div>
          </div>
        </div>

        <div className="flex-1" />

        <div className="hidden md:flex items-center gap-2 text-xs text-[color:var(--fg-muted)]">
          <span suppressHydrationWarning className="tabular-nums">{parts.hhmm}</span>
          {source?.fromFixture && (
            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.16em] bg-[color:var(--surface)] border border-[color:var(--border)]">
              demo · фикстуры
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenCommand}
          className="hidden md:inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs border border-[color:var(--border)] bg-[color:var(--surface)] hover:bg-[color:var(--surface-2)] transition-colors"
        >
          <Search className="size-3.5" />
          <span>поиск</span>
          <span className="rounded px-1.5 py-0.5 text-[10px] tabular-nums bg-[color:var(--surface)] text-[color:var(--fg-muted)] border border-[color:var(--border)] font-mono">
            ⌘K
          </span>
        </button>

        <ThemeToggle />

        <button
          type="button"
          onClick={onChangeClass}
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs border border-[color:var(--border)] bg-[color:var(--surface)] hover:bg-[color:var(--surface-2)] transition-colors"
        >
          <GraduationCap className="size-3.5" />
          <span>{className}</span>
          <ChevronDown className="size-3.5" />
        </button>
      </div>
    </header>
  );
}
