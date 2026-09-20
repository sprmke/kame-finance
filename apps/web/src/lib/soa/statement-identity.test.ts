import { describe, expect, test } from "bun:test";

import {
  pickCanonicalSoaStatements,
  soaStatementIdentityKey,
} from "./statement-identity";

function row(
  overrides: Partial<{
    id: string;
    issuerId: string;
    cardLast4: string;
    statementMonth: number;
    statementYear: number;
    soaUnavailable: boolean | null;
    createdAt: Date;
  }> = {},
) {
  return {
    id: "a",
    issuerId: "metrobank",
    cardLast4: "3746",
    statementMonth: 9,
    statementYear: 2026,
    soaUnavailable: false,
    createdAt: new Date("2026-09-20T00:00:00Z"),
    ...overrides,
  };
}

describe("soaStatementIdentityKey", () => {
  test("treats issuer case and last-4 punctuation as the same card", () => {
    expect(
      soaStatementIdentityKey({
        issuerId: "Metrobank",
        cardLast4: "3746",
        statementMonth: 9,
        statementYear: 2026,
      }),
    ).toBe(
      soaStatementIdentityKey({
        issuerId: "metrobank",
        cardLast4: "•3746",
        statementMonth: 9,
        statementYear: 2026,
      }),
    );
  });
});

describe("pickCanonicalSoaStatements", () => {
  test("keeps one real statement when two Gmail messages parsed the same card", () => {
    const newer = row({
      id: "newer",
      createdAt: new Date("2026-09-21T00:00:00Z"),
    });
    const older = row({
      id: "older",
      createdAt: new Date("2026-09-10T00:00:00Z"),
    });

    const picked = pickCanonicalSoaStatements([older, newer]);

    expect(picked.keep.map((r) => r.id)).toEqual(["newer"]);
    expect(picked.drop.map((r) => r.id)).toEqual(["older"]);
  });

  test("keeps a real statement over a newer unavailable placeholder", () => {
    const placeholder = row({
      id: "placeholder",
      soaUnavailable: true,
      createdAt: new Date("2026-09-21T00:00:00Z"),
    });
    const real = row({
      id: "real",
      soaUnavailable: false,
      createdAt: new Date("2026-09-10T00:00:00Z"),
    });

    const picked = pickCanonicalSoaStatements([placeholder, real]);

    expect(picked.keep.map((r) => r.id)).toEqual(["real"]);
    expect(picked.drop.map((r) => r.id)).toEqual(["placeholder"]);
  });

  test("keeps distinct cards in the same period", () => {
    const mb = row({ id: "mb", cardLast4: "3746" });
    const rcbc = row({
      id: "rcbc",
      issuerId: "rcbc",
      cardLast4: "7015",
    });

    const picked = pickCanonicalSoaStatements([mb, rcbc]);

    expect(picked.keep.map((r) => r.id).sort()).toEqual(["mb", "rcbc"]);
    expect(picked.drop).toEqual([]);
  });
});
