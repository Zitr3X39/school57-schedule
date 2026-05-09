import { promises as fs } from "node:fs";
import path from "node:path";
import { createLogger } from "./logger";
import { SOURCE_INDEX_URL, classPageUrl, FIXTURE_MODE } from "./config";

const log = createLogger("fetcher");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

const FETCH_TIMEOUT_MS = 12_000;
const MAX_ATTEMPTS = 3;

export interface FetchResult {
  url: string;
  html: string;
  fromFixture: boolean;
}

async function fetchOnce(url: string, signal: AbortSignal): Promise<string> {
  const res = await fetch(url, {
    signal,
    headers: {
      "User-Agent": USER_AGENT,
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
    },
    cache: "no-store",
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  }
  return await res.text();
}

async function withRetries(url: string): Promise<string> {
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
    try {
      const html = await fetchOnce(url, ctl.signal);
      clearTimeout(timer);
      return html;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      log.warn("fetch attempt failed", {
        attempt,
        url,
        error: (err as Error)?.message,
      });
      if (attempt < MAX_ATTEMPTS) {
        await delay(250 * attempt);
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("fetch failed");
}

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

const FIXTURE_DIR = path.join(process.cwd(), "fixtures");

async function readFixture(name: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(FIXTURE_DIR, name), "utf8");
  } catch {
    return null;
  }
}

function fixtureNameForClass(className: string): string {
  // Map a class like "10Д" → "class-10D.html". We have a small set of
  // canonical fixtures (4А, 10Д, 11Д). Anything else falls back to 10Д so the
  // UI works in fixture mode regardless of the user's chosen class.
  const map: Record<string, string> = {
    "4А": "class-4A.html",
    "10Д": "class-10D.html",
    "11Д": "class-11D.html",
  };
  return map[className] ?? "class-10D.html";
}

export async function fetchIndexPage(): Promise<FetchResult> {
  if (FIXTURE_MODE) {
    const html = await readFixture("index.html");
    if (html) {
      log.info("loaded index from fixture");
      return { url: SOURCE_INDEX_URL, html, fromFixture: true };
    }
  }
  try {
    const html = await withRetries(SOURCE_INDEX_URL);
    return { url: SOURCE_INDEX_URL, html, fromFixture: false };
  } catch (err) {
    log.error("live index fetch failed, falling back to fixture", {
      error: (err as Error)?.message,
    });
    const html = await readFixture("index.html");
    if (!html) throw err;
    return { url: SOURCE_INDEX_URL, html, fromFixture: true };
  }
}

export async function fetchClassPage(
  className: string,
  weekId?: string,
): Promise<FetchResult> {
  const url = classPageUrl(className, weekId);
  if (FIXTURE_MODE) {
    const html = await readFixture(fixtureNameForClass(className));
    if (html) {
      log.info("loaded class from fixture", { className });
      return { url, html, fromFixture: true };
    }
  }
  try {
    const html = await withRetries(url);
    return { url, html, fromFixture: false };
  } catch (err) {
    log.error("live class fetch failed, falling back to fixture", {
      className,
      error: (err as Error)?.message,
    });
    const html = await readFixture(fixtureNameForClass(className));
    if (!html) throw err;
    return { url, html, fromFixture: true };
  }
}
