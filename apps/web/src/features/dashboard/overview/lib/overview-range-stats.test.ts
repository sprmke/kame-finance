import { describe, expect, test } from "vitest";

import { rollupStatementMonths } from "./overview-range-stats";

import type { SoaStatementForOutstanding } from "@/lib/soa/outstanding";

function statement(
  month: number,
  totalDue: string,
  last4 = "3746",
): SoaStatementForOutstanding {
  return {
    issuerId: "metrobank",
    cardLast4: last4,
    statementMonth: month,
    statementYear: 2026,
    totalDue,
    minimumDue: "100.00",
    dueDateYmd: `2026-${String(month + 1).padStart(2, "0")}-15`,
    bankLabel: "Metrobank Platinum",
    soaUnavailable: false,
  };
}

describe("rollupStatementMonths", () => {
  test("keeps a single month label unchanged", () => {
    const stats = rollupStatementMonths([statement(10, "1,000.00")], []);
    expect(stats.statementCount).toBe(1);
    expect(stats.totalDue).toBe(1000);
    expect(stats.cardCount).toBe(1);
    expect(stats.periodCards[0]?.label).toBe("Metrobank Platinum");
    expect(stats.periodCards[0]?.statementPeriodKey).toBe("2026-10");
  });

  test("adds each month instead of keeping only the latest statement", () => {
    const stats = rollupStatementMonths(
      [statement(9, "1,000.00"), statement(10, "2,500.00")],
      [],
    );
    expect(stats.totalDue).toBe(3500);
    expect(stats.grossStatementDue).toBe(3500);
    expect(stats.cardCount).toBe(2);
    expect(stats.periodCards.map((card) => card.label)).toEqual([
      "Metrobank Platinum · Oct",
      "Metrobank Platinum · Sep",
    ]);
    expect(stats.nextDueYmd).toBe("2026-10-15");
  });
});
