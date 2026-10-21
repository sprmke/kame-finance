"use client";

import { ReceiptBatchTransactionChoice } from "@/components/shared/ReceiptBatchTransactionChoice";
import { ReceiptBatchUploadProgressDialog } from "@/components/shared/ReceiptBatchUploadProgressDialog";
import type { useReceiptUploadFlow } from "@/hooks/use-receipt-upload-flow";

type ReceiptUploadFlow = ReturnType<typeof useReceiptUploadFlow>;

type ReceiptUploadDialogsProps = {
  flow: ReceiptUploadFlow;
  onComplete?: () => void;
};

/** Choice and progress for every receipt upload entry point. */
export function ReceiptUploadDialogs({
  flow,
  onComplete,
}: ReceiptUploadDialogsProps) {
  return (
    <>
      <ReceiptBatchTransactionChoice
        open={flow.transactionChoiceOpen}
        fileCount={flow.transactionChoiceCount}
        onConfirm={flow.confirmTransactionChoice}
        onCancel={flow.cancelTransactionChoice}
      />
      <ReceiptBatchUploadProgressDialog
        open={flow.progressOpen}
        onOpenChange={flow.handleProgressOpenChange}
        jobs={flow.cardJobs}
        options={flow.uploadOptions}
        isPending={flow.isPending}
        batchProgress={flow.batchProgress}
        onComplete={onComplete ?? flow.handleProgressComplete}
      />
    </>
  );
}
