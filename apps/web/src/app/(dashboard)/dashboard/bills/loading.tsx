import { DashboardPageHeader } from "@/components/shared/DashboardPageHeader";
import { RemindersHubContentSkeleton } from "@/components/shared/skeletons";

export default function RemindersLoading() {
  return (
    <div className="space-y-4">
      <DashboardPageHeader title="Reminders" />
      <RemindersHubContentSkeleton />
    </div>
  );
}
