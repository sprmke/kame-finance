import { describe, expect, test } from "vitest";

import {
  aggregateCategorySpend,
  transactionsForCategory,
} from "./category-analytics";

const txs = [
  {
    id: "1",
    description: "SM SUPERMARKET",
    amount: "1,234.00",
    categorySlug: "store_shopping",
  },
  {
    id: "2",
    description: "PUREGOLD",
    amount: "890.50",
    categorySlug: "store_shopping",
  },
  {
    id: "3",
    description: "GRABFOOD",
    amount: "350.00",
    categorySlug: "dining",
  },
  {
    id: "4",
    description: "ZERO AMOUNT",
    amount: "0.00",
    categorySlug: "store_shopping",
  },
  {
    id: "5",
    description: "UNKNOWN MERCHANT",
    amount: "100.00",
    categorySlug: null,
  },
];

describe("transactionsForCategory", () => {
  test("returns positive spend matching the slug", () => {
    const rows = transactionsForCategory(txs, "store_shopping");
    expect(rows.map((tx) => tx.id)).toEqual(["1", "2"]);
  });

  test("treats missing slug as cannot analyze", () => {
    const rows = transactionsForCategory(txs, "unknown");
    expect(rows.map((tx) => tx.id)).toEqual(["5"]);
  });

  test("count matches aggregated category row", () => {
    const dining = aggregateCategorySpend(txs).find(
      (row) => row.slug === "dining",
    );
    expect(dining?.count).toBe(transactionsForCategory(txs, "dining").length);
  });
});

describe("aggregateCategorySpend", () => {
  test("includes interest and fees in spend breakdown", () => {
    const rows = aggregateCategorySpend([
      {
        id: "i1",
        description: "INTEREST CHARGES",
        amount: "62,006.75",
        categorySlug: "interest_fees",
        categoryLabel: "Interest & fees",
      },
      {
        id: "d1",
        description: "GRABFOOD",
        amount: "350.00",
        categorySlug: "dining",
      },
    ]);

    const interest = rows.find((row) => row.slug === "interest_fees");
    expect(interest).toEqual({
      slug: "interest_fees",
      label: "Interest & fees",
      total: 62006.75,
      count: 1,
    });
    expect(rows.reduce((sum, row) => sum + row.total, 0)).toBe(62356.75);
  });

  test("excludes payment credits from spend breakdown", () => {
    const rows = aggregateCategorySpend([
      {
        id: "p1",
        description: "CASH PAYMENT",
        amount: "5,000.00 (CR)",
        categorySlug: "payment_credit",
      },
    ]);
    expect(rows).toEqual([]);
  });
});
