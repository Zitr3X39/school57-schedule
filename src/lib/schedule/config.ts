/**
 * Configuration for the school-schedule app. The school UID is hard-coded as
 * the project is built specifically for МАОУ СОШ №57 г.Калининград.
 *
 * SCHEDULE_FIXTURE_MODE=1 forces the fetcher to use bundled fixtures (used in
 * environments without access to the source site).
 */

export const SCHOOL_UID = "klgd1548141601";
export const SCHOOL_NAME = "МАОУ СОШ №57 в г.Калининград";
export const SCHOOL_NAME_SHORT = "СОШ №57";

export const SOURCE_BASE_URL =
  `https://keo.gov39.ru/data/schedule/${SCHOOL_UID}`;

export const SOURCE_INDEX_URL =
  `${SOURCE_BASE_URL}/index.php?school_uid=${SCHOOL_UID}`;

export function classPageUrl(className: string, weekId?: string): string {
  const params = new URLSearchParams();
  params.set("class", className);
  if (weekId) params.set("week", weekId);
  params.set("school_uid", SCHOOL_UID);
  return `${SOURCE_BASE_URL}/class.php?${params.toString()}`;
}

export const FIXTURE_MODE: boolean =
  process.env.SCHEDULE_FIXTURE_MODE === "1" ||
  process.env.SCHEDULE_FIXTURE_MODE === "true";

/** TTL for the in-memory schedule cache, in seconds. */
export const SCHEDULE_TTL_SECONDS = 5 * 60;
/** TTL for the classes index cache, in seconds. */
export const CLASSES_TTL_SECONDS = 60 * 60;
