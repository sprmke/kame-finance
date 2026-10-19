import { defineConfig } from "drizzle-kit";

import { drizzleDatabaseUrl } from "./src/lib/db/drizzle-database-url";

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Supabase: use DIRECT_URL (session mode, port 5432) for schema push/migrate.
    // A blank DIRECT_URL in .env.local must fall through to DATABASE_URL.
    url: drizzleDatabaseUrl(process.env),
  },
  verbose: true,
  strict: true,
});
