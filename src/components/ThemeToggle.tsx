"use client";

import { Moon, Sun, MonitorSmartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, type Theme } from "@/store/useStore";

/**
 * 3-way theme cycle button: dark → light → system → dark…
 * Stores choice in zustand (persisted via localStorage).
 */
export function ThemeToggle() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);

  const next: Record<Theme, Theme> = {
    dark: "light",
    light: "system",
    system: "dark",
  };
  const labels: Record<Theme, string> = {
    dark: "тёмная тема",
    light: "светлая тема",
    system: "по системе",
  };

  return (
    <button
      type="button"
      aria-label={`Переключить тему · сейчас ${labels[theme]}`}
      title={`Тема: ${labels[theme]}`}
      onClick={() => setTheme(next[theme])}
      className="relative inline-flex size-9 items-center justify-center overflow-hidden rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] hover:bg-[color:var(--surface-2)] transition-colors"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: 14, opacity: 0, rotate: -30 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -14, opacity: 0, rotate: 30 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="absolute inset-0 grid place-items-center"
        >
          {theme === "dark" && <Moon className="size-4" />}
          {theme === "light" && <Sun className="size-4" />}
          {theme === "system" && <MonitorSmartphone className="size-4" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
