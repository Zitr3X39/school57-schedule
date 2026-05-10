"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useClassesQuery } from "@/hooks/useSchedule";
import { cn } from "@/lib/utils";
import { GlassCard } from "./GlassCard";

interface ClassPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (className: string) => void;
  /** Show as a centered modal (true) or as a sheet on top (false). */
  modal?: boolean;
  /** Optional title — used by both onboarding and switcher. */
  title?: string;
  /** Subtitle line. */
  subtitle?: string;
}

export function ClassPicker({
  open,
  onClose,
  onSelect,
  modal = true,
  title = "Выбери свой класс",
  subtitle = "Используем расписание МАОУ СОШ №57 г. Калининград",
}: ClassPickerProps) {
  const { data, isLoading, error } = useClassesQuery();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.allClasses;
    return data.allClasses.filter((c) => c.toLowerCase().includes(q));
  }, [data, query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4",
            modal && "bg-black/60 backdrop-blur-md",
          )}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl"
          >
            <GlassCard glow highlight className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
                    школа № 57
                  </div>
                  <h2 className="mt-1 font-display text-3xl md:text-4xl leading-tight">
                    {title}
                  </h2>
                  <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
                    {subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-[color:var(--color-fg-muted)] hover:text-fg hover:bg-surface-2"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-6 flex items-center gap-2 rounded-2xl border border-surface bg-surface px-4 py-3">
                <Search className="size-4 text-[color:var(--color-fg-muted)]" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Например, 10Д…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none placeholder:text-[color:var(--color-fg-muted)]/70 text-base"
                />
              </div>

              <div className="mt-5 max-h-[55vh] overflow-y-auto pr-1 -mr-1">
                {isLoading && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div
                        key={i}
                        className="shimmer h-10 rounded-xl bg-surface"
                      />
                    ))}
                  </div>
                )}
                {error && (
                  <div className="text-sm text-[color:var(--color-danger)]">
                    Не удалось загрузить список классов: {(error as Error).message}
                  </div>
                )}
                {data && (
                  <div className="space-y-5">
                    {data.groups.map((g) => {
                      const classesInGroup = g.classes.filter((c) => filtered.includes(c));
                      if (classesInGroup.length === 0) return null;
                      return (
                        <div key={g.heading}>
                          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)] mb-2">
                            {g.heading}
                          </div>
                          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                            {classesInGroup.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  onSelect(c);
                                  onClose();
                                }}
                                className="h-10 rounded-xl border border-surface bg-surface hover:border-[color:var(--color-accent)]/40 hover:bg-[color:var(--color-accent)]/8 transition tabular-nums font-medium"
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {filtered.length === 0 && (
                      <div className="py-8 text-center text-sm text-[color:var(--color-fg-muted)]">
                        Ничего не найдено
                      </div>
                    )}
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
