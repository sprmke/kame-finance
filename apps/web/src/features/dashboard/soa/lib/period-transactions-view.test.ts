import { describe, expect, it } from "vitest";

import type { PeriodTransaction } from "./period-overview-stats";
import {
  filterPeriodTransactions,
  groupPeriodTransactions,
  sortPeriodTransactions,
} from "./period-transactions-view";

function tx(
  partial: Partial<PeriodTransaction> & Pick<PeriodTransaction, "id">,
): PeriodTransaction {
  return {
    date: null,
    description: "",
    amount: "100.00",
    categorySlug: "dining",
    categoryLabel: "Dining",
    issuerId: "bpi",
    bankLabel: "BPI",
    cardLast4: "1234",
    ...partial,
  };
}

describe("period-transactions-view", () => {
  it("filters by search and card", () => {
    const rows = [
      tx({ id: "1", description: "JOLLIBEE", cardLast4: "1111" }),
      tx({ id: "2", description: "SM MALL", cardLast4: "2222" }),
    ];
    const filtered = filterPeriodTransactions(rows, {
      search: "jollibee",
      cardKey: "all",
      categorySlug: "all",
      kind: "all",
    });
    expect(filtered.map((r) => r.id)).toEqual(["1"]);
  });

  it("sorts by date descending", () => {
    const rows = [
      tx({ id: "a", date: "Jan 1" }),
      tx({ id: "b", date: "Mar 1" }),
    ];
    const sorted = sortPeriodTransactions(rows, "date_desc");
    expect(sorted.map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("sorts stored slash dates chronologically, not alphabetically", () => {
    // RCBC stores MM/DD/YY: "11/03/26" is 3 November, later than "10/29/26".
    // Alphabetical comparison would wrongly put "10/29/26" last.
    const rows = [
      tx({ id: "nov", date: "11/03/26 / 11/03/26", issuerId: "rcbc" }),
      tx({ id: "oct", date: "10/29/26 / 10/30/26", issuerId: "rcbc" }),
      tx({ id: "dec", date: "12/29/25 / 01/01/26", issuerId: "rcbc" }),
    ];
    expect(
      sortPeriodTransactions(rows, "date_desc").map((r) => r.id),
    ).toEqual(["nov", "oct", "dec"]);
    expect(
      sortPeriodTransactions(rows, "date_asc").map((r) => r.id),
    ).toEqual(["dec", "oct", "nov"]);
  });

  it("keeps undated rows last in both directions", () => {
    const rows = [
      tx({ id: "dated", date: "11/03/26", issuerId: "rcbc" }),
      tx({ id: "undated", date: null }),
    ];
    expect(
      sortPeriodTransactions(rows, "date_desc").map((r) => r.id),
    ).toEqual(["dated", "undated"]);
    expect(
      sortPeriodTransactions(rows, "date_asc").map((r) => r.id),
    ).toEqual(["dated", "undated"]);
  });

  it("filters interest and fees under one kind", () => {
    const rows = [
      tx({
        id: "1",
        description: "INTEREST CHARGE",
        amount: "50.00",
      }),
      tx({
        id: "2",
        description: "OVERLIMIT FEE",
        amount: "600.00",
      }),
      tx({ id: "3", description: "JOLLIBEE", amount: "200.00" }),
    ];
    const filtered = filterPeriodTransactions(rows, {
      search: "",
      cardKey: "all",
      categorySlug: "all",
      kind: "interest_fees",
    });
    expect(filtered.map((r) => r.id).sort()).toEqual(["1", "2"]);
  });

  it("groups by card", () => {
    const rows = [
      tx({ id: "1", cardLast4: "1111" }),
      tx({ id: "2", cardLast4: "2222" }),
      tx({ id: "3", cardLast4: "1111" }),
    ];
    const groups = groupPeriodTransactions(rows, "card");
    expect(groups).toHaveLength(2);
    const g1111 = groups.find((g) => g.key === "bpi:1111");
    expect(g1111?.transactions).toHaveLength(2);
  });
});
