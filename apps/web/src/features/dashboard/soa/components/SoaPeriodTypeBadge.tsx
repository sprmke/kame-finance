import { Fragment } from "react";

import { StatusBadge } from "@/components/shared/StatusBadge";

type SoaPeriodTypeBadgeProps = {
  mode: string;
  withinRangeLabel?: string | null;
};

export function SoaPeriodTypeBadge({
  mode,
  withinRangeLabel,
}: SoaPeriodTypeBadgeProps) {
  if (mode === "range") {
    return <StatusBadge label="Range" variant="muted" />;
  }

  if (withinRangeLabel) {
    return (
      <Fragment>
        <StatusBadge label="In range" variant="muted" />
      </Fragment>
    );
  }

  return null;
}
