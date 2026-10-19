import { describe, expect, test } from "bun:test";

import { statementMonthForDueYmd } from "@/lib/credit-cards/billing-cycle";
import {
  expectedDueYmdsToEnsure,
  isStaleFutureExpectedDue,
} from "@/lib/credit-cards/expected-cycle";

const asOf = "2026-10-19";

describe("expected due cycle on 19 Oct 2026", () => {
  test("keeps BPI and Maya on the October statement, due the same month", () => {
    const bpi = expectedDueYmdsToEnsure({
      asOfYmd: asOf,
      schedule: { statementDay: 7, dueDay: 28, gmailMonthOffset: 0 },
      windowDays: 4,
      overdueFollowUpDays: 7,
      hasParsedSoa: () => false,
    });
    const maya = expectedDueYmdsToEnsure({
      asOfYmd: asOf,
      schedule: { statementDay: 10, dueDay: 30, gmailMonthOffset: 0 },
      windowDays: 4,
      overdueFollowUpDays: 7,
      hasParsedSoa: () => false,
    });

    expect(bpi).toEqual(["2026-10-28"]);
    expect(maya).toEqual(["2026-10-30"]);
    expect(
      statementMonthForDueYmd("2026-10-28", {
        statementDay: 7,
        dueDay: 28,
      }),
    ).toEqual({ year: 2026, month: 10 });
    expect(
      statementMonthForDueYmd("2026-10-30", {
        statementDay: 10,
        dueDay: 30,
      }),
    ).toEqual({ year: 2026, month: 10 });
  });

  test("places Unionbank's November due on the October statement", () => {
    const dues = expectedDueYmdsToEnsure({
      asOfYmd: asOf,
      schedule: { statementDay: 23, dueDay: 10, gmailMonthOffset: 0 },
      windowDays: 4,
      overdueFollowUpDays: 7,
      hasParsedSoa: () => false,
    });

    expect(dues).toEqual(["2026-11-10"]);
    expect(
      statementMonthForDueYmd("2026-11-10", {
        statementDay: 23,
        dueDay: 10,
      }),
    ).toEqual({ year: 2026, month: 10 });
  });

  test("does not add a placeholder when the open month already has a parsed SOA", () => {
    expect(
      expectedDueYmdsToEnsure({
        asOfYmd: asOf,
        schedule: { statementDay: 4, dueDay: 25, gmailMonthOffset: 0 },
        windowDays: 4,
        overdueFollowUpDays: 7,
        hasParsedSoa: (year, month) => year === 2026 && month === 10,
      }),
    ).toEqual([]);
  });

  test("drops a November expected row that was opened while it is still October", () => {
    const keep = new Set(["2026-10-28"]);
    const current = { year: 2026, month: 10 };
    const schedule = { statementDay: 7, dueDay: 28 };

    expect(
      isStaleFutureExpectedDue("2026-11-28", schedule, current, keep),
    ).toBe(true);
    expect(
      isStaleFutureExpectedDue("2026-10-28", schedule, current, keep),
    ).toBe(false);
    expect(
      isStaleFutureExpectedDue("2026-09-28", schedule, current, keep),
    ).toBe(false);
  });
});
