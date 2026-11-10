"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";

import { ReceiptUploadDialogs } from "@/components/shared/ReceiptUploadDialogs";
import { ROUTES } from "@/config/routes";
import { RunSoaDialog } from "@/features/dashboard/soa/components/RunSoaDialog";
import { useSoaRunDialog } from "@/features/dashboard/soa/hooks/use-soa-run-dialog";
import { useReceiptUploadFlow } from "@/hooks/use-receipt-upload-flow";
import { api } from "@/lib/api/client";
import { startNavigationProgress } from "@/lib/navigation-progress";

type QuickActions = {
  /** Opens the Run SOA dialog in place; navigates to the period when it finishes. */
  runSoa: () => void;
  /** Opens the file picker (must be called from a user gesture). */
  uploadReceipt: (dueEntryId?: string) => void;
  addCard: () => void;
  receiptUploadPending: boolean;
  runSoaPending: boolean;
};

const QuickActionsContext = createContext<QuickActions | null>(null);

/** One place that owns the cross-module actions, so every screen can start them. */
export function QuickActionsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const utils = api.useUtils();
  const { data: integrations } = api.integrations.list.useQuery(undefined, {
    staleTime: 1000 * 60 * 10,
  });
  const connected = useMemo(
    () => new Set(integrations?.map((i) => i.provider) ?? []),
    [integrations],
  );

  const receiptUpload = useReceiptUploadFlow(connected);

  const { openRun, runDialogProps, runPipeline } = useSoaRunDialog({
    onRunSuccess: (result) => {
      void utils.soa.listPeriods.invalidate();
      void utils.soa.getPeriod.invalidate();
      void utils.overview.stats.invalidate();
      void utils.reminders.listDue.invalidate();
      if (result.periodId) {
        void utils.soa.getPeriod.prefetch({ periodId: result.periodId });
      }
    },
    onAfterRunComplete: (periodId) => {
      if (!periodId) return;
      startNavigationProgress();
      router.push(ROUTES.dashboard.statementPeriod(periodId) as Route);
    },
  });

  const runSoa = useCallback(() => openRun(), [openRun]);
  const uploadReceipt = useCallback(
    (dueEntryId?: string) => receiptUpload.triggerFilePicker(dueEntryId),
    [receiptUpload],
  );
  const addCard = useCallback(() => {
    startNavigationProgress();
    router.push(`${ROUTES.dashboard.cards}?add=1` as Route);
  }, [router]);

  const value = useMemo<QuickActions>(
    () => ({
      runSoa,
      uploadReceipt,
      addCard,
      receiptUploadPending: receiptUpload.isPending,
      runSoaPending: runPipeline.isPending,
    }),
    [runSoa, uploadReceipt, addCard, receiptUpload.isPending, runPipeline.isPending],
  );

  return (
    <QuickActionsContext.Provider value={value}>
      {children}
      <input
        ref={receiptUpload.fileRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={receiptUpload.handleFileInputChange}
      />
      <ReceiptUploadDialogs flow={receiptUpload} />
      <RunSoaDialog {...runDialogProps} />
    </QuickActionsContext.Provider>
  );
}

export function useQuickActions(): QuickActions {
  const context = useContext(QuickActionsContext);
  if (!context) {
    throw new Error("useQuickActions must be used inside QuickActionsProvider");
  }
  return context;
}
