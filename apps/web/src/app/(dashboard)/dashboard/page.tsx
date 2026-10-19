import { TrpcHydrate } from "@/components/providers/TrpcHydrate";
import { OverviewPage } from "@/features/dashboard/overview/components/OverviewPage";
import {
  overviewStatsInput,
  parseOverviewPeriod,
} from "@/features/dashboard/overview/lib/overview-period";
import { prefetchForPage } from "@/server/ssr";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    grain?: string;
    year?: string;
    month?: string;
  }>;
}) {
  const params = await searchParams;
  const period = parseOverviewPeriod(params);
  const state = await prefetchForPage((helpers) =>
    helpers.overview.stats.prefetch(overviewStatsInput(period)),
  );

  return (
    <TrpcHydrate state={state}>
      <OverviewPage
        grain={period.grain}
        year={period.year}
        month={period.month}
      />
    </TrpcHydrate>
  );
}
