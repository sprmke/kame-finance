import { describe, expect, test } from "bun:test";

import {
  expectedStatementDateYmd,
  isCardMissingCurrentSoa,
  isMissingSoaForStatementPeriod,
  isOnOrPastExpectedStatementDate,
  targetStatementMonthForCard,
} from "./billing-cycle";

describe("targetStatementMonthForCard", () => {
  test("applies gmail month offset", () => {
    expect(targetStatementMonthForCard("2026-03-15", -1)).toEqual({
      year: 2026,
      month: 2,
    });
    expect(targetStatementMonthForCard("2026-01-10", -1)).toEqual({
      year: 2025,
      month: 12,
    });
  });
});

describe("isOnOrPastExpectedStatementDate", () => {
  test("waits until configured statement day", () => {
    const schedule = {
      statementDay: 5,
      dueDay: 25,
      gmailMonthOffset: 0,
    };
    expect(
      isOnOrPastExpectedStatementDate("2026-03-04", schedule),
    ).toBe(false);
    expect(
      isOnOrPastExpectedStatementDate("2026-03-05", schedule),
    ).toBe(true);
    expect(
      isOnOrPastExpectedStatementDate("2026-03-20", schedule),
    ).toBe(true);
  });

  test("clamps statement day to month length", () => {
    expect(expectedStatementDateYmd(2026, 2, 31)).toBe("2026-02-28");
  });
});

describe("isCardMissingCurrentSoa", () => {
  const card = {
    id: "card-1",
    issuer: "bpi",
    last4: "0018",
    isActive: true,
    statementDay: 5,
    gmailMonthOffset: 0,
  };

  test("stays quiet before the statement day", () => {
    expect(isCardMissingCurrentSoa("2026-03-04", card, [])).toBe(false);
  });

  test("flags the card once the statement day passes without an SOA", () => {
    expect(isCardMissingCurrentSoa("2026-03-05", card, [])).toBe(true);
  });

  test("clears when a parsed statement exists for that month", () => {
    expect(
      isCardMissingCurrentSoa("2026-03-20", card, [
        {
          creditCardId: "card-1",
          issuerId: "bpi",
          cardLast4: "0018",
          statementYear: 2026,
          statementMonth: 3,
          soaUnavailable: false,
          dueDateYmd: "2026-04-01",
        },
      ]),
    ).toBe(false);
  });

  test("ignores unavailable placeholders and inactive cards", () => {
    expect(
      isCardMissingCurrentSoa("2026-03-20", card, [
        {
          creditCardId: "card-1",
          issuerId: "bpi",
          cardLast4: "0018",
          statementYear: 2026,
          statementMonth: 3,
          soaUnavailable: true,
          dueDateYmd: null,
        },
      ]),
    ).toBe(true);
    expect(
      isCardMissingCurrentSoa(
        "2026-03-20",
        { ...card, isActive: false },
        [],
      ),
    ).toBe(false);
    expect(
      isCardMissingCurrentSoa(
        "2026-03-20",
        { ...card, statementDay: null },
        [],
      ),
    ).toBe(false);
  });
});

describe("isMissingSoaForStatementPeriod", () => {
  test("requires an unavailable row and a passed statement day", () => {
    const statement = {
      soaUnavailable: true,
      statementYear: 2026,
      statementMonth: 10,
    };
    expect(isMissingSoaForStatementPeriod("2026-10-04", statement, 5)).toBe(
      false,
    );
    expect(isMissingSoaForStatementPeriod("2026-10-05", statement, 5)).toBe(
      true,
    );
    expect(
      isMissingSoaForStatementPeriod("2026-10-19", {
        ...statement,
        soaUnavailable: false,
      }, 5),
    ).toBe(false);
  });
});
