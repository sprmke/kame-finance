import { describe, expect, test } from "bun:test";

import { receiptPaymentStackKey } from "./receipt-stack";

describe("receiptPaymentStackKey", () => {
  test("uses the due entry when payments share a cycle", () => {
    const key = receiptPaymentStackKey({
      dueEntryId: "due-1",
      parsedCardLast4: "7015",
      bankDetected: "rcbc",
      statementPeriodKey: "2026-08",
    });

    expect(key).toBe("due:due-1");
    expect(
      receiptPaymentStackKey({
        dueEntryId: "due-1",
        parsedCardLast4: "7015",
        statementPeriodKey: "2026-08",
      }),
    ).toBe(key);
  });

  test("keeps different cards apart when no due entry is linked", () => {
    const rcbc = receiptPaymentStackKey({
      parsedCardLast4: "7015",
      bankDetected: "rcbc",
      statementPeriodKey: "2026-08",
    });
    const bpi = receiptPaymentStackKey({
      parsedCardLast4: "1234",
      bankDetected: "bpi",
      statementPeriodKey: "2026-08",
    });

    expect(rcbc).not.toBe(bpi);
  });

  test("keeps different statement periods apart", () => {
    const august = receiptPaymentStackKey({
      parsedCardLast4: "7015",
      bankDetected: "rcbc",
      statementPeriodKey: "2026-08",
    });
    const september = receiptPaymentStackKey({
      parsedCardLast4: "7015",
      bankDetected: "rcbc",
      statementPeriodKey: "2026-09",
    });

    expect(august).not.toBe(september);
  });
});
