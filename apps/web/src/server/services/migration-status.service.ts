import { sql } from "drizzle-orm";

import journal from "@/../drizzle/migrations/meta/_journal.json";
import { db } from "@/lib/db";

export type MigrationStatus = {
  ok: boolean;
  dbConnected: boolean;
  latestApplied: string | null;
  pending: string[];
};

const UNDEFINED_TABLE = "42P01";

function isUndefinedTable(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === UNDEFINED_TABLE
  );
}

async function latestAppliedMillis(): Promise<number | null> {
  try {
    const rows = await db.execute<{ created_at: string | number | null }>(
      sql`select created_at from drizzle.__drizzle_migrations order by created_at desc limit 1`,
    );
    const value = rows[0]?.created_at;
    return value == null ? null : Number(value);
  } catch (error) {
    if (isUndefinedTable(error)) return null;
    throw error;
  }
}

export const migrationStatusService = {
  async get(): Promise<MigrationStatus> {
    let latest: number | null;
    try {
      latest = await latestAppliedMillis();
    } catch {
      return { ok: false, dbConnected: false, latestApplied: null, pending: [] };
    }

    const applied = journal.entries.filter(
      (entry) => latest != null && entry.when <= latest,
    );
    const pending = journal.entries
      .filter((entry) => latest == null || entry.when > latest)
      .map((entry) => entry.tag);
    const latestApplied = applied[applied.length - 1]?.tag ?? null;

    return { ok: pending.length === 0, dbConnected: true, latestApplied, pending };
  },
};
