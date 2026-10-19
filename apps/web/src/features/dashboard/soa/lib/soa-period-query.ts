import type { Route } from "next";

import { ROUTES } from "@/config/routes";

export const SOA_PERIOD_TABS = [
  "overview",
  "cards",
  "transactions",
  "analytics",
] as const;

export type SoaPeriodTab = (typeof SOA_PERIOD_TABS)[number];

const CATEGORY_SLUG = /^[a-z][a-z0-9_]{0,40}$/;

type QueryReader = {
  get(name: string): string | null;
};

export function parseSoaPeriodQuery(params: QueryReader): {
  tab: SoaPeriodTab;
  category: string | null;
} {
  const rawTab = params.get("tab");
  const tab = SOA_PERIOD_TABS.includes(rawTab as SoaPeriodTab)
    ? (rawTab as SoaPeriodTab)
    : "overview";
  const rawCategory = params.get("category");
  const category =
    tab === "analytics" && rawCategory && CATEGORY_SLUG.test(rawCategory)
      ? rawCategory
      : null;
  return { tab, category };
}

export function soaPeriodSearch(options: {
  tab?: SoaPeriodTab;
  category?: string | null;
}): string {
  const params = new URLSearchParams();
  const tab = options.tab ?? "overview";
  if (tab !== "overview") params.set("tab", tab);
  if (
    tab === "analytics" &&
    options.category &&
    CATEGORY_SLUG.test(options.category)
  ) {
    params.set("category", options.category);
  }
  return params.toString();
}

export function soaPeriodHref(
  periodId: string,
  options?: { tab?: SoaPeriodTab; category?: string | null },
): Route {
  const query = soaPeriodSearch(options ?? {});
  const path = ROUTES.dashboard.soaPeriod(periodId);
  return (query ? `${path}?${query}` : path) as Route;
}
