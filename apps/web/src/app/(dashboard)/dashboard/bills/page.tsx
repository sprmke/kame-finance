import { Suspense } from "react";

import { TrpcHydrate } from "@/components/providers/TrpcHydrate";
import { RemindersContentSkeleton } from "@/components/shared/skeletons";
import { BillsPage } from "@/features/dashboard/bills/components/BillsPage";
import { prefetchForPage } from "@/server/ssr";

export const metadata = { title: "Bills" };

export default async function Page() {
  const state = await prefetchForPage((helpers) =>
    Promise.all([
      helpers.reminders.listDue.prefetch({ unpaidOnly: false }),
      helpers.reminders.status.prefetch(),
      helpers.receipts.list.prefetch(),
      helpers.creditCards.list.prefetch(),
      helpers.integrations.list.prefetch(),
    ]),
  );

  return (
    <TrpcHydrate state={state}>
      <Suspense fallback={<RemindersContentSkeleton />}>
        <BillsPage />
      </Suspense>
    </TrpcHydrate>
  );
}
