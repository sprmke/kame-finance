"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Play, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DashboardPageHeader } from "@/components/shared/DashboardPageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Amount } from "@/components/shared/Amount";
import { ErrorState } from "@/components/shared/ErrorState";
import { FigureLine } from "@/components/shared/Ledger";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SoaListContentSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { api } from "@/lib/api/client";
import { startNavigationProgress } from "@/lib/navigation-progress";
import {
  dedupedStatementsMessage,
  deletedStatementsMessage,
} from "@/lib/utils/toast-messages";

import { EditSoaPeriodDialog } from "./EditSoaPeriodDialog";
import { RunSoaDialog } from "./RunSoaDialog";
import { SoaPeriodList } from "./SoaPeriodList";
import type { SoaPeriodRow } from "./SoaPeriodTable";
import { useSoaRunDialog } from "../hooks/use-soa-run-dialog";
import { periodToRunInitial } from "../lib/run-soa-progress";
import { computeSoaListStats } from "../lib/soa-utils";

export function SoaListPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const periodsQuery = api.soa.listPeriods.useQuery();
  const { data: periods, isLoading } = periodsQuery;

  const listStats = useMemo(
    () => (periods?.length ? computeSoaListStats(periods) : null),
    [periods],
  );

  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { openRun, runDialogProps } = useSoaRunDialog({
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
      if (periodId) {
        startNavigationProgress();
        router.push(ROUTES.dashboard.statementPeriod(periodId));
      }
    },
  });

  const deletePeriod = api.soa.deletePeriod.useMutation({
    onSuccess: (r) => {
      toast.success(deletedStatementsMessage(r.removed));
      setDeleteId(null);
      void utils.soa.listPeriods.invalidate();
      void utils.overview.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const dedupe = api.soa.dedupe.useMutation({
    onSuccess: (r) => {
      toast.success(dedupedStatementsMessage(r.removed));
      void utils.soa.listPeriods.invalidate();
      void utils.soa.getPeriod.invalidate();
      void utils.reminders.listDue.invalidate();
      void utils.overview.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function openRerun(period: SoaPeriodRow) {
    openRun(periodToRunInitial(period), { rerun: true });
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Statements"
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More statement actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem disabled={dedupe.isPending} onSelect={() => dedupe.mutate()}>
                  <Sparkles />
                  Clean up duplicates
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => openRun()}>
              <Play />
              Run SOA
            </Button>
          </>
        }
        meta={
          listStats ? (
            <FigureLine
              items={[
                {
                  key: "due",
                  figure: <Amount value={listStats.totalDue} size="lg" />,
                  label: "Latest total due",
                },
                {
                  key: "statements",
                  figure: <span className="font-numeral text-2xl leading-none">{listStats.statements}</span>,
                  label: "Statements",
                },
                {
                  key: "last-run",
                  figure: (
                    <span className="font-numeral text-2xl leading-none">
                      {listStats.lastRunAt
                        ? listStats.lastRunAt.toLocaleDateString("en-PH", { month: "short", day: "numeric" })
                        : "—"}
                    </span>
                  ),
                  label: "Last run",
                },
              ]}
            />
          ) : null
        }
      />

      <RunSoaDialog {...runDialogProps} />

      <EditSoaPeriodDialog
        periodId={editId}
        open={!!editId}
        onOpenChange={(open) => !open && setEditId(null)}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete this statement month?"
        description="Statements in this date range will be removed."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteId) deletePeriod.mutate({ periodId: deleteId });
        }}
      />

      {periodsQuery.error && !periods ? (
        <ErrorState
          title="Couldn't load statements"
          error={periodsQuery.error}
          onRetry={() => void periodsQuery.refetch()}
        />
      ) : isLoading ? (
        <SoaListContentSkeleton />
      ) : !periods?.length ? (
        <EmptyState
          title="No statements yet"
          message="Run SOA to fetch this month's statements from Gmail."
          action={
            <Button onClick={() => openRun()}>
              <Play />
              Run SOA
            </Button>
          }
        />
      ) : (
        <SoaPeriodList
          periods={periods}
          onRerun={openRerun}
          onEdit={setEditId}
          onDelete={setDeleteId}
        />
      )}
    </div>
  );
}
