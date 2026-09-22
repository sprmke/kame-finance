import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  BANK_ISSUERS,
  PH_BANK_ISSUERS,
  defaultSoaSubject,
  formatBankIssuer,
  isBankIssuer,
  issuersByGroup,
  normalizeBankIssuer,
  parseBankIssuerId,
} from "@/lib/db/schema/credit-cards";
import { banks } from "@/lib/soa/config";

describe("PH bank issuers", () => {
  it("keeps the original four parser banks", () => {
    expect(BANK_ISSUERS).toContain("metrobank");
    expect(BANK_ISSUERS).toContain("rcbc");
    expect(BANK_ISSUERS).toContain("bpi");
    expect(BANK_ISSUERS).toContain("unionbank");
  });

  it("ids are unique and fit varchar(32)", () => {
    const ids = PH_BANK_ISSUERS.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id.length).toBeGreaterThan(0);
      expect(id.length).toBeLessThanOrEqual(32);
    }
  });

  it("groups match Kame Homes e-wallet (card issuers), digital + traditional banks", () => {
    expect(issuersByGroup("ewallet").map((e) => e.label)).toEqual(["Maya"]);
    expect(issuersByGroup("digital_bank").map((e) => e.label)).toEqual([
      "MariBank",
      "GoTyme Bank",
      "UnionDigital Bank",
      "Tonik Bank",
      "UNO Digital Bank",
      "CIMB Bank Philippines",
    ]);
    expect(issuersByGroup("bank").map((e) => e.label)).toEqual([
      "BDO",
      "BPI",
      "Metrobank",
      "Unionbank",
      "Land Bank of the Philippines",
      "Security Bank",
      "RCBC",
      "Chinabank",
      "PNB",
      "EastWest Bank",
      "PSBank",
      "Robinsons Bank",
      "Asia United Bank",
      "Bank of Commerce",
    ]);
  });

  it("parses slugs, labels, and aliases", () => {
    expect(parseBankIssuerId("bdo")).toBe("bdo");
    expect(parseBankIssuerId("BDO")).toBe("bdo");
    expect(parseBankIssuerId("BDO Unibank")).toBe("bdo");
    expect(parseBankIssuerId("GoTyme Bank")).toBe("gotyme-bank");
    expect(parseBankIssuerId("Land Bank of the Philippines")).toBe("land-bank");
    expect(parseBankIssuerId("UnionBank")).toBe("unionbank");
    expect(parseBankIssuerId("PayMaya")).toBe("maya");
    expect(parseBankIssuerId("Maya Black Credit Card")).toBe("maya");
    expect(parseBankIssuerId("not-a-bank")).toBeNull();
    expect(isBankIssuer("bpi")).toBe(true);
    expect(isBankIssuer("hsbc")).toBe(false);
  });

  it("normalizeBankIssuer falls back to bpi", () => {
    expect(normalizeBankIssuer("security-bank")).toBe("security-bank");
    expect(normalizeBankIssuer("unknown")).toBe("bpi");
  });

  it("labels and default SOA subjects stay bank-specific", () => {
    expect(formatBankIssuer("bdo")).toBe("BDO");
    expect(formatBankIssuer("land-bank")).toBe("Land Bank of the Philippines");
    expect(defaultSoaSubject("bpi")).toContain("BPI");
    expect(defaultSoaSubject("bdo")).toContain("BDO");
    expect(defaultSoaSubject("maya")).toContain("Maya Black");
  });

  it("create/update validation accepts every catalog issuer", () => {
    const schema = z.enum(BANK_ISSUERS);
    expect(schema.parse("bdo")).toBe("bdo");
    expect(schema.parse("gotyme-bank")).toBe("gotyme-bank");
    expect(schema.safeParse("hsbc").success).toBe(false);
  });

  it("SOA Gmail banks cover the full catalog", () => {
    expect(banks.map((bank) => bank.id)).toEqual([...BANK_ISSUERS]);
    expect(banks.find((bank) => bank.id === "bdo")?.label).toBe("BDO");
  });
});
