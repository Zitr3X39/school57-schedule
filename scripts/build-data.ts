/**
 * Build-time data generation for static-export deployments (GitHub Pages).
 *
 * Produces:
 *   public/data/index.json                — classes index
 *   public/data/schedule/<class>.json     — per-class week schedule
 *
 * In FIXTURE_MODE (default in CI/Pages), uses bundled HTML fixtures.
 * For classes without a dedicated fixture, falls back to the closest fixture
 * (10Д for middle/high school, 4А for primary) and substitutes the class name
 * so the UI shows real-looking demo data.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { parseIndexPage } from "../src/lib/schedule/parser/index-page";
import { parseClassPage } from "../src/lib/schedule/parser/class-page";
import { applyReplacements } from "../src/lib/schedule/normalizer";
import { validateSchedule } from "../src/lib/schedule/validator";
import type { SchoolClassesIndex, WeekSchedule } from "../src/lib/schedule/types";

const root = path.resolve(__dirname, "..");
const FIXTURE_DIR = path.join(root, "fixtures");
const OUT_DIR = path.join(root, "public", "data");

interface ScheduleFile {
  schedule: WeekSchedule;
  source: { url: string; fromFixture: boolean };
  isDemoData: boolean;
}

interface IndexFile extends SchoolClassesIndex {
  source: { url: string; fromFixture: boolean };
  classesWithRealData: string[];
}

async function readFixture(name: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(FIXTURE_DIR, name), "utf8");
  } catch {
    return null;
  }
}

function pickFixtureForClass(className: string): string {
  // Map of class → fixture file with real data.
  const real: Record<string, string> = {
    "4А": "class-4A.html",
    "10Д": "class-10D.html",
    "11Д": "class-11D.html",
  };
  if (real[className]) return real[className];
  // Fallback heuristic: primary classes use 4А fixture, others use 10Д.
  const grade = parseInt(className.match(/^\d+/)?.[0] ?? "0", 10);
  if (grade <= 4) return "class-4A.html";
  return "class-10D.html";
}

async function main() {
  console.log("[build-data] starting");
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(path.join(OUT_DIR, "schedule"), { recursive: true });

  // Index
  const indexHtml = await readFixture("index.html");
  if (!indexHtml) {
    throw new Error("fixtures/index.html not found");
  }
  const idx = parseIndexPage(indexHtml);
  const realDataClasses = new Set(["4А", "10Д", "11Д"]);
  const indexOutput: IndexFile = {
    ...idx,
    source: {
      url: `https://keo.gov39.ru/data/schedule/klgd1548141601`,
      fromFixture: true,
    },
    classesWithRealData: Array.from(realDataClasses),
  };
  await fs.writeFile(
    path.join(OUT_DIR, "index.json"),
    JSON.stringify(indexOutput, null, 2),
    "utf8",
  );
  console.log(
    `[build-data] wrote index.json — ${idx.allClasses.length} classes (real fixtures: ${[...realDataClasses].join(", ")})`,
  );

  // Per-class schedules
  let written = 0;
  for (const className of idx.allClasses) {
    const fixture = pickFixtureForClass(className);
    const html = await readFixture(fixture);
    if (!html) continue;
    const parsed = parseClassPage({
      html,
      className,
      sourceUrl: `https://keo.gov39.ru/data/schedule/klgd1548141601/class.php?class=${encodeURIComponent(className)}&school_uid=klgd1548141601`,
    });
    const withReplacements = applyReplacements(parsed.schedule);
    const validated = validateSchedule(withReplacements, parsed.report);
    const isDemo = !realDataClasses.has(className);
    const out: ScheduleFile = {
      schedule: validated.schedule,
      source: {
        url: validated.schedule.sourceUrl ?? "",
        fromFixture: true,
      },
      isDemoData: isDemo,
    };
    const filename = `${className}.json`;
    await fs.writeFile(
      path.join(OUT_DIR, "schedule", filename),
      JSON.stringify(out, null, 2),
      "utf8",
    );
    written++;
  }
  console.log(`[build-data] wrote ${written} schedule files`);
  console.log("[build-data] done");
}

main().catch((err) => {
  console.error("[build-data] failed:", err);
  process.exit(1);
});
