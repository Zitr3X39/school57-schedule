"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";

/**
 * Applies the chosen theme to <html> as `data-theme="dark"|"light"`.
 * Listens to the system color-scheme when theme is "system".
 *
 * Renders nothing.
 */
export function ThemeManager() {
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const apply = (resolved: "dark" | "light") => {
      document.documentElement.setAttribute("data-theme", resolved);
      // Update <meta name="theme-color"> so iOS Safari address bar matches.
      const metaTag = document.querySelector(
        'meta[name="theme-color"]',
      ) as HTMLMetaElement | null;
      if (metaTag) {
        metaTag.content = resolved === "light" ? "#f4f6fb" : "#04060d";
      }
    };

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: light)");
      apply(mq.matches ? "light" : "dark");
      const handler = (e: MediaQueryListEvent) =>
        apply(e.matches ? "light" : "dark");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
    apply(theme);
  }, [theme]);

  return null;
}
