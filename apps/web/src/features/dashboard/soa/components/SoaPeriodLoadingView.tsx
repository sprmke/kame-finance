"use client";

import { useSearchParams } from "next/navigation";

import { SoaPeriodPageSkeleton } from "@/components/shared/skeletons";

import { parseSoaPeriodQuery } from "../lib/soa-period-query";

/**
 * Route-level loading UI for a SOA period. Reads `?tab=` so the skeleton
 * matches the tab that will render (overview, cards, transactions, analytics).
 */
export function SoaPeriodLoadingView() {
  const searchParams = useSearchParams();
  const { tab } = parseSoaPeriodQuery(searchParams);

  return <SoaPeriodPageSkeleton tab={tab} />;
}
