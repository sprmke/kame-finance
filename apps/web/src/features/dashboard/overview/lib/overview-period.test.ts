import { describe, expect, test } from "vitest";

import {
  canShiftOverviewPeriod,
  currentOverviewPeriod,
  dueMatchesSpan,
  formatOverviewPeriodLabel,
  isCurrentOverviewPeriod,
  jumpToCurrentOverviewPeriod,
  manilaToday,
  overviewPeriodSpan,
  overviewStatsInput,
  parseOverviewPeriod,
  pickPeriodIdForMonth,
  shiftOverviewPeriod,
} from "./overview-period";

const NOW = new Date("2026-10-19T02:00:00.000Z");

describe("overview period", () => {
  test("uses the Manila calendar date", () => {
    expect(manilaToday(new Date("2026-10-31T20:00:00.000Z"))).toEqual({
      year: 2026,
      month: 11,
    });
  });

  test("defaults to the current month when the URL is empty", () => {
    expect(parseOverviewPeriod({}, NOW)).toEqual({
      grain: "month",
      year: 2026,
      month: 10,
    });
    expect(overviewStatsInput(currentOverviewPeriod(NOW), NOW)).toBeUndefined();
  });

  test("parses a year selection and keeps the anchor month", () => {
    expect(
      parseOverviewPeriod({ grain: "year", year: "2025", month: "10" }, NOW),
    ).toEqual({ grain: "year", year: 2025, month: 10 });
    expect(formatOverviewPeriodLabel({ grain: "year", year: 2025, month: 10 })).toBe(
      "2025",
    );
    expect(
      overviewPeriodSpan({ grain: "year", year: 2025, month: 10 }),
    ).toEqual({
      fromMonth: 1,
      fromYear: 2025,
      toMonth: 12,
      toYear: 2025,
    });
  });

  test("does not move past the current month or before 2000", () => {
    const current = { grain: "month" as const, year: 2026, month: 10 };
    expect(shiftOverviewPeriod(current, "next", NOW)).toEqual(current);
    expect(canShiftOverviewPeriod(current, "next", NOW)).toBe(false);

    const january = { grain: "month" as const, year: 2000, month: 1 };
    expect(shiftOverviewPeriod(january, "prev", NOW)).toEqual(january);
  });

  test("steps across the year boundary and by year", () => {
    expect(
      shiftOverviewPeriod({ grain: "month", year: 2026, month: 1 }, "prev", NOW),
    ).toEqual({ grain: "month", year: 2025, month: 12 });
    expect(
      shiftOverviewPeriod({ grain: "year", year: 2026, month: 10 }, "prev", NOW),
    ).toEqual({ grain: "year", year: 2025, month: 10 });
    expect(
      canShiftOverviewPeriod(
        { grain: "year", year: 2026, month: 10 },
        "next",
        NOW,
      ),
    ).toBe(false);
  });

  test("clamps a future URL back to the current month", () => {
    expect(
      parseOverviewPeriod({ grain: "month", year: "2027", month: "3" }, NOW),
    ).toEqual({ grain: "month", year: 2026, month: 10 });
  });

  test("current-year jump keeps the year grain", () => {
    expect(jumpToCurrentOverviewPeriod("year", NOW)).toEqual({
      grain: "year",
      year: 2026,
      month: 10,
    });
    expect(
      isCurrentOverviewPeriod({ grain: "year", year: 2026, month: 4 }, NOW),
    ).toBe(true);
    expect(
      isCurrentOverviewPeriod({ grain: "month", year: 2026, month: 9 }, NOW),
    ).toBe(false);
  });

  test("prefers the exact month period over a covering range", () => {
    expect(
      pickPeriodIdForMonth(
        [
          {
            id: "range",
            fromMonth: 8,
            fromYear: 2026,
            toMonth: 10,
            toYear: 2026,
          },
          {
            id: "october",
            fromMonth: 10,
            fromYear: 2026,
            toMonth: 10,
            toYear: 2026,
          },
        ],
        10,
        2026,
      ),
    ).toBe("october");
  });

  test("matches dues by statement month, then due date", () => {
    const span = {
      fromMonth: 9,
      fromYear: 2026,
      toMonth: 9,
      toYear: 2026,
    };
    expect(
      dueMatchesSpan(
        { statementPeriodKey: "2026-09", dueDateYmd: "2026-10-26" },
        span,
      ),
    ).toBe(true);
    expect(
      dueMatchesSpan(
        { statementPeriodKey: null, dueDateYmd: "2026-09-15" },
        span,
      ),
    ).toBe(true);
    expect(
      dueMatchesSpan(
        { statementPeriodKey: "2026-10", dueDateYmd: "2026-10-26" },
        span,
      ),
    ).toBe(false);
  });
});
