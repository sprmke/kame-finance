import { describe, expect, test } from "bun:test";

import { defaultSoaSubject } from "@/lib/db/schema/credit-cards";
import { buildMonthContext } from "@/lib/soa/month";
import { banks, buildGmailQuery, buildGmailQueryWithSubject } from "@/lib/soa/config";
import {
  mayaGmailSubjectClause,
  mayaStatementSubjectMatches,
} from "@/lib/soa/maya-statement-subject";

const BILLING =
  "Your Maya Black Credit Card billing statement is now available";
const DEPOSIT =
  "Your Maya Black Credit Card security deposit billing statement is now available";
const GENERIC =
  "Your Maya Credit Card billing statement is now available";

describe("mayaStatementSubjectMatches", () => {
  test("matches the longer billing subject from the card's default phrase", () => {
    expect(mayaStatementSubjectMatches(BILLING)).toBe(true);
    expect(mayaStatementSubjectMatches(BILLING, defaultSoaSubject("maya"))).toBe(
      true,
    );
  });

  test("matches a non-Black Maya billing subject when the card subject is blank", () => {
    expect(mayaStatementSubjectMatches(GENERIC)).toBe(true);
  });

  test("rejects security-deposit statements", () => {
    expect(mayaStatementSubjectMatches(DEPOSIT)).toBe(false);
    expect(mayaStatementSubjectMatches(DEPOSIT, defaultSoaSubject("maya"))).toBe(
      false,
    );
    expect(mayaStatementSubjectMatches(DEPOSIT, "Maya Black")).toBe(false);
  });

  test("uses a custom card subject as the phrase to find", () => {
    expect(mayaStatementSubjectMatches(BILLING, BILLING)).toBe(true);
    expect(
      mayaStatementSubjectMatches(
        "Your Other Bank billing statement is now available",
        defaultSoaSubject("maya"),
      ),
    ).toBe(false);
  });
});

describe("Maya Gmail query", () => {
  const october = buildMonthContext("10", "2026");
  const maya = banks.find((bank) => bank.id === "maya");

  test("default search uses the billing subject and the October received window", () => {
    expect(maya).toBeDefined();
    const query = buildGmailQuery(maya!, october);

    expect(query).toContain(
      'subject:("Your Maya Black Credit Card billing statement" OR "Your Maya Credit Card billing statement")',
    );
    expect(query).toContain('-subject:"security deposit"');
    expect(query).toContain("after:2026/9/30");
    expect(query).toContain("before:2026/11/1");
    expect(query).not.toContain("Oct 2026");
    expect(query).not.toContain("October 2026");
  });

  test("a custom card subject is the phrase Gmail searches", () => {
    expect(maya).toBeDefined();
    const query = buildGmailQueryWithSubject(maya!, october, BILLING);

    expect(query).toBe(
      `(${mayaGmailSubjectClause(BILLING)}) after:2026/9/30 before:2026/11/1`,
    );
    expect(query).toContain(`subject:"${BILLING}"`);
    expect(query).toContain('-subject:"security deposit"');
    expect(query).not.toContain("October 2026");
  });

  test("other banks still require the spelled-out statement month", () => {
    const bpi = banks.find((bank) => bank.id === "bpi");
    expect(bpi).toBeDefined();
    const query = buildGmailQuery(bpi!, october);
    expect(query).toContain('"Oct 2026"');
    expect(query).toContain('"October 2026"');
  });
});
