import { promises as fs } from "node:fs";
import path from "node:path";
import { parseIndexPage } from "../src/lib/schedule/parser/index-page";
import { parseClassPage } from "../src/lib/schedule/parser/class-page";
import { applyReplacements } from "../src/lib/schedule/normalizer";
import { validateSchedule } from "../src/lib/schedule/validator";

const root = path.resolve(__dirname, "..");

async function main() {
  const indexHtml = await fs.readFile(path.join(root, "fixtures/index.html"), "utf8");
  const idx = parseIndexPage(indexHtml);
  console.log("---- INDEX ----");
  console.log(`school: ${idx.schoolName}`);
  console.log(`groups: ${idx.groups.length}`);
  console.log(`classes: ${idx.allClasses.length}`);
  if (idx.allClasses.length < 50) {
    process.exitCode = 1;
    console.error("Expected >= 50 classes, parser failed");
  }

  const samples: Array<[string, string]> = [
    ["4А", "class-4A.html"],
    ["10Д", "class-10D.html"],
    ["11Д", "class-11D.html"],
  ];

  for (const [name, file] of samples) {
    const html = await fs.readFile(path.join(root, "fixtures", file), "utf8");
    const { schedule, report } = parseClassPage({ html, className: name });
    const withReplacements = applyReplacements(schedule);
    const validated = validateSchedule(withReplacements, report);
    console.log(`---- CLASS ${name} ----`);
    console.log(`  weekId: ${validated.schedule.weekId} (${validated.schedule.weekStart} -> ${validated.schedule.weekEnd})`);
    console.log(`  prev/next: ${validated.schedule.prevWeekId}/${validated.schedule.nextWeekId}`);
    console.log(`  days: ${validated.schedule.days.length}`);
    for (const d of validated.schedule.days) {
      const grouped = d.lessons.filter((l) => l.group !== null).length;
      const replaced = d.lessons.filter((l) => l.isReplacement).length;
      console.log(`    ${d.date} ${d.dayOfWeek}: lessons=${d.lessons.length} (group=${grouped}, replaced=${replaced})`);
      for (const l of d.lessons) {
        const grp = l.group ? ` g${l.group}` : "";
        const rep = l.isReplacement ? " *REPLACED*" : "";
        console.log(`      [${l.lessonNumber}${grp}] ${l.startTime}-${l.endTime} ${l.subject} | ${l.teacher ?? "-"} | ${l.room ?? "-"}${rep}`);
      }
    }
    console.log(`  replacements: ${validated.schedule.replacements.length}`);
    for (const r of validated.schedule.replacements) {
      console.log(`    ${r.date}: ${r.fromSubject} -> ${r.toSubject}`);
    }
    console.log(`  ok=${validated.report.ok} warnings=${validated.report.warnings.length} errors=${validated.report.errors.length}`);
    if (!validated.report.ok) {
      process.exitCode = 1;
      console.error(`  ERRORS:`, validated.report.errors);
    }
  }

  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
