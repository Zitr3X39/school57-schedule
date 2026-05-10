/**
 * Calendar helpers for week navigation + Russian school vacation detection.
 */

export type IsoDate = string; // YYYY-MM-DD

/** Russian school vacation classifier (heuristic — most schools follow this). */
export type VacationKind = "summer" | "winter" | "spring" | "autumn" | null;

/** Add `days` to an ISO date, returning a new ISO date. UTC arithmetic. */
export function shiftIsoDate(iso: IsoDate, days: number): IsoDate {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Monday of the ISO week that contains `iso`. */
export function isoMondayOf(iso: IsoDate): IsoDate {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay(); // 0 Sun .. 6 Sat
  const delta = day === 0 ? -6 : 1 - day;
  return shiftIsoDate(iso, delta);
}

export interface WeekRange {
  weekStart: IsoDate; // Monday
  weekEnd: IsoDate; // Sunday
}

/** Return the [Monday, Sunday] range for the week containing `iso`. */
export function weekRangeOf(iso: IsoDate): WeekRange {
  const weekStart = isoMondayOf(iso);
  return { weekStart, weekEnd: shiftIsoDate(weekStart, 6) };
}

/**
 * Classify the school vacation that contains the week starting at `weekStart`.
 * Heuristic for МАОУ СОШ №57 (typical Russian secondary-school calendar).
 * Returns `null` for normal study weeks.
 */
export function classifyVacationWeek(weekStart: IsoDate): VacationKind {
  const [, m, d] = weekStart.split("-").map(Number);
  // Summer: Jun 1 — Aug 31
  if (m >= 6 && m <= 8) return "summer";
  // Winter: Dec 28 — Jan 8 (the school week containing New Year)
  if (m === 12 && d >= 25) return "winter";
  if (m === 1 && d <= 8) return "winter";
  // Spring: typically the week starting around Mar 23-30
  if (m === 3 && d >= 22 && d <= 31) return "spring";
  // Autumn: typically the week starting around Oct 27 - Nov 3
  if ((m === 10 && d >= 26) || (m === 11 && d <= 3)) return "autumn";
  return null;
}

const VACATION_LABELS: Record<Exclude<VacationKind, null>, string> = {
  summer: "Летние каникулы",
  winter: "Зимние каникулы",
  spring: "Весенние каникулы",
  autumn: "Осенние каникулы",
};

const VACATION_EMOJI: Record<Exclude<VacationKind, null>, string> = {
  summer: "🏖️",
  winter: "❄️",
  spring: "🌷",
  autumn: "🍂",
};

export function vacationLabel(kind: Exclude<VacationKind, null>): string {
  return VACATION_LABELS[kind];
}

export function vacationEmoji(kind: Exclude<VacationKind, null>): string {
  return VACATION_EMOJI[kind];
}

/** Compare two ISO dates as strings (works because YYYY-MM-DD is lex-sortable). */
export function isoDateInRange(iso: IsoDate, range: WeekRange): boolean {
  return iso >= range.weekStart && iso <= range.weekEnd;
}

/** Convert ISO date "YYYY-MM-DD" to weekId-style "YYYYMMDD". */
export function isoToWeekId(iso: IsoDate): string {
  return iso.replace(/-/g, "");
}

/** Convert weekId "YYYYMMDD" to ISO date "YYYY-MM-DD". */
export function weekIdToIso(weekId: string): IsoDate {
  return `${weekId.slice(0, 4)}-${weekId.slice(4, 6)}-${weekId.slice(6, 8)}`;
}

/** Format a Russian date range like "4 — 10 мая 2026". */
export function formatWeekRangeRu(range: WeekRange): string {
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ];
  const [, sm, sd] = range.weekStart.split("-").map(Number);
  const [ey, em, ed] = range.weekEnd.split("-").map(Number);
  if (sm === em) {
    return `${sd} — ${ed} ${months[em - 1]} ${ey}`;
  }
  return `${sd} ${months[sm - 1]} — ${ed} ${months[em - 1]} ${ey}`;
}
