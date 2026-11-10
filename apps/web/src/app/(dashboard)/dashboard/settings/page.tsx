import { Suspense } from "react";

import { TrpcHydrate } from "@/components/providers/TrpcHydrate";
import { SettingsPageSkeleton } from "@/components/shared/skeletons";
import { SettingsPage } from "@/features/dashboard/settings/components/SettingsPage";
import { prefetchForPage } from "@/server/ssr";

export const metadata = { title: "Settings" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section } = await searchParams;
  const state = await prefetchForPage((helpers) => {
    switch (section) {
      case "automations":
        return helpers.automations.list.prefetch();
      case "statements":
        return helpers.settings.getWorkflow.prefetch();
      case "categories":
        return Promise.all([
          helpers.transactionCategories.listUserCategories.prefetch(),
          helpers.transactionCategories.listRules.prefetch(),
        ]);
      case "ai":
        return helpers.aiKeys.getFormConfig.prefetch();
      default:
        return Promise.all([
          helpers.integrations.list.prefetch(),
          helpers.integrations.listGoogleAccounts.prefetch(),
          helpers.integrations.getFormConfigs.prefetch(),
          helpers.creditCards.list.prefetch(),
        ]);
    }
  });

  return (
    <TrpcHydrate state={state}>
      <Suspense fallback={<SettingsPageSkeleton />}>
        <SettingsPage />
      </Suspense>
    </TrpcHydrate>
  );
}
