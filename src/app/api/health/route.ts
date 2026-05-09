import { NextResponse } from "next/server";
import { FIXTURE_MODE, SCHOOL_NAME, SCHOOL_UID } from "@/lib/schedule/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    schoolName: SCHOOL_NAME,
    schoolUid: SCHOOL_UID,
    fixtureMode: FIXTURE_MODE,
    timestamp: new Date().toISOString(),
  });
}
