"use client";

import { useSyncExternalStore } from "react";

/**
 * Returns a Date that updates every `intervalMs` ms while the document is
 * visible. Implemented via `useSyncExternalStore` so React doesn't warn about
 * setState-in-effect cascades.
 *
 * On the server snapshot we return `null`-equivalent epoch so SSR-sensitive
 * children must guard with `suppressHydrationWarning` — see Hero / TopBar.
 */
export function useNow(intervalMs = 30_000): Date {
  const ms = useSyncExternalStore(
    (rerender) => subscribe(rerender, intervalMs),
    () => snapshotMs,
    () => 0,
  );
  return new Date(ms);
}

let snapshotMs = typeof window === "undefined" ? 0 : Date.now();

type Listener = () => void;
const listeners = new Set<Listener>();
let timer: ReturnType<typeof setInterval> | null = null;
let lastInterval = 0;
let visListener: (() => void) | null = null;

function subscribe(rerender: Listener, intervalMs: number): () => void {
  if (typeof window === "undefined") return () => undefined;
  listeners.add(rerender);
  // Refresh snapshot synchronously so first client render is fresh.
  snapshotMs = Date.now();
  if (lastInterval !== intervalMs || !timer) {
    if (timer) clearInterval(timer);
    lastInterval = intervalMs;
    timer = setInterval(tick, intervalMs);
    if (!visListener) {
      visListener = () => {
        if (document.visibilityState === "visible") tick();
      };
      document.addEventListener("visibilitychange", visListener);
    }
  }
  return () => {
    listeners.delete(rerender);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
      if (visListener) {
        document.removeEventListener("visibilitychange", visListener);
        visListener = null;
      }
    }
  };
}

function tick() {
  snapshotMs = Date.now();
  for (const l of Array.from(listeners)) l();
}
