"use client";

import { ReceiptPreviewDialog } from "@/features/dashboard/receipts/components/ReceiptPreviewDialog";
import {
  mergeReceiptStack,
  type ReceiptListItem,
} from "@/features/dashboard/receipts/lib/receipt-utils";

type PaymentReceiptPreviewProps = {
  receipts: ReceiptListItem[] | null;
  onOpenChange: (open: boolean) => void;
};

/** Receipt image plus the combined AI payment summary. */
export function PaymentReceiptPreview({
  receipts,
  onOpenChange,
}: PaymentReceiptPreviewProps) {
  const open = receipts !== null && receipts.length > 0;
  const summary = open ? mergeReceiptStack(receipts) : null;

  return (
    <ReceiptPreviewDialog
      open={open}
      onOpenChange={onOpenChange}
      receipt={summary}
      images={receipts ?? undefined}
    />
  );
}
