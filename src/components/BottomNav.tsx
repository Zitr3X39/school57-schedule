"use client";

import { Clock, CalendarDays, Layers, Search, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  active: "today" | "week" | "analytics";
  onChange: (id: "today" | "week" | "analytics") => void;
  onOpenCommand: () => void;
  onOpenClasses: () => void;
}

export function BottomNav({ active, onChange, onOpenCommand, onOpenClasses }: BottomNavProps) {
  const items: Array<{ id: "today" | "week" | "analytics"; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "today", label: "Сегодня", icon: Clock },
    { id: "week", label: "Неделя", icon: CalendarDays },
    { id: "analytics", label: "Аналитика", icon: Layers },
  ];
  return (
    <nav
      aria-label="Нижняя навигация"
      className="lg:hidden fixed bottom-3 inset-x-3 z-30 rounded-2xl border border-surface bg-[color:var(--bg-elev)]/85 backdrop-blur-2xl shadow-[0_15px_40px_-12px_rgba(0,0,0,0.7)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5 items-center gap-1 p-1.5">
        {items.map((it) => {
          const Active = active === it.id;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onChange(it.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] uppercase tracking-[0.16em]",
                Active
                  ? "text-fg bg-surface"
                  : "text-[color:var(--color-fg-muted)] active:bg-surface",
              )}
            >
              <it.icon className="size-4" />
              <span>{it.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onOpenCommand}
          className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-fg-muted)] active:bg-surface"
        >
          <Search className="size-4" />
          <span>Поиск</span>
        </button>
        <button
          type="button"
          onClick={onOpenClasses}
          className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-fg-muted)] active:bg-surface"
        >
          <GraduationCap className="size-4" />
          <span>Класс</span>
        </button>
      </div>
    </nav>
  );
}
