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
  setSelectedClass: (className: string) => void;
  setGroup: (g: 1 | 2) => void;
  setBell: (b: BellSchedule) => void;
  setTheme: (t: Theme) => void;
  completeOnboarding: () => void;
  resetClass: () => void;
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      selectedClass: null,
      group: 1,
      bell: DEFAULT_BELL_SCHEDULE,
      theme: "dark",
      hasOnboarded: false,
      setSelectedClass: (className) =>
        set({ selectedClass: className, hasOnboarded: true }),
      setGroup: (group) => set({ group }),
      setBell: (bell) => set({ bell }),
      setTheme: (theme) => set({ theme }),
      completeOnboarding: () => set({ hasOnboarded: true }),
      resetClass: () =>
        set({ selectedClass: null, hasOnboarded: false }),
    }),
    {
      name: "sosh57-state",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
