"use client";

import { GraduationCap, Search, ChevronDown, Sparkles } from "lucide-react";
import type { WeekSchedule } from "@/lib/schedule/types";
import { useNow } from "@/hooks/useNow";
import { partsInSchoolTz } from "@/lib/now";

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
    <header className="sticky top-0 z-20 backdrop-blur-xl bg-[#04060d]/55 border-b border-white/5">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-xl bg-gradient-to-br from-[color:var(--color-accent)]/40 to-[color:var(--color-accent-2)]/40 grid place-items-center">
            <Sparkles className="size-4" />
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
              МАОУ СОШ №57
            </div>
            <div className="font-display text-sm md:text-base truncate">
              Расписание · {className} · группа {group}
            </div>
          </div>
        </div>

        <div className="flex-1" />

        <div className="hidden md:flex items-center gap-2 text-xs text-[color:var(--color-fg-muted)]">
          <span suppressHydrationWarning className="tabular-nums">{parts.hhmm}</span>
          {source?.fromFixture && (
            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.16em] bg-white/5 border border-white/10">
              demo · фикстуры
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenCommand}
          className="hidden md:inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition"
        >
          <Search className="size-3.5" />
          <span>поиск</span>
          <span className="rounded px-1.5 py-0.5 text-[10px] tabular-nums bg-white/5 text-[color:var(--color-fg-muted)] border border-white/10 font-mono">
            ⌘K
          </span>
        </button>
        <button
          type="button"
          onClick={onChangeClass}
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition"
        >
          <GraduationCap className="size-3.5" />
          <span>{className}</span>
          <ChevronDown className="size-3.5" />
        </button>
      </div>
    </header>
  );
}
