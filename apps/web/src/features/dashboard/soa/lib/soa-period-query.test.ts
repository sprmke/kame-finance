import { describe, expect, test } from "vitest";

import {
  parseSoaPeriodQuery,
  soaPeriodHref,
  soaPeriodSearch,
} from "./soa-period-query";

describe("soa period query", () => {
  test("defaults to the overview tab", () => {
    expect(parseSoaPeriodQuery(new URLSearchParams())).toEqual({
      tab: "overview",
      category: null,
    });
  });

  test("reads analytics category drill-down", () => {
    expect(
      parseSoaPeriodQuery(
        new URLSearchParams("tab=analytics&category=interest_fees"),
      ),
    ).toEqual({ tab: "analytics", category: "interest_fees" });
    expect(
      parseSoaPeriodQuery(new URLSearchParams("tab=analytics&category=u_rent")),
    ).toEqual({ tab: "analytics", category: "u_rent" });
  });

  test("ignores a category outside analytics and unknown tabs", () => {
    expect(
      parseSoaPeriodQuery(
        new URLSearchParams("tab=cards&category=interest_fees"),
      ),
    ).toEqual({ tab: "cards", category: null });
    expect(
      parseSoaPeriodQuery(new URLSearchParams("tab=nope&category=dining")),
    ).toEqual({ tab: "overview", category: null });
    expect(
      parseSoaPeriodQuery(
        new URLSearchParams("tab=analytics&category=Not A Slug"),
      ),
    ).toEqual({ tab: "analytics", category: null });
  });

  test("builds a category breakdown URL", () => {
    expect(soaPeriodSearch({ tab: "analytics", category: "dining" })).toBe(
      "tab=analytics&category=dining",
    );
    expect(soaPeriodHref("period-1", { tab: "overview" })).toBe(
      "/dashboard/soa/period-1",
    );
    expect(
      soaPeriodHref("period-1", {
        tab: "analytics",
        category: "interest_fees",
      }),
    ).toBe("/dashboard/soa/period-1?tab=analytics&category=interest_fees");
  });
});
