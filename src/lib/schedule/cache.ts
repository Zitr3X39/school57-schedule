/**
 * Tiny in-memory TTL cache for parsed schedules. Survives across requests in
 * the same Next.js server process; bounded in size to avoid memory bloat.
 */

interface Entry<V> {
  value: V;
  expiresAt: number;
}

export class TTLCache<V> {
  private readonly store = new Map<string, Entry<V>>();
  private readonly capacity: number;

  constructor(capacity = 200) {
    this.capacity = capacity;
  }

  get(key: string): V | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: V, ttlSeconds: number): void {
    if (this.store.size >= this.capacity) {
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) this.store.delete(firstKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }
}

// Module-level singletons, intentionally simple.
import type { SchoolClassesIndex, WeekSchedule } from "./types";

export const scheduleCache = new TTLCache<WeekSchedule>();
export const classesCache = new TTLCache<SchoolClassesIndex>();
