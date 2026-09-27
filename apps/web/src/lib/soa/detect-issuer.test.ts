import { describe, expect, it } from "vitest";

import { detectIssuerFromSoaText, parseIssuerId } from "./detect-issuer";

describe("detectIssuerFromSoaText", () => {
  it("detects metrobank", () => {
    expect(
      detectIssuerFromSoaText("Metrobank Credit Card MSOA Statement"),
    ).toBe("metrobank");
  });

  it("detects rcbc", () => {
    expect(detectIssuerFromSoaText("RCBC FLEX VISA eStatement")).toBe("rcbc");
  });

  it("detects bpi", () => {
    expect(
      detectIssuerFromSoaText(
        "BPI Credit Card Electronic Statement of Account",
      ),
    ).toBe("bpi");
  });

  it("detects bpi from letter-spaced pdf.js text", () => {
    expect(
      detectIssuerFromSoaText(
        "S t a t e m e n t   o f   A c c o u n t\nB P I   A M O R E C A S H B A C K C A R D",
      ),
    ).toBe("bpi");
  });

  it("detects unionbank", () => {
    expect(
      detectIssuerFromSoaText("Unionbank REWARDS VISA PLATINUM e-Statement"),
    ).toBe("unionbank");
  });

  it("detects bdo", () => {
    expect(detectIssuerFromSoaText("BDO Unibank Credit Card Statement")).toBe(
      "bdo",
    );
  });

  it("detects security bank", () => {
    expect(
      detectIssuerFromSoaText("Security Bank Mastercard e-Statement"),
    ).toBe("security-bank");
  });

  it("detects maya", () => {
    expect(
      detectIssuerFromSoaText(
        "Your Maya Black Credit Card billing statement is now available",
      ),
    ).toBe("maya");
  });

  it("detects uniondigital without confusing unionbank", () => {
    expect(
      detectIssuerFromSoaText("UnionDigital Bank Credit Card Statement"),
    ).toBe("uniondigital-bank");
  });

  it("returns null when unknown", () => {
    expect(detectIssuerFromSoaText("Random shopping receipt")).toBeNull();
  });
});

describe("parseIssuerId", () => {
  it("accepts slugs and Kame Homes labels", () => {
    expect(parseIssuerId("bdo")).toBe("bdo");
    expect(parseIssuerId("BDO")).toBe("bdo");
    expect(parseIssuerId("Security Bank")).toBe("security-bank");
    expect(parseIssuerId("not-a-bank")).toBeNull();
  });
});
