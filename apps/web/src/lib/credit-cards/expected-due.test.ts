import { describe, expect, it } from "vitest";

import {
  dueDayFromYmd,
  expectedDueDateCandidates,
  expectedDueDateYmd,
  inferDueDayFromYmds,
  isValidDueDay,
} from "./expected-due";

describe("expectedDueDateYmd", () => {
  it("uses the configured day in a normal month", () => {
    expect(expectedDueDateYmd(2026, 8, 25)).toBe("2026-08-25");
  });

  it("clamps day 31 to the last day of shorter months", () => {
    expect(expectedDueDateYmd(2026, 4, 31)).toBe("2026-04-30");
    expect(expectedDueDateYmd(2026, 2, 31)).toBe("2026-02-28");
    expect(expectedDueDateYmd(2028, 2, 31)).toBe("2028-02-29");
  });

  it("validates the supported day range", () => {
    expect(isValidDueDay(1)).toBe(true);
    expect(isValidDueDay(31)).toBe(true);
    expect(isValidDueDay(0)).toBe(false);
    expect(isValidDueDay(32)).toBe(false);
  });
});

describe("expectedDueDateCandidates", () => {
  it("includes the next month near a month boundary", () => {
    expect(expectedDueDateCandidates("2026-08-29", 2)).toEqual([
      "2026-07-02",
      "2026-08-02",
      "2026-09-02",
    ]);
  });

  it("includes the prior month for an overdue month-boundary fallback", () => {
    expect(expectedDueDateCandidates("2027-01-01", 31)).toEqual([
      "2026-12-31",
      "2027-01-31",
      "2027-02-28",
    ]);
  });
});

describe("dueDayFromYmd", () => {
  it("reads the calendar day from an ISO due date", () => {
    expect(dueDayFromYmd("2026-05-25")).toBe(25);
    expect(dueDayFromYmd("2026-06-02")).toBe(2);
  });

  it("rejects malformed values", () => {
    expect(dueDayFromYmd("May 25, 2026")).toBeNull();
    expect(dueDayFromYmd("2026-05-00")).toBeNull();
    expect(dueDayFromYmd("")).toBeNull();
  });
});

describe("inferDueDayFromYmds", () => {
  it("returns the only observed day", () => {
    expect(inferDueDayFromYmds(["2026-04-27"])).toBe(27);
  });

  it("picks the most frequent day across months", () => {
    expect(
      inferDueDayFromYmds([
        "2026-02-25",
        "2026-03-25",
        "2026-04-27",
        "2026-05-25",
      ]),
    ).toBe(25);
  });

  it("breaks ties with the latest date", () => {
    expect(
      inferDueDayFromYmds([
        "2026-02-02",
        "2026-03-05",
        "2026-05-04",
        "2026-06-02",
      ]),
    ).toBe(2);
  });

  it("ignores unparseable dates", () => {
    expect(inferDueDayFromYmds(["—", "2026-05-28", ""])).toBe(28);
    expect(inferDueDayFromYmds([])).toBeNull();
  });
});
