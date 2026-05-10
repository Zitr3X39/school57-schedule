/**
 * Build-time data generation for static-export deployments (GitHub Pages).
 *
 * Reads HTML bundles from `fixtures/bundles/bundle-<weekId>.json` (each bundle
 * is a snapshot of all class HTML pages for one school week, captured by the
 * scrape-school57.js script running in a real Russian browser session).
 *
 * Produces:
 *   public/data/index.json                                    — classes index
 *   public/data/weeks.json                                    — weeks meta
 *   public/data/schedule/<class>/<weekId>.json                — per-week, per-class
 *
 * If no bundles are present, falls back to legacy single-class HTML fixtures
 * (`fixtures/class-*.html`) so older dev / CI environments still build.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { parseIndexPage } from "../src/lib/schedule/parser/index-page";
import { parseClassPage } from "../src/lib/schedule/parser/class-page";
import { applyReplacements } from "../src/lib/schedule/normalizer";
import { fillClassroomHourGaps } from "../src/lib/schedule/homeroom";
import { validateSchedule } from "../src/lib/schedule/validator";
import type {
  SchoolClassesIndex,
  WeekSchedule,
} from "../src/lib/schedule/types";

const root = path.resolve(__dirname, "..");
const FIXTURE_DIR = path.join(root, "fixtures");
const BUNDLE_DIR = path.join(FIXTURE_DIR, "bundles");
const OUT_DIR = path.join(root, "public", "data");
const SCHOOL_UID = "klgd1548141601";
const SOURCE_BASE = `https://keo.gov39.ru/data/schedule/${SCHOOL_UID}`;

interface ScheduleFile {
  schedule: WeekSchedule;
  source: { url: string; fromFixture: boolean };
  isDemoData: boolean;
}

interface IndexFile extends SchoolClassesIndex {
  source: { url: string; fromFixture: boolean };
  classesWithRealData: string[];
}

interface WeekMetaEntry {
  weekId: string;
  weekStart: string;
  weekEnd: string;
}
interface WeeksMetaFile {
  current: string;
  available: string[];
  byWeekId: Record<string, WeekMetaEntry>;
}

interface BundleFile {
  school_uid: string;
  sourceUrl: string;
  week: string;
  tag: string;
  capturedAt: string;
  stats?: { ok: number; fail: number; total: number };
  indexHtml: string;
  classes: Record<string, string | null>;
}

async function readFixture(name: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(FIXTURE_DIR, name), "utf8");
  } catch {
    return null;
  }
}

async function readBundles(): Promise<BundleFile[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(BUNDLE_DIR);
  } catch {
    return [];
  }
  const bundles: BundleFile[] = [];
  for (const name of entries) {
    if (!name.endsWith(".json")) continue;
    const txt = await fs.readFile(path.join(BUNDLE_DIR, name), "utf8");
    const parsed = JSON.parse(txt) as BundleFile;
    bundles.push(parsed);
  }
  return bundles;
}

function classPageUrl(className: string, weekId: string | null): string {
  const params = new URLSearchParams({
    class: className,
    school_uid: SCHOOL_UID,
  });
  if (weekId) params.set("week", weekId);
  return `${SOURCE_BASE}/class.php?${params}`;
}

function pickFixtureForClass(className: string): string {
  const grade = parseInt(className.match(/^\d+/)?.[0] ?? "0", 10);
  if (grade <= 4) return "class-4A.html";
  return "class-10D.html";
}

function isoMondayOf(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay(); // 0=Sun..6=Sat
  const delta = dow === 0 ? -6 : 1 - dow;
  dt.setUTCDate(dt.getUTCDate() + delta);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

function todayIsoKaliningrad(): string {
  // Europe/Kaliningrad is UTC+2 (no DST).
  const now = new Date();
  const utcMs = now.getTime();
  const k = new Date(utcMs + 2 * 60 * 60 * 1000);
  const y = k.getUTCFullYear();
  const m = String(k.getUTCMonth() + 1).padStart(2, "0");
  const d = String(k.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function processBundle(
  bundle: BundleFile,
  realDataClasses: Set<string>,
): Promise<{ weekId: string; weekStart: string; weekEnd: string } | null> {
  // Pick a sample class to discover the bundle's actual weekId after parsing.
  // Because the school site sometimes returns a different week than requested
  // when the requested one is out of range — we trust whatever the parser found.
  const className = Object.keys(bundle.classes)[0];
  if (!className) return null;
  const sampleHtml = bundle.classes[className];
  if (!sampleHtml) return null;
  const sample = parseClassPage({
    html: sampleHtml,
    className,
    sourceUrl: classPageUrl(className, bundle.week || null),
  });
  const weekId = sample.schedule.weekId;
  const weekStart = sample.schedule.weekStart;
  const weekEnd = sample.schedule.weekEnd;
  if (!weekId) return null;

  const dir = path.join(OUT_DIR, "schedule", "weeks", weekId);
  await fs.mkdir(dir, { recursive: true });

  let written = 0;
  for (const [name, html] of Object.entries(bundle.classes)) {
    if (!html) continue;
    const parsed = parseClassPage({
      html,
      className: name,
      sourceUrl: classPageUrl(name, bundle.week || null),
    });
    const withReplacements = applyReplacements(parsed.schedule);
    const withClassroomHours = fillClassroomHourGaps(withReplacements);
    const validated = validateSchedule(withClassroomHours, parsed.report);
    const out: ScheduleFile = {
      schedule: validated.schedule,
      source: {
        url: validated.schedule.sourceUrl ?? "",
        fromFixture: true,
      },
      isDemoData: false,
    };
    realDataClasses.add(name);
    const filename = `${name}.json`;
    await fs.writeFile(path.join(dir, filename), JSON.stringify(out, null, 2), "utf8");
    written++;
  }
  console.log(
    `[build-data] week ${weekId} (${weekStart}…${weekEnd}): ${written} classes written`,
  );
  return { weekId, weekStart, weekEnd };
}

async function processLegacyFallback(
  classNames: string[],
  realDataClasses: Set<string>,
): Promise<{ weekId: string; weekStart: string; weekEnd: string } | null> {
  // Fallback path for environments without bundles: use single-week HTML
  // fixtures (class-*.html). Same behaviour as the original build-data.ts.
  const sampleHtml = await readFixture("class-10D.html");
  if (!sampleHtml) return null;
  const sample = parseClassPage({ html: sampleHtml, className: "10Д" });
  const weekId = sample.schedule.weekId;
  if (!weekId) return null;
  const dir = path.join(OUT_DIR, "schedule", "weeks", weekId);
  await fs.mkdir(dir, { recursive: true });
  const realFromFixtures: Record<string, string> = {
    "4А": "class-4A.html",
    "10Д": "class-10D.html",
    "11Д": "class-11D.html",
  };
  let written = 0;
  for (const className of classNames) {
    const fixture = realFromFixtures[className] ?? pickFixtureForClass(className);
    const html = await readFixture(fixture);
    if (!html) continue;
    const parsed = parseClassPage({
      html,
      className,
      sourceUrl: classPageUrl(className, null),
    });
    const withReplacements = applyReplacements(parsed.schedule);
    const withClassroomHours = fillClassroomHourGaps(withReplacements);
    const validated = validateSchedule(withClassroomHours, parsed.report);
    const isDemo = !(className in realFromFixtures);
    const out: ScheduleFile = {
      schedule: validated.schedule,
      source: {
        url: validated.schedule.sourceUrl ?? "",
        fromFixture: true,
      },
      isDemoData: isDemo,
    };
    if (!isDemo) realDataClasses.add(className);
    await fs.writeFile(
      path.join(dir, `${className}.json`),
      JSON.stringify(out, null, 2),
      "utf8",
    );
    written++;
  }
  console.log(`[build-data] legacy fallback: week ${weekId}, ${written} classes`);
  return {
    weekId,
    weekStart: sample.schedule.weekStart,
    weekEnd: sample.schedule.weekEnd,
  };
}

async function main() {
  console.log("[build-data] starting");
  await fs.mkdir(OUT_DIR, { recursive: true });
  // Clean previous weekly output
  const oldDir = path.join(OUT_DIR, "schedule");
  await fs.rm(oldDir, { recursive: true, force: true });
  await fs.mkdir(path.join(OUT_DIR, "schedule", "weeks"), { recursive: true });

  // 1) Index.json — read from the most recent bundle's index, or legacy fixture
  const bundles = await readBundles();
  let indexHtml: string;
  if (bundles.length > 0) {
    indexHtml = bundles[0].indexHtml;
  } else {
    const legacy = await readFixture("index.html");
    if (!legacy) throw new Error("no bundles and no fixtures/index.html");
    indexHtml = legacy;
  }
  const idx = parseIndexPage(indexHtml);
  const realDataClasses = new Set<string>();

  // 2) Per-week schedules
  const weeks: WeekMetaEntry[] = [];
  if (bundles.length > 0) {
    // Sort bundles by their explicit `week` tag (current first via empty string heuristic)
    bundles.sort((a, b) => {
      const aw = a.week || "00000000";
      const bw = b.week || "00000000";
      return aw.localeCompare(bw);
    });
    for (const bundle of bundles) {
      const meta = await processBundle(bundle, realDataClasses);
      if (meta) weeks.push(meta);
    }
  } else {
    const meta = await processLegacyFallback(idx.allClasses, realDataClasses);
    if (meta) weeks.push(meta);
  }

  if (weeks.length === 0) {
    throw new Error("no weeks parsed — check fixtures/ and bundles/");
  }

  // 3) Compute "current" weekId by today's date in school timezone
  const todayIso = todayIsoKaliningrad();
  const todayMonday = isoMondayOf(todayIso);
  const sortedAvail = weeks.map((w) => w.weekId).sort();
  let current = sortedAvail.includes(todayMonday) ? todayMonday : "";
  if (!current) {
    // pick the closest available week (prefer past, fall back to future)
    const past = sortedAvail.filter((w) => w <= todayMonday).pop();
    const future = sortedAvail.find((w) => w >= todayMonday);
    current = past ?? future ?? sortedAvail[0];
  }

  const weeksMeta: WeeksMetaFile = {
    current,
    available: sortedAvail,
    byWeekId: Object.fromEntries(weeks.map((w) => [w.weekId, w])),
  };
  await fs.writeFile(
    path.join(OUT_DIR, "weeks.json"),
    JSON.stringify(weeksMeta, null, 2),
    "utf8",
  );
  console.log(
    `[build-data] weeks.json — current=${current}, available=${sortedAvail.join(",")}`,
  );

  // 4) index.json
  const indexOutput: IndexFile = {
    ...idx,
    source: { url: SOURCE_BASE, fromFixture: bundles.length === 0 },
    classesWithRealData: Array.from(realDataClasses).sort(),
  };
  await fs.writeFile(
    path.join(OUT_DIR, "index.json"),
    JSON.stringify(indexOutput, null, 2),
    "utf8",
  );
  console.log(
    `[build-data] index.json — ${idx.allClasses.length} classes (real: ${realDataClasses.size})`,
  );
  console.log("[build-data] done");
}

main().catch((err) => {
  console.error("[build-data] failed:", err);
  process.exit(1);
});
