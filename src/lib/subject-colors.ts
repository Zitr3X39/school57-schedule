/**
 * Stable subject → colour mapping. Hashes the subject name into a curated
 * palette so the same subject always gets the same hue across the UI.
 *
 * The palette is hand-tuned to look good on both dark and light themes.
 * Returns OKLCH-compatible hex strings + matching ultra-soft "fade" stops
 * for use in radial gradients on lesson cards.
 */

interface SubjectColor {
  /** Solid line / pin / dot colour. */
  solid: string;
  /** Soft alpha-tinted stop, used in card backgrounds (light enough for dark theme). */
  fade: string;
  /** Saturated 2-stop gradient string, e.g. for analytics bars. */
  gradient: string;
}

// Curated palette. Order matters because subjects index into it via hash mod N.
const PALETTE: ReadonlyArray<SubjectColor> = [
  { solid: "#5eead4", fade: "rgba(94,234,212,0.18)", gradient: "linear-gradient(135deg,#5eead4,#22d3ee)" },
  { solid: "#a78bfa", fade: "rgba(167,139,250,0.18)", gradient: "linear-gradient(135deg,#a78bfa,#c084fc)" },
  { solid: "#38bdf8", fade: "rgba(56,189,248,0.18)", gradient: "linear-gradient(135deg,#38bdf8,#60a5fa)" },
  { solid: "#f472b6", fade: "rgba(244,114,182,0.18)", gradient: "linear-gradient(135deg,#f472b6,#fb7185)" },
  { solid: "#34d399", fade: "rgba(52,211,153,0.20)", gradient: "linear-gradient(135deg,#34d399,#10b981)" },
  { solid: "#fb923c", fade: "rgba(251,146,60,0.18)", gradient: "linear-gradient(135deg,#fb923c,#fbbf24)" },
  { solid: "#fbbf24", fade: "rgba(251,191,36,0.20)", gradient: "linear-gradient(135deg,#fbbf24,#facc15)" },
  { solid: "#818cf8", fade: "rgba(129,140,248,0.18)", gradient: "linear-gradient(135deg,#818cf8,#6366f1)" },
  { solid: "#22d3ee", fade: "rgba(34,211,238,0.18)", gradient: "linear-gradient(135deg,#22d3ee,#06b6d4)" },
  { solid: "#fb7185", fade: "rgba(251,113,133,0.18)", gradient: "linear-gradient(135deg,#fb7185,#ef4444)" },
  { solid: "#84cc16", fade: "rgba(132,204,22,0.20)", gradient: "linear-gradient(135deg,#84cc16,#65a30d)" },
  { solid: "#e879f9", fade: "rgba(232,121,249,0.18)", gradient: "linear-gradient(135deg,#e879f9,#d946ef)" },
];

// Cheap, deterministic string hash (DJB2-style).
function hash(s: string): number {
  let h = 5381;
  // Normalize so casing / extra whitespace don't matter.
  const norm = s.trim().toLowerCase().replace(/\s+/g, " ");
  for (let i = 0; i < norm.length; i++) {
    h = (h * 33) ^ norm.charCodeAt(i);
  }
  return Math.abs(h);
}

const cache = new Map<string, SubjectColor>();

export function subjectGradient(subject: string): SubjectColor {
  const cached = cache.get(subject);
  if (cached) return cached;
  const idx = hash(subject) % PALETTE.length;
  const color = PALETTE[idx];
  cache.set(subject, color);
  return color;
}
