import { describe, expect, test } from "bun:test";

import {
  billStateForDue,
  buildMonthEvents,
  dayMark,
  monthGrid,
  sortDuesByUrgency,
  ymdOf,
  type CalendarDue,
} from "./home-calendar";

function due(partial: Partial<CalendarDue>): CalendarDue {
  return {
    id: "d1",
    issuerId: "bpi",
    bankLabel: "BPI",
    cardLast4: "1234",
    cardDisplayLabel: null,
    cardColor: "#B11116",
    dueDate: "Nov 22, 2026",
    dueDateYmd: "2026-11-22",
    statementPeriodKey: "2026-11",
    minimumDue: "500.00",
    totalDue: "10,000.00",
    paidAt: null,
    source: "soa",
    soaMissing: false,
    daysAway: 14,
    ...partial,
  };
}

describe("home calendar", () => {
  test("clamps day 31 to the end of a short month", () => {
    expect(ymdOf(2026, 2, 31)).toBe("2026-02-28");
    expect(ymdOf(2026, 11, 31)).toBe("2026-11-30");
  });

  test("builds Sunday-first weeks that cover the month", () => {
    const weeks = monthGrid(2026, 11);
    expect(weeks[0]![0]!.ymd).toBe("2026-11-01"); // Nov 1, 2026 is a Sunday
    expect(weeks.flat().filter((cell) => cell.inMonth)).toHaveLength(30);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  test("derives bill states in priority order", () => {
    expect(billStateForDue(due({ paidAt: new Date() }))).toBe("paid");
    expect(billStateForDue(due({ source: "expected", soaMissing: true }))).toBe("missing");
    expect(billStateForDue(due({ source: "expected" }))).toBe("expected");
    expect(billStateForDue(due({ daysAway: -2 }))).toBe("overdue");
    expect(billStateForDue(due({ daysAway: 3 }))).toBe("due-soon");
    expect(billStateForDue(due({ daysAway: 9 }))).toBe("unpaid");
  });

  test("puts due and statement events on their days and picks the strongest mark", () => {
    const events = buildMonthEvents({
      year: 2026,
      month: 11,
      dues: [
        due({ id: "a", dueDateYmd: "2026-11-11", daysAway: 3 }),
        due({ id: "b", dueDateYmd: "2026-11-11", paidAt: new Date() }),
        due({ id: "c", dueDateYmd: "2026-12-10" }),
      ],
      cards: [
        { id: "card", issuerId: "bpi", last4: "1234", label: null, color: null, statementDay: 31, dueDay: 22 },
      ],
    });
    expect(events.map((event) => event.ymd)).toEqual([
      "2026-11-11",
      "2026-11-11",
      "2026-11-30",
    ]);
    expect(dayMark(events.filter((event) => event.ymd === "2026-11-11"))).toBe("urgent");
  });

  test("sorts what needs the user first", () => {
    const sorted = sortDuesByUrgency([
      due({ id: "paid", paidAt: new Date() }),
      due({ id: "later", daysAway: 20, dueDateYmd: "2026-11-28" }),
      due({ id: "missing", source: "expected", soaMissing: true }),
      due({ id: "overdue", daysAway: -1, dueDateYmd: "2026-11-07" }),
      due({ id: "soon", daysAway: 2, dueDateYmd: "2026-11-10" }),
    ]);
    expect(sorted.map((row) => row.id)).toEqual([
      "overdue",
      "missing",
      "soon",
      "later",
      "paid",
    ]);
  });
});
