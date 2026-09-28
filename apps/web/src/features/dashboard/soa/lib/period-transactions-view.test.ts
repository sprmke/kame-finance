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
