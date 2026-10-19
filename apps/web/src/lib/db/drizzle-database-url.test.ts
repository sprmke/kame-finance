import { describe, expect, test } from "vitest";

import { drizzleDatabaseUrl } from "./drizzle-database-url";

describe("drizzleDatabaseUrl", () => {
  test("uses DATABASE_URL when DIRECT_URL is blank", () => {
    expect(
      drizzleDatabaseUrl({
        DIRECT_URL: "",
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/kame_finance",
      }),
    ).toBe("postgresql://postgres:postgres@localhost:5432/kame_finance");
  });

  test("prefers a non-blank DIRECT_URL", () => {
    expect(
      drizzleDatabaseUrl({
        DIRECT_URL: "postgresql://postgres:postgres@localhost:5432/direct",
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/pooled",
      }),
    ).toBe("postgresql://postgres:postgres@localhost:5432/direct");
  });
});
