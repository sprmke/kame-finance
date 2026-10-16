import { describe, expect, test } from "bun:test";

import {
  hasSoaPeriodForMonth,
  shouldOfferSoaAdvanceRun,
  soaAdvanceRunTargetMonth,
} from "./advance-run-prompt";

describe("soaAdvanceRunTargetMonth", () => {
  test("rolls to next calendar month", () => {
    expect(soaAdvanceRunTargetMonth("2026-03-20")).toEqual({
      year: 2026,
      month: 4,
    });
    expect(soaAdvanceRunTargetMonth("2026-12-25")).toEqual({
      year: 2027,
      month: 1,
    });
  });
});

describe("shouldOfferSoaAdvanceRun", () => {
  test("offers from prompt day through month end", () => {
    expect(shouldOfferSoaAdvanceRun("2026-03-19", 20)).toBe(false);
    expect(shouldOfferSoaAdvanceRun("2026-03-20", 20)).toBe(true);
    expect(shouldOfferSoaAdvanceRun("2026-03-31", 20)).toBe(true);
  });

  test("respects custom prompt day", () => {
    expect(shouldOfferSoaAdvanceRun("2026-03-14", 15)).toBe(false);
    expect(shouldOfferSoaAdvanceRun("2026-03-15", 15)).toBe(true);
  });
});

describe("hasSoaPeriodForMonth", () => {
  test("matches single- and multi-month periods", () => {
    const periods = [
      {
        fromMonth: 1,
        fromYear: 2026,
        toMonth: 3,
        toYear: 2026,
      },
      {
        fromMonth: 5,
        fromYear: 2026,
        toMonth: 5,
        toYear: 2026,
      },
    ];
    expect(hasSoaPeriodForMonth(periods, 2, 2026)).toBe(true);
    expect(hasSoaPeriodForMonth(periods, 4, 2026)).toBe(false);
    expect(hasSoaPeriodForMonth(periods, 5, 2026)).toBe(true);
  });
});
