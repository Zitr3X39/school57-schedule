"use client";

import { GlassCard } from "./GlassCard";

export function LoadingShell() {
  return (
    <div className="space-y-6">
      <GlassCard className="p-6 md:p-9">
        <div className="space-y-3">
          <div className="shimmer h-3 w-32 rounded-full bg-white/8" />
          <div className="shimmer h-12 w-44 rounded-xl bg-white/8" />
          <div className="grid gap-4 md:grid-cols-[1.4fr_1fr] mt-6">
            <div className="shimmer h-40 rounded-2xl bg-white/8" />
            <div className="shimmer h-40 rounded-2xl bg-white/6" />
          </div>
        </div>
      </GlassCard>
      <GlassCard className="p-6">
        <div className="space-y-3">
          <div className="shimmer h-7 w-32 rounded-md bg-white/8" />
          <div className="space-y-2 mt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shimmer h-14 rounded-2xl bg-white/6" />
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
