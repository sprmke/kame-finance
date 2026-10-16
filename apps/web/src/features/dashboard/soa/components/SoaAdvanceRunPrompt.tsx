"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api/client";
import { todayYmdInTimezone } from "@/lib/soa/calendar-dates";
import {
  dismissAdvancePrompt,
  formatStatementMonthLabel,
  hasSoaPeriodForMonth,
  isAdvancePromptDismissed,
  shouldOfferSoaAdvanceRun,
  soaAdvanceRunTargetMonth,
} from "@/lib/soa/advance-run-prompt";
import type { RunSoaFormValues } from "../lib/run-soa-progress";
import { RunSoaDialog } from "./RunSoaDialog";
import { useSoaRunDialog } from "../hooks/use-soa-run-dialog";

function buildInitialRunValues(
  month: number,
  year: number,
): Partial<RunSoaFormValues> {
  return {
    mode: "single",
    fromMonth: month,
    fromYear: year,
    toMonth: month,
    toYear: year,
  };
}

export function SoaAdvanceRunPrompt() {
  const { data: workflow, isLoading: workflowLoading } =
    api.settings.getWorkflow.useQuery();
  const { data: cards, isLoading: cardsLoading } =
    api.creditCards.list.useQuery();
  const { data: periods, isLoading: periodsLoading } =
    api.soa.listPeriods.useQuery();

  const [promptOpen, setPromptOpen] = useState(false);
  const utils = api.useUtils();
  const runDialog = useSoaRunDialog({
    onRunSuccess: async () => {
      await utils.soa.listPeriods.invalidate();
    },
  });

  const todayYmd = useMemo(
    () => todayYmdInTimezone(workflow?.timezone ?? "Asia/Manila"),
    [workflow?.timezone],
  );

  const target = useMemo(
    () => (workflow ? soaAdvanceRunTargetMonth(todayYmd) : null),
    [workflow, todayYmd],
  );

  const targetLabel = target
    ? formatStatementMonthLabel(target.month, target.year)
    : "";

  useEffect(() => {
    if (workflowLoading || cardsLoading || periodsLoading || !workflow || !target) {
      return;
    }
    if (!cards?.some((c) => c.isActive)) return;

    const promptDay = workflow.soaAdvancePromptDay;
    if (!shouldOfferSoaAdvanceRun(todayYmd, promptDay)) return;

    if (
      hasSoaPeriodForMonth(
        periods ?? [],
        target.month,
        target.year,
      )
    ) {
      return;
    }

    if (isAdvancePromptDismissed(target, localStorage)) return;

    setPromptOpen(true);
  }, [
    workflow,
    workflowLoading,
    cards,
    cardsLoading,
    periods,
    periodsLoading,
    target,
    todayYmd,
  ]);

  function handleNotNow() {
    if (target) dismissAdvancePrompt(target, localStorage);
    setPromptOpen(false);
  }

  function handleRunSoa() {
    if (!target) return;
    dismissAdvancePrompt(target, localStorage);
    setPromptOpen(false);
    runDialog.openRun(buildInitialRunValues(target.month, target.year));
  }

  return (
    <>
      <Dialog
        open={promptOpen}
        onOpenChange={(open) => {
          if (!open && target) dismissAdvancePrompt(target, localStorage);
          setPromptOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Run SOA for {targetLabel}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Banks that bill late in the month often have payments due early next
            month. Fetch {targetLabel} now so due dates and reminders are ready.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleNotNow}>
              Not now
            </Button>
            <Button type="button" onClick={handleRunSoa}>
              Run SOA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RunSoaDialog {...runDialog.runDialogProps} />
    </>
  );
}
