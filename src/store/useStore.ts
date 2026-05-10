"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_BELL_SCHEDULE } from "@/lib/schedule/bell";
import type { BellSchedule } from "@/lib/schedule/types";

export type Theme = "system" | "dark" | "light";

interface State {
  selectedClass: string | null;
  group: 1 | 2;
  bell: BellSchedule;
  theme: Theme;
  hasOnboarded: boolean;
  /** Map of lesson IDs the user has marked as completed. */
  homeworkDone: Record<string, true>;
  setSelectedClass: (className: string) => void;
  setGroup: (g: 1 | 2) => void;
  setBell: (b: BellSchedule) => void;
  setTheme: (t: Theme) => void;
  completeOnboarding: () => void;
  resetClass: () => void;
  toggleHomework: (lessonId: string) => void;
  clearHomeworkOlderThan: (isoDateInclusive: string) => void;
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      selectedClass: null,
      group: 1,
      bell: DEFAULT_BELL_SCHEDULE,
      theme: "dark",
      hasOnboarded: false,
      homeworkDone: {},
      setSelectedClass: (className) =>
        set({ selectedClass: className, hasOnboarded: true }),
      setGroup: (group) => set({ group }),
      setBell: (bell) => set({ bell }),
      setTheme: (theme) => set({ theme }),
      completeOnboarding: () => set({ hasOnboarded: true }),
      resetClass: () =>
        set({ selectedClass: null, hasOnboarded: false }),
      toggleHomework: (lessonId) =>
        set((s) => {
          const next = { ...s.homeworkDone };
          if (next[lessonId]) {
            delete next[lessonId];
          } else {
            next[lessonId] = true;
          }
          return { homeworkDone: next };
        }),
      clearHomeworkOlderThan: (cutoff) =>
        set((s) => {
          // Lesson IDs from the parser embed the date as YYYY-MM-DD; if a
          // lesson id contains a date earlier than `cutoff`, drop it. This
          // keeps the homework map from growing forever across years.
          const next: Record<string, true> = {};
          for (const id of Object.keys(s.homeworkDone)) {
            const m = id.match(/(\d{4}-\d{2}-\d{2})/);
            if (!m || m[1] >= cutoff) next[id] = true;
          }
          return { homeworkDone: next };
        }),
    }),
    {
      name: "sosh57-state",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted, version) => {
        // v1 -> v2 added homeworkDone. Just default it to {}.
        const p = (persisted as Partial<State>) ?? {};
        if (version < 2) {
          return { ...p, homeworkDone: p.homeworkDone ?? {} } as State;
        }
        return p as State;
      },
    },
  ),
);
