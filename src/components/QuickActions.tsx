"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock,
  Compass,
  Sparkles,
  GraduationCap,
  Search,
  MapPin,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  group: 1 | 2;
  onSetGroup: (g: 1 | 2) => void;
  onOpenCommand: () => void;
  onScrollTo: (id: "today" | "week" | "analytics") => void;
}

interface Action {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  badge?: string;
  highlight?: boolean;
}

export function QuickActions({
  group,
  onSetGroup,
  onOpenCommand,
  onScrollTo,
}: QuickActionsProps) {
  const actions: Action[] = [
    {
      id: "search",
      label: "Поиск",
      icon: Search,
      onClick: onOpenCommand,
      badge: "⌘K",
      highlight: true,
    },
    {
      id: "today",
      label: "Сегодня",
      icon: Clock,
      onClick: () => onScrollTo("today"),
    },
    {
      id: "week",
      label: "Неделя",
      icon: CalendarDays,
      onClick: () => onScrollTo("week"),
    },
    {
      id: "analytics",
      label: "Аналитика",
      icon: Layers,
      onClick: () => onScrollTo("analytics"),
    },
    {
      id: "rooms",
      label: "Кабинеты",
      icon: MapPin,
      onClick: () => onOpenCommand(),
    },
    {
      id: "teachers",
      label: "Учителя",
      icon: GraduationCap,
      onClick: () => onOpenCommand(),
    },
    {
      id: "where",
      label: "Куда сейчас",
      icon: Compass,
      onClick: () => onOpenCommand(),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((a, i) => (
        <motion.button
          key={a.id}
          type="button"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.025 * i }}
          onClick={a.onClick}
          className={cn(
            "group inline-flex items-center gap-2 rounded-full px-3.5 py-1.5",
            "text-[12.5px] tracking-tight transition border",
            a.highlight
              ? "border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent)]/8 text-white hover:border-[color:var(--color-accent)]/60"
              : "border-white/8 bg-white/[0.025] text-white/85 hover:bg-white/[0.05] hover:border-white/15",
          )}
        >
          <a.icon className="size-3.5" />
          <span>{a.label}</span>
          {a.badge && (
            <span className="ml-1 rounded px-1.5 py-0.5 text-[10px] tabular-nums bg-white/5 text-[color:var(--color-fg-muted)] border border-white/10 font-mono">
              {a.badge}
            </span>
          )}
        </motion.button>
      ))}

      <div className="inline-flex items-center gap-1 ml-auto">
        <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)] mr-1.5 inline-flex items-center gap-1">
          <Sparkles className="size-3" /> группа
        </span>
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-0.5">
          {([1, 2] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onSetGroup(g)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition tabular-nums",
                group === g
                  ? "bg-gradient-to-r from-[color:var(--color-accent)]/30 to-[color:var(--color-accent-2)]/30 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                  : "text-white/65 hover:text-white",
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
