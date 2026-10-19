import { describe, expect, test } from "bun:test";

import {
  cardHasSoaForMonth,
  coveredKeysByMonth,
  soaCoverageKey,
} from "./skip-existing-cards";

describe("coveredKeysByMonth", () => {
  test("covers a parsed statement for that month only", () => {
    const covered = coveredKeysByMonth([
      {
        issuerId: "BPI",
        cardLast4: "1234",
        statementMonth: 10,
        statementYear: 2026,
        soaUnavailable: false,
      },
      {
        issuerId: "rcbc",
        cardLast4: "5678",
        statementMonth: 9,
        statementYear: 2026,
        soaUnavailable: false,
      },
    ]);

    expect(cardHasSoaForMonth(covered, 2026, 10, "bpi", "1234")).toBe(true);
    expect(cardHasSoaForMonth(covered, 2026, 9, "bpi", "1234")).toBe(false);
    expect(cardHasSoaForMonth(covered, 2026, 10, "rcbc", "5678")).toBe(false);
    expect(cardHasSoaForMonth(covered, 2026, 9, "rcbc", "5678")).toBe(true);
  });

  test("ignores unavailable placeholders and blank cards", () => {
    const covered = coveredKeysByMonth([
      {
        issuerId: "bpi",
        cardLast4: "1234",
        statementMonth: 10,
        statementYear: 2026,
        soaUnavailable: true,
      },
      {
        issuerId: "metrobank",
        cardLast4: "—",
        statementMonth: 10,
        statementYear: 2026,
        soaUnavailable: false,
      },
    ]);

    expect(covered.size).toBe(0);
    expect(cardHasSoaForMonth(covered, 2026, 10, "bpi", "1234")).toBe(false);
  });

  test("normalizes issuer and last-4", () => {
    const covered = coveredKeysByMonth([
      {
        issuerId: "UnionBank",
        cardLast4: "xx0344",
        statementMonth: 10,
        statementYear: 2026,
      },
    ]);

    expect([...(covered.get("2026-10") ?? [])]).toEqual([
      soaCoverageKey("unionbank", "0344"),
    ]);
    expect(cardHasSoaForMonth(covered, 2026, 10, "unionbank", "0344")).toBe(
      true,
    );
  });
});
