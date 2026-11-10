import { describe, expect, test } from "bun:test";

import {
  formatTransactionDateToken,
  parseTransactionDate,
  parseTransactionDateToken,
  transactionDateSortKey,
} from "./transaction-dates";

describe("parseTransactionDateToken", () => {
  test("reads RCBC MM/DD/YY as month first", () => {
    // SALE DATE 11/03/26 on the Nov 2026 statement is 3 November, not 11 March.
    expect(parseTransactionDateToken("11/03/26", "rcbc")).toEqual({
      month: 11,
      day: 3,
      year: 26,
    });
  });

  test("reads Unionbank MM/DD/YY as month first", () => {
    expect(parseTransactionDateToken("09/11/26", "unionbank")).toEqual({
      month: 9,
      day: 11,
      year: 26,
    });
  });

  test("reads Metrobank MM/DD as month first", () => {
    expect(parseTransactionDateToken("09/25", "metrobank")).toEqual({
      month: 9,
      day: 25,
    });
  });

  test("reads month-name and day-first month-name tokens", () => {
    expect(parseTransactionDateToken("Sep 11", "bpi")).toEqual({
      month: 9,
      day: 11,
    });
    expect(parseTransactionDateToken("11 Sep", "maya")).toEqual({
      month: 9,
      day: 11,
    });
  });

  test("falls back to day-first only when the first value cannot be a month", () => {
    expect(parseTransactionDateToken("29/10/26", "unknown-bank")).toEqual({
      month: 10,
      day: 29,
      year: 26,
    });
  });

  test("returns null for unparseable input", () => {
    expect(parseTransactionDateToken("—", "rcbc")).toBeNull();
    expect(parseTransactionDateToken("99/99", "rcbc")).toBeNull();
  });
});

describe("formatTransactionDateToken", () => {
  test("formats RCBC dates without reversing month and day", () => {
    expect(formatTransactionDateToken("11/03/26", "rcbc")).toBe("Nov 3, 2026");
    expect(formatTransactionDateToken("10/29/26", "rcbc")).toBe("Oct 29, 2026");
  });

  test("formats Unionbank and Metrobank dates", () => {
    expect(formatTransactionDateToken("09/11/26", "unionbank")).toBe(
      "Sep 11, 2026",
    );
    expect(formatTransactionDateToken("09/25", "metrobank")).toBe("Sep 25");
  });

  test("formats BPI and Maya month-name tokens", () => {
    expect(formatTransactionDateToken("January 25", "bpi")).toBe("Jan 25");
    expect(formatTransactionDateToken("11 Sep", "maya")).toBe("Sep 11");
  });
});

describe("parseTransactionDate", () => {
  test("formats both sides of a posted / transacted pair", () => {
    expect(parseTransactionDate("11/03/26 / 11/03/26", "rcbc")).toEqual({
      posted: "Nov 3, 2026",
      transacted: "Nov 3, 2026",
    });
  });

  test("keeps the transacted date null when only one date is stored", () => {
    expect(parseTransactionDate("10/29/26", "rcbc")).toEqual({
      posted: "Oct 29, 2026",
      transacted: null,
    });
  });

  test("handles empty input", () => {
    expect(parseTransactionDate(null, "rcbc")).toEqual({
      posted: null,
      transacted: null,
    });
  });
});

describe("transactionDateSortKey", () => {
  test("orders chronologically across year, month and day", () => {
    const oct29 = transactionDateSortKey("10/29/26 / 10/30/26", "rcbc");
    const nov03 = transactionDateSortKey("11/03/26 / 11/03/26", "rcbc");
    const dec29 = transactionDateSortKey("12/29/26 / 01/01/27", "rcbc");
    expect(oct29).toBeLessThan(nov03);
    expect(nov03).toBeLessThan(dec29);
  });

  test("sorts day 29 of October after day 3 of November only when later", () => {
    // Raw string comparison would put 10/29 before 11/03, which happens to match,
    // but 11/03 would sort before 03/11 in the reversed bug. Guard the real order.
    const nov03 = transactionDateSortKey("11/03/26", "rcbc");
    const mar11 = transactionDateSortKey("03/11/26", "rcbc");
    expect(mar11).toBeLessThan(nov03);
  });

  test("returns Infinity for undated rows so they sort last", () => {
    expect(transactionDateSortKey(null, "rcbc")).toBe(
      Number.POSITIVE_INFINITY,
    );
    expect(transactionDateSortKey("—", "rcbc")).toBe(
      Number.POSITIVE_INFINITY,
    );
  });
});
