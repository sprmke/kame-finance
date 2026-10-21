"use client";

import { Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type ViewPaymentReceiptButtonProps = {
  onClick?: () => void;
  count?: number;
  disabled?: boolean;
  layout?: "icon" | "block";
  /** Visible text for the block layout. Icon layout stays icon-only. */
  label?: string;
  className?: string;
};

function paymentSummaryLabel(count: number): string {
  return count > 1
    ? `View ${count} payment receipts`
    : "View payment summary";
}

export function ViewPaymentReceiptButton({
  onClick,
  count = 1,
  disabled = false,
  layout = "block",
  label,
  className,
}: ViewPaymentReceiptButtonProps) {
  const accessible = paymentSummaryLabel(count);

  if (layout === "icon") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("h-11 w-11 shrink-0", className)}
        aria-label={accessible}
        disabled={disabled}
        onClick={onClick}
      >
        <Receipt className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("h-11 w-full", className)}
      aria-label={accessible}
      disabled={disabled}
      onClick={onClick}
    >
      <Receipt className="mr-1.5 size-3.5" />
      {label ?? (count > 1 ? `View ${count} payments` : "View payment")}
    </Button>
  );
}
