import { describe, expect, test } from "bun:test";

import {
  expectedStatementDateYmd,
  isOnOrPastExpectedStatementDate,
  targetStatementMonthForCard,
} from "./billing-cycle";

describe("targetStatementMonthForCard", () => {
  test("applies gmail month offset", () => {
    expect(targetStatementMonthForCard("2026-03-15", -1)).toEqual({
      year: 2026,
      month: 2,
    });
    expect(targetStatementMonthForCard("2026-01-10", -1)).toEqual({
      year: 2025,
      month: 12,
    });
  });
});

describe("isOnOrPastExpectedStatementDate", () => {
  test("waits until configured statement day", () => {
    const schedule = {
      statementDay: 5,
      dueDay: 25,
      gmailMonthOffset: 0,
    };
    expect(
      isOnOrPastExpectedStatementDate("2026-03-04", schedule),
    ).toBe(false);
    expect(
      isOnOrPastExpectedStatementDate("2026-03-05", schedule),
    ).toBe(true);
    expect(
      isOnOrPastExpectedStatementDate("2026-03-20", schedule),
    ).toBe(true);
  });

  test("clamps statement day to month length", () => {
    expect(expectedStatementDateYmd(2026, 2, 31)).toBe("2026-02-28");
  });
});
