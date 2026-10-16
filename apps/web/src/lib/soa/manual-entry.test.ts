import { describe, expect, test } from "bun:test";

import {
  encodeTransactionAmount,
  formatSoaMoney,
  netManualTransactionTotal,
} from "./manual-entry";

describe("formatSoaMoney", () => {
  test("formats pesos with cents", () => {
    expect(formatSoaMoney(1234.5)).toBe("1,234.50");
  });

  test("keeps a zero balance", () => {
    expect(formatSoaMoney(0)).toBe("0.00");
  });

  test("clamps a credit balance to zero", () => {
    expect(formatSoaMoney(-40)).toBe("0.00");
  });
});

describe("netManualTransactionTotal", () => {
  test("sums charges", () => {
    expect(
      netManualTransactionTotal([
        { description: "Grocery", amount: encodeTransactionAmount(100, false) },
        { description: "Cafe", amount: encodeTransactionAmount(50.5, false) },
      ]),
    ).toBe(150.5);
  });

  test("subtracts credits marked on the amount", () => {
    expect(
      netManualTransactionTotal([
        { description: "Store", amount: encodeTransactionAmount(100, false) },
        { description: "Refund", amount: encodeTransactionAmount(40, true) },
      ]),
    ).toBe(60);
  });

  test("subtracts payment lines", () => {
    expect(
      netManualTransactionTotal([
        { description: "Store", amount: "100.00" },
        { description: "Payment - thank you", amount: "30.00" },
      ]),
    ).toBe(70);
  });

  test("does not treat prepaid purchases as payments", () => {
    expect(
      netManualTransactionTotal([
        { description: "Prepaid load", amount: "100.00" },
      ]),
    ).toBe(100);
  });

  test("floors an overpaid set of lines at zero", () => {
    expect(
      netManualTransactionTotal([
        { description: "Payment", amount: encodeTransactionAmount(80, true) },
      ]),
    ).toBe(0);
  });
});
