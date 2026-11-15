import { NextResponse } from "next/server";
import { dbMode, ready } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ready();
    return NextResponse.json({ ok: true, db: dbMode() });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Database is not ready.",
      },
      { status: 503 },
    );
  }
}
