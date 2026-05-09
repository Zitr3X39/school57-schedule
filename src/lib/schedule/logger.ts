/**
 * Tiny structured logger used by the parser layer. Logs go to stderr in
 * production and to console.info in dev. We avoid pulling in a dep for this.
 */

type Level = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  level: Level;
  scope: string;
  message: string;
  meta?: Record<string, unknown>;
  timestamp: string;
}

const SHOW_DEBUG = process.env.NODE_ENV !== "production";

function emit(entry: LogEntry): void {
  const prefix = `[${entry.timestamp}] [${entry.scope}] [${entry.level}]`;
  const line = `${prefix} ${entry.message}` +
    (entry.meta ? ` ${JSON.stringify(entry.meta)}` : "");
  switch (entry.level) {
    case "error":
      console.error(line);
      return;
    case "warn":
      console.warn(line);
      return;
    case "debug":
      if (SHOW_DEBUG) console.debug(line);
      return;
    default:
      console.log(line);
  }
}

export function createLogger(scope: string) {
  function make(level: Level) {
    return (message: string, meta?: Record<string, unknown>) =>
      emit({ level, scope, message, meta, timestamp: new Date().toISOString() });
  }
  return {
    info: make("info"),
    warn: make("warn"),
    error: make("error"),
    debug: make("debug"),
  };
}
