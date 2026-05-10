import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Add a soft animated glow halo behind the card. */
  glow?: boolean;
  /** Apply an inner gradient highlight. */
  highlight?: boolean;
  /** Use the strong (more opaque) glass variant. */
  strong?: boolean;
  as?: "div" | "section" | "article";
}

export function GlassCard({
  children,
  className,
  glow = false,
  highlight = false,
  strong = false,
  as: Tag = "div",
}: GlassCardProps) {
  return (
    <Tag
      className={cn(
        "glass overflow-hidden",
        strong && "glass--strong",
        glow && "glass--glow",
        className,
      )}
    >
      {highlight && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_0%_0%,color-mix(in_oklab,var(--color-accent)_18%,transparent),transparent_60%),radial-gradient(80%_60%_at_100%_100%,color-mix(in_oklab,var(--color-accent-2)_15%,transparent),transparent_60%)]"
        />
      )}
      <div className="relative">{children}</div>
    </Tag>
  );
}
