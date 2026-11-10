"use client";

import {
  Circle,
  FileText,
  Loader2,
  type LucideIcon,
  XCircle,
} from "lucide-react";

import { DayMarkGlyph } from "@/components/calendar/DayMark";
import { formatUserFacingErrorMessage } from "@/lib/errors/user-facing-message";
import { cn } from "@/lib/utils/cn";

export type WorkflowProgressStep = {
  id: string;
  label: string;
  status: "pending" | "active" | "done";
};

type WorkflowProgressPanelProps = {
  steps: WorkflowProgressStep[];
  activeStepIndex: number;
  progress: number;
  finished?: boolean;
  failed?: boolean;
  errorMessage?: string | null;
  detail?: string | null;
  icon?: LucideIcon;
  doneTitle?: string;
  failedTitle?: string;
  summaryLines?: string[];
  /** When set and total > 1, shows which receipt/item is currently processing within a batch. */
  itemProgress?: { index: number; total: number } | null;
};

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      className="relative h-1 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300 ease-out",
          pct >= 100 ? "bg-success" : "bg-primary",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function WorkflowProgressPanel({
  steps,
  activeStepIndex,
  progress,
  finished = false,
  failed = false,
  errorMessage,
  detail = null,
  icon: Icon = FileText,
  doneTitle = "All done",
  failedTitle = "Run failed",
  summaryLines,
  itemProgress,
}: WorkflowProgressPanelProps) {
  const current = steps[activeStepIndex] ?? steps[0];
  const done = finished && !failed;
  const displayError = errorMessage
    ? formatUserFacingErrorMessage(errorMessage)
    : null;
  const showItemProgress =
    !done && !failed && itemProgress != null && itemProgress.total > 1;

  const title = done ? doneTitle : failed ? failedTitle : current?.label;

  return (
    <div
      className="min-w-0 space-y-5 overflow-hidden"
      aria-live="polite"
      aria-busy={!finished}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-md",
            done
              ? "bg-success-wash text-success"
              : failed
                ? "bg-due-wash text-due"
                : "bg-accent text-primary",
          )}
        >
          {done ? (
            <DayMarkGlyph kind="paid" className="size-5" />
          ) : failed ? (
            <XCircle className="h-5 w-5" aria-hidden />
          ) : (
            <Icon className="h-5 w-5" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-0.5 pt-0.5">
          {showItemProgress ? (
            <p className="text-xs font-semibold text-muted-foreground">
              Receipt {itemProgress!.index} of {itemProgress!.total}
            </p>
          ) : null}
          <p className="truncate text-base font-bold" title={title}>
            {title}
          </p>
          {failed && displayError ? (
            <p className="text-13 text-due">{displayError}</p>
          ) : !finished && detail ? (
            <p className="truncate text-13 text-muted-foreground" title={detail}>
              {detail}
            </p>
          ) : null}
        </div>
        <span className="font-numeral shrink-0 pt-1 text-lg leading-none">
          {progress}
          <span className="text-xs font-semibold text-muted-foreground">%</span>
        </span>
      </div>

      <ProgressBar value={progress} />

      {done && summaryLines?.length ? (
        <ul className="space-y-1 rounded-md bg-muted px-3 py-2.5 text-13">
          {summaryLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}

      <ol className="divide-y divide-border rounded-md border">
        {steps.map((step, index) => {
          const isComplete =
            done || step.status === "done" || index < activeStepIndex;
          const isCurrent = !finished && !failed && index === activeStepIndex;

          return (
            <li
              key={step.id}
              className={cn(
                "flex min-h-10 min-w-0 items-center gap-3 px-3 py-2 text-13",
                isComplete && "text-muted-foreground",
                isCurrent && "font-semibold text-foreground",
                !isComplete && !isCurrent && "text-muted-foreground/60",
              )}
            >
              {isComplete ? (
                <DayMarkGlyph kind="paid" className="size-4 text-success" />
              ) : isCurrent ? (
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin text-primary"
                  aria-hidden
                />
              ) : (
                <Circle
                  className="h-4 w-4 shrink-0 text-border"
                  aria-hidden
                />
              )}
              <span className="min-w-0 truncate">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
