import { NextResponse } from "next/server";
import { getClassesIndex } from "@/lib/schedule/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const index = await getClassesIndex();
    return NextResponse.json({ ok: true, data: index });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 502 },
    );
  }
}
