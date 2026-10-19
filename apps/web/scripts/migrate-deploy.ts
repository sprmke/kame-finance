/**
 * Applies Drizzle migrations before `next build` so production code never ships
 * ahead of its schema.
 *
 * Runs only on Vercel production builds (or when MIGRATE_ON_BUILD=1). Preview
 * builds skip it so unmerged migrations never touch the shared database.
 *
 * Databases bootstrapped with `drizzle-kit push` have no migrations journal; the
 * non-idempotent baseline migrations are recorded as applied instead of re-run.
 */
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import postgres from "postgres";

const appRoot = join(fileURLToPath(import.meta.url), "..", "..");
const migrationsFolder = join(appRoot, "drizzle", "migrations");

const shouldRun =
  process.env.MIGRATE_ON_BUILD === "1" ||
  process.env.VERCEL_ENV === "production";

if (!shouldRun) {
  console.log("Skipping database migrations (not a production build)");
  process.exit(0);
}

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("DIRECT_URL or DATABASE_URL is required to run migrations");
  process.exit(1);
}

const isTransactionPooler =
  url.includes("pgbouncer=true") || url.includes(":6543");

const client = postgres(url, {
  max: 1,
  connect_timeout: 15,
  prepare: !isTransactionPooler,
  onnotice: () => {},
});

async function appliedCount(): Promise<number> {
  const [row] = await client<{ table: string | null }[]>`
    select to_regclass('drizzle.__drizzle_migrations')::text as table
  `;
  if (!row?.table) return 0;
  const [countRow] = await client<{ count: number }[]>`
    select count(*)::int as count from drizzle.__drizzle_migrations
  `;
  return countRow?.count ?? 0;
}

async function baselinePushedDatabase(): Promise<void> {
  const [row] = await client<{ users: string | null; dueIndex: string | null }[]>`
    select
      to_regclass('public.users')::text as users,
      to_regclass('public.due_entries_user_card_due_uidx')::text as "dueIndex"
  `;
  if (!row?.users) return;

  // 0000 creates the base tables; 0001 adds the due-entry unique index.
  // Everything after 0001 is written to be idempotent.
  const migrations = readMigrationFiles({ migrationsFolder });
  const baseline = migrations.slice(0, row.dueIndex ? 2 : 1);

  await client`create schema if not exists drizzle`;
  await client`
    create table if not exists drizzle.__drizzle_migrations (
      id serial primary key,
      hash text not null,
      created_at bigint
    )
  `;
  for (const migration of baseline) {
    await client`
      insert into drizzle.__drizzle_migrations (hash, created_at)
      values (${migration.hash}, ${migration.folderMillis})
    `;
  }
  console.log(
    `Baselined ${baseline.length} migration(s) on a database without a migrations journal`,
  );
}

try {
  const before = await appliedCount();
  if (before === 0) await baselinePushedDatabase();

  const start = await appliedCount();
  await migrate(drizzle(client), { migrationsFolder });
  const after = await appliedCount();

  console.log(
    after > start
      ? `Applied ${after - start} database migration(s)`
      : "Database schema is up to date",
  );
} catch (error) {
  console.error("Database migration failed:", error);
  process.exitCode = 1;
} finally {
  await client.end({ timeout: 5 });
}
