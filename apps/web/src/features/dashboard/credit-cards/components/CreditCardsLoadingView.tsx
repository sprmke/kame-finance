"use client";

import { CreditCardsPageSkeleton } from "@/components/shared/skeletons";
import type { ViewMode } from "@/components/shared/ViewToggle";

export function CreditCardsLoadingView({
  viewMode,
}: {
  viewMode?: ViewMode;
}) {
  return <CreditCardsPageSkeleton viewMode={viewMode} />;
}
