import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const VERSION = "0.1.0";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      uptime: Math.round(process.uptime()),
      version: VERSION,
      runtime: `node ${process.version}`,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
