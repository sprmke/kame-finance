"use client";

import type { LucideIcon } from "lucide-react";
import { FileText } from "lucide-react";

import { StatusBadge } from "@/components/shared/StatusBadge";
import { ViewPaymentReceiptButton } from "@/components/shared/ViewPaymentReceiptButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function StatementPaidBadge({ paid }: { paid: boolean }) {
  return (
    <StatusBadge
      label={paid ? "Paid" : "Unpaid"}
      variant={paid ? "success" : "muted"}
      className="whitespace-nowrap"
    />
  );
}

type StatementDocumentButtonProps = {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  count?: number;
  className?: string;
};

export function StatementDocumentButton({
  label,
  icon: Icon,
  onClick,
  count = 0,
  className,
}: StatementDocumentButtonProps) {
  if (!onClick) {
    return (
      <span className="text-sm text-muted-foreground">
        —
        <span className="sr-only">No {label}</span>
      </span>
    );
  }

  const accessible =
    count > 1 ? `View ${count} ${label}` : `View ${label}`;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("h-11 w-11 shrink-0", className)}
      aria-label={accessible}
      onClick={onClick}
    >
      <Icon className="size-4" />
      {count > 1 ? (
        <span className="sr-only">{count}</span>
      ) : null}
    </Button>
  );
}

export function StatementSoaButton({
  onClick,
}: {
  onClick?: () => void;
}) {
  return (
    <StatementDocumentButton label="SOA" icon={FileText} onClick={onClick} />
  );
}

export function StatementPaymentButton({
  onClick,
  count = 0,
}: {
  onClick?: () => void;
  count?: number;
}) {
  if (!onClick || count < 1) {
    return (
      <span className="text-sm text-muted-foreground">
        —
        <span className="sr-only">No payment summary</span>
      </span>
    );
  }

  return <ViewPaymentReceiptButton layout="icon" count={count} onClick={onClick} />;
}

const eyebrowClass =
  "text-[10px] font-medium uppercase tracking-wider text-muted-foreground";

export function StatementSettlementRow({
  paid,
  paidReady = true,
  onPreviewSoa,
  onPreviewPayment,
  paymentCount,
}: {
  paid: boolean;
  paidReady?: boolean;
  onPreviewSoa?: () => void;
  onPreviewPayment?: () => void;
  paymentCount: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-lg border border-border/80 bg-muted/30 p-3">
      <div className="min-w-0 space-y-1.5">
        <p className={eyebrowClass}>Paid</p>
        {paidReady ? (
          <StatementPaidBadge paid={paid} />
        ) : (
          <p className="flex h-11 items-center text-sm text-muted-foreground">
            —
          </p>
        )}
      </div>
      <div className="min-w-0 space-y-1.5">
        <p className={eyebrowClass}>SOA</p>
        {onPreviewSoa ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-11 w-full"
            aria-label="View SOA"
            onClick={onPreviewSoa}
          >
            <FileText className="mr-1.5 size-3.5" />
            View
          </Button>
        ) : (
          <p className="flex h-11 items-center text-sm text-muted-foreground">
            —
            <span className="sr-only">No SOA</span>
          </p>
        )}
      </div>
      <div className="min-w-0 space-y-1.5">
        <p className={eyebrowClass}>Payment</p>
        {paymentCount > 0 && onPreviewPayment ? (
          <ViewPaymentReceiptButton
            count={paymentCount}
            label="View"
            onClick={onPreviewPayment}
          />
        ) : (
          <p className="flex h-11 items-center text-sm text-muted-foreground">
            —
            <span className="sr-only">No payment receipt</span>
          </p>
        )}
      </div>
    </div>
  );
}
