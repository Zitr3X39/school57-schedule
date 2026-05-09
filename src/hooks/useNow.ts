"use client";

import { useSyncExternalStore } from "react";

/**
 * Returns a Date that updates every 15s while the document is visible.
 *
 * Implemented via a module-level external store + a single stable
 * `useSyncExternalStore` subscribe function. Don't mutate `snapshotMs`
 * inside `subscribe` — that creates a feedback loop where the post-subscribe
 * snapshot read returns a new value, triggers re-render, re-subscribes, etc.
 *
 * The optional `intervalMs` is accepted for backwards compatibility but
 * ignored: a single global timer feeds all subscribers, which is enough for
 * a schedule UI.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useNow(_intervalMs?: number): Date {
  const ms = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return new Date(ms);
}

let snapshotMs: number = typeof window === "undefined" ? 0 : Date.now();
const TICK_MS = 15_000;

type Listener = () => void;
const listeners = new Set<Listener>();
let timer: ReturnType<typeof setInterval> | null = null;
let visListener: (() => void) | null = null;

function tick() {
  snapshotMs = Date.now();
  for (const l of Array.from(listeners)) l();
}

function startTimer() {
  if (timer || typeof window === "undefined") return;
  // Refresh once when timer starts so first paint after hydrate is fresh.
  // (Safe — happens before any subscriber's render reads the snapshot.)
  if (snapshotMs === 0) snapshotMs = Date.now();
  timer = setInterval(tick, TICK_MS);
  visListener = () => {
    if (document.visibilityState === "visible") tick();
  };
  document.addEventListener("visibilitychange", visListener);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (visListener) {
    document.removeEventListener("visibilitychange", visListener);
    visListener = null;
  }
}

// Stable subscribe — same reference across renders so React doesn't unsubscribe
// and resubscribe on every render.
function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  startTimer();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stopTimer();
  };
}

function getSnapshot(): number {
  return snapshotMs;
}

function getServerSnapshot(): number {
  return 0;
}
