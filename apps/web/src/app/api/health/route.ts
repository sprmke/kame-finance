import { NextResponse } from "next/server";

import { migrationStatusService } from "@/server/services/migration-status.service";

export const dynamic = "force-dynamic";

/** Public readiness probe for CD smoke tests. No auth. */
export async function GET() {
  const status = await migrationStatusService.get();

  return NextResponse.json(
    {
      ok: status.ok,
      db: status.dbConnected ? "connected" : "unavailable",
      migrations: {
        pending: status.pending.length,
        pendingFiles: status.pending,
        latestApplied: status.latestApplied,
      },
    },
    { status: status.ok ? 200 : 503 },
  );
}
