import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Add a soft animated glow halo behind the card. */
  glow?: boolean;
  /** Apply an inner gradient highlight. */
  highlight?: boolean;
  as?: "div" | "section" | "article";
}

export function GlassCard({
  children,
  className,
  glow = false,
  highlight = false,
  as: Tag = "div",
}: GlassCardProps) {
  return (
    <Tag
      className={cn(
        "relative rounded-3xl border border-white/8 bg-white/[0.04]",
        "backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_30px_60px_-30px_rgba(0,0,0,0.7)]",
        "overflow-hidden",
        className,
      )}
    >
      {highlight && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_0%_0%,rgba(94,234,212,0.07),transparent_60%),radial-gradient(80%_60%_at_100%_100%,rgba(167,139,250,0.06),transparent_60%)]"
        />
      )}
      {glow && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-3xl bg-[conic-gradient(from_180deg_at_50%_50%,rgba(94,234,212,0.0)_0deg,rgba(94,234,212,0.20)_60deg,rgba(167,139,250,0.20)_180deg,rgba(94,234,212,0.0)_300deg)] opacity-60 blur-[1px]"
        />
      )}
      <div className="relative">{children}</div>
    </Tag>
  );
}
