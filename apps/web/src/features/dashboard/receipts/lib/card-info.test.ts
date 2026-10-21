import { describe, expect, test } from "bun:test";

import {
  buildCardInfoFields,
  copyAmount,
  maskPan,
  toIsoDate,
} from "./card-info";

describe("card info copy formats", () => {
  test("masks the number and copies digits only", () => {
    expect(maskPan("4111111111112600")).toBe("**** **** **** 2600");
    const fields = buildCardInfoFields({
      request: {
        issuerId: "unionbank",
        cardLast4: "2600",
        label: "Unionbank Rewards",
        periodKey: "2026-10",
        minimumDue: "—",
        totalDue: "—",
        dueDateYmd: "2026-11-10",
        statementDate: null,
      },
      cards: [
        {
          issuer: "unionbank",
          last4: "2600",
          label: "Unionbank Rewards",
          fullPan: "4111 1111 1111 2600",
          cardNetwork: "visa",
          statementDay: 7,
        },
      ],
      statements: [],
    });
    const number = fields.find((field) => field.id === "number");
    expect(number?.display).toBe("**** **** **** 2600");
    expect(number?.copyValue).toBe("4111111111112600");
    expect(fields.find((field) => field.id === "type")?.copyValue).toBe("Visa");
    expect(fields.find((field) => field.id === "due")?.copyValue).toBe(
      "2026-11-10",
    );
    expect(fields.find((field) => field.id === "statement")?.copyValue).toBe(
      "2026-10-07",
    );
  });

  test("copies amounts without commas or currency", () => {
    expect(copyAmount("60,924.00")).toBe("60924.00");
    expect(copyAmount("₱ 2,030,795.50")).toBe("2030795.50");
    expect(copyAmount("—")).toBeNull();
    expect(toIsoDate("Nov 10, 2026")).toBe("2026-11-10");
  });
});
