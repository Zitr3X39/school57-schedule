import * as cheerio from "cheerio";
import { createLogger } from "../logger";
import { SCHOOL_NAME, SCHOOL_UID, SOURCE_INDEX_URL } from "../config";
import type { ClassGroup, SchoolClassesIndex } from "../types";

const log = createLogger("parser:index");

/**
 * Parse the index page (list of all classes for a school).
 *
 * The page is grouped under headings like "Начальная школа", "Основная школа",
 * "Старшая школа", and the class names are inside `<a class="border" …>`
 * links. We are deliberately lenient about exact heading wording — if the
 * primary selector strategy fails we fall back to extracting all anchors that
 * point to `class.php`.
 */
export function parseIndexPage(html: string): SchoolClassesIndex {
  const $ = cheerio.load(html);

  const groups: ClassGroup[] = [];

  // --- Strategy A: structured headings + class lists ---------------------
  $(".pagecontent h3").each((_, el) => {
    const heading = $(el).text().trim();
    if (!heading) return;
    // Find the next `ul.shedule__classes` after this heading.
    let ul = $(el).next();
    while (ul.length && !ul.hasClass("shedule__classes") && ul.find("ul.shedule__classes").length === 0) {
      ul = ul.next();
      if (!ul.length) break;
    }
    if (!ul.length) return;
    const list = ul.hasClass("shedule__classes") ? ul : ul.find("ul.shedule__classes").first();
    const classes: string[] = [];
    list.find("a").each((_i, a) => {
      const name = normalizeClassName($(a).text());
      if (name) classes.push(name);
    });
    if (classes.length > 0) {
      groups.push({ heading, classes });
    }
  });

  // --- Strategy B: fallback — extract all class.php links ----------------
  if (groups.length === 0) {
    log.warn("structured parse failed, falling back to link extraction");
    const allClasses: string[] = [];
    $('a[href*="class.php"]').each((_, a) => {
      const name = normalizeClassName($(a).text());
      if (name && !allClasses.includes(name)) allClasses.push(name);
    });
    if (allClasses.length > 0) {
      groups.push({ heading: "Все классы", classes: allClasses });
    }
  }

  const allClasses = dedupe(groups.flatMap((g) => g.classes));
  if (allClasses.length === 0) {
    log.error("index parse produced zero classes");
  } else {
    log.info("parsed classes index", {
      groups: groups.length,
      classes: allClasses.length,
    });
  }

  return {
    schoolName: extractSchoolName($) ?? SCHOOL_NAME,
    schoolUid: SCHOOL_UID,
    groups,
    allClasses,
    parsedAt: new Date().toISOString(),
    sourceType: "html",
    sourceUrl: SOURCE_INDEX_URL,
  };
}

function extractSchoolName($: cheerio.CheerioAPI): string | null {
  const liText = $(".breadcrumb li").first().text().trim();
  if (liText && liText.length > 3) return liText;
  return null;
}

function normalizeClassName(raw: string): string | null {
  const trimmed = raw.replace(/\s+/g, "").trim();
  if (!trimmed) return null;
  // Class names look like "1А", "10Д" (digits + 1 cyrillic letter).
  // We accept anything matching that loose pattern.
  if (!/^\d{1,2}[А-Яа-я]$/.test(trimmed)) return null;
  // Normalize cyrillic letter to upper case.
  return trimmed.replace(/[А-Яа-я]$/, (s) => s.toUpperCase());
}

function dedupe<T>(arr: T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const v of arr) {
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}
