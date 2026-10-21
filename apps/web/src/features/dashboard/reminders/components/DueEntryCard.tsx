"use client";

import { CheckCircle2, RotateCcw } from "lucide-react";

import {
  MISSING_SOA_LABEL,
  MissingSoaNotice,
} from "@/components/shared/MissingSoaBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ViewPaymentReceiptButton } from "@/components/shared/ViewPaymentReceiptButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

import {
  dueCardLabel,
  formatDueCardTitle,
  type DueEntryListItem,
} from "../lib/reminder-utils";

function statusVariant(
  status: string,
): "success" | "warning" | "muted" | "default" {
  if (status === "in_window_ready") return "warning";
  if (status === "paid") return "success";
  if (status === "in_window_already_sent") return "default";
  return "muted";
}

type DueEntryCardProps = {
  entry: DueEntryListItem;
  reminderStatus?: {
    statusLabel: string;
    status: string;
  };
  onMarkPaid?: () => void;
  onMarkUnpaid?: () => void;
  onViewPayment?: () => void;
  paymentCount?: number;
  /** Keep the schedule row’s height when a sibling card in the group has one. */
  reserveScheduleRow?: boolean;
  disabled?: boolean;
};

function displayDueAmount(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed === "—" || trimmed === "–" || trimmed === "-") {
    return "-";
  }
  return trimmed;
}

export function DueEntryCard({
  entry,
  reminderStatus,
  onMarkPaid,
  onMarkUnpaid,
  onViewPayment,
  paymentCount = 0,
  reserveScheduleRow = false,
  disabled,
}: DueEntryCardProps) {
  const paid = Boolean(entry.paidAt);
  const awaitingStatement = entry.source === "expected";
  const soaMissing = entry.soaMissing ?? awaitingStatement;
  const title = formatDueCardTitle(entry);
  const cardLabel = dueCardLabel(entry);
  const showCardLabel = cardLabel !== title && !title.includes(cardLabel);
  const canViewPayment = paymentCount > 0 && Boolean(onViewPayment);
  const scheduleLabel = !paid ? reminderStatus?.statusLabel : null;

  return (
    <Card
      className={cn(
        "flex h-full flex-col border-border/80 shadow-card",
        paid && "opacity-90",
      )}
    >
      <CardHeader className="flex shrink-0 flex-row items-start justify-between gap-2 pb-2">
        <div className="min-w-0 space-y-0.5">
          <CardTitle
            className="truncate font-display text-sm font-semibold leading-snug"
            title={title}
          >
            {title}
          </CardTitle>
          {showCardLabel ? (
            <p className="truncate text-xs text-muted-foreground">
              {cardLabel}
            </p>
          ) : null}
          <p className="text-[11px] text-muted-foreground">
            Due {entry.dueDate}
          </p>
        </div>
        <StatusBadge
          label={
            soaMissing
              ? MISSING_SOA_LABEL
              : awaitingStatement
                ? "Pending"
                : paid
                  ? "Paid"
                  : "Unpaid"
          }
          variant={
            paid
              ? "success"
              : awaitingStatement && !soaMissing
                ? "muted"
                : "warning"
          }
        />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {soaMissing ? <MissingSoaNotice /> : null}
        {scheduleLabel ? (
          <StatusBadge
            label={scheduleLabel}
            variant={statusVariant(reminderStatus?.status ?? "muted")}
            className="h-11 w-full justify-center truncate px-3 text-center text-sm font-medium"
          />
        ) : reserveScheduleRow ? (
          <div className="h-11" aria-hidden />
        ) : null}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Minimum</span>
            <span className="font-medium tabular-nums">
              {displayDueAmount(entry.minimumDue)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Total due</span>
            <span className="font-semibold tabular-nums">
              {displayDueAmount(entry.totalDue)}
            </span>
          </div>
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <ViewPaymentReceiptButton
            count={paymentCount}
            disabled={!canViewPayment}
            onClick={canViewPayment ? onViewPayment : undefined}
          />
          {paid ? (
            <Button
              variant="outline"
              className="h-11 w-full"
              onClick={onMarkUnpaid}
              disabled={disabled}
            >
              <RotateCcw />
              Mark unpaid
            </Button>
          ) : (
            <Button
              className="h-11 w-full"
              onClick={onMarkPaid}
              disabled={disabled || awaitingStatement}
            >
              <CheckCircle2 />
              Mark paid
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
