import { NextResponse } from "next/server";
import { getSchedule } from "@/lib/schedule/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const className = url.searchParams.get("class");
  const weekId = url.searchParams.get("week") ?? undefined;
  if (!className) {
    return NextResponse.json(
      { ok: false, error: "missing 'class' query parameter" },
      { status: 400 },
    );
  }
  try {
    const result = await getSchedule({ className, weekId });
    return NextResponse.json({
      ok: true,
      data: result.schedule,
      report: result.report,
      source: result.source,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 502 },
    );
  }
}
