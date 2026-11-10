"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Bell, ChevronDown, ChevronRight, Play, Tags, Upload } from "lucide-react";

import { DateNumeral, formatShortDate } from "@/components/calendar/DateNumeral";
import { DayMarkGlyph } from "@/components/calendar/DayMark";
import { Amount } from "@/components/shared/Amount";
import { CardChip } from "@/components/shared/CardChip";
import { BillStatusTag } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { formatDaysAway } from "@/lib/due/bill-state";
import { cn } from "@/lib/utils/cn";

import {
  billStateForDue,
  markForState,
  sortDuesByUrgency,
  type CalendarDue,
} from "../lib/home-calendar";

export type NeedsYouExtra = {
  key: string;
  icon: "reminders" | "uncategorized" | "minimum";
  label: string;
  detail?: string;
  href: Route;
};

type NeedsYouListProps = {
  dues: CalendarDue[];
  extras: NeedsYouExtra[];
  selectedYmd: string | null;
  onClearDay: () => void;
  onUploadReceipt: (dueEntryId: string) => void;
  onRunSoa: () => void;
  uploadPending?: boolean;
};

const EXTRA_ICON = {
  reminders: Bell,
  uncategorized: Tags,
  minimum: Bell,
} as const;

/** "What do I owe next?" — the month's bills ordered by urgency, then crossed-off ones. */
export function NeedsYouList({
  dues,
  extras,
  selectedYmd,
  onClearDay,
  onUploadReceipt,
  onRunSoa,
  uploadPending,
}: NeedsYouListProps) {
  const [showPaid, setShowPaid] = useState(false);
  const scoped = selectedYmd ? dues.filter((due) => due.dueDateYmd === selectedYmd) : dues;
  const sorted = sortDuesByUrgency(scoped);
  const open = sorted.filter((due) => !due.paidAt);
  const paid = sorted.filter((due) => due.paidAt);

  return (
    <section aria-labelledby="needs-you-title" className="flex min-w-0 flex-col">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <h2 id="needs-you-title" className="flex items-baseline gap-2">
          {selectedYmd ? `Due ${formatShortDate(selectedYmd)}` : "Needs you"}
          <span className="font-numeral text-sm text-muted-foreground">{open.length}</span>
        </h2>
        {selectedYmd ? (
          <Button variant="link" size="sm" onClick={onClearDay}>
            Show all
          </Button>
        ) : null}
      </div>

      {open.length === 0 && extras.length === 0 ? (
        <div className="mt-2 flex items-center gap-3 rounded-lg border border-dashed px-4 py-5 text-13">
          <DayMarkGlyph kind="paid" className="size-5 text-success" />
          <span>
            <span className="font-semibold">Nothing due{selectedYmd ? " that day" : ""}.</span>{" "}
            <span className="text-muted-foreground">Every bill here is crossed off.</span>
          </span>
        </div>
      ) : (
        <ul className="mt-2 divide-y rounded-lg border bg-card">
          {open.map((due) => (
            <DueRow
              key={due.id}
              due={due}
              onUploadReceipt={onUploadReceipt}
              onRunSoa={onRunSoa}
              uploadPending={uploadPending}
            />
          ))}
          {selectedYmd
            ? null
            : extras.map((extra) => {
                const Icon = EXTRA_ICON[extra.icon];
                return (
                  <li key={extra.key}>
                    <Link
                      href={extra.href}
                      className="flex min-h-12 items-center gap-3 px-3 py-2.5 text-13 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <span className="flex w-12 shrink-0 justify-center text-muted-foreground">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{extra.label}</span>
                        {extra.detail ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            {extra.detail}
                          </span>
                        ) : null}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                );
              })}
        </ul>
      )}

      {paid.length > 0 ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowPaid((value) => !value)}
            aria-expanded={showPaid}
            className="flex h-9 items-center gap-1.5 rounded-md text-13 font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform duration-120", !showPaid && "-rotate-90")}
              aria-hidden
            />
            Crossed off
            <span className="font-numeral">{paid.length}</span>
          </button>
          {showPaid ? (
            <ul className="mt-1 divide-y rounded-lg border bg-card">
              {paid.map((due) => (
                <DueRow key={due.id} due={due} onUploadReceipt={onUploadReceipt} onRunSoa={onRunSoa} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function DueRow({
  due,
  onUploadReceipt,
  onRunSoa,
  uploadPending,
}: {
  due: CalendarDue;
  onUploadReceipt: (dueEntryId: string) => void;
  onRunSoa: () => void;
  uploadPending?: boolean;
}) {
  const state = billStateForDue(due);
  const paid = state === "paid";
  const awaiting = state === "missing" || state === "expected";
  const when = paid ? `Paid · due ${formatShortDate(due.dueDateYmd)}` : formatDaysAway(due.daysAway);

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <DateNumeral ymd={due.dueDateYmd} mark={markForState(state)} size="sm" />
      <Link
        href={ROUTES.dashboard.bill(due.id)}
        className="group min-w-0 flex-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardChip
          issuerId={due.issuerId}
          last4={due.cardLast4}
          label={due.cardDisplayLabel}
          color={due.cardColor}
          showIssuer={false}
          size="sm"
        />
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <BillStatusTag state={state} />
          {when && !awaiting ? (
            <span className={cn("text-xs", paid ? "text-muted-foreground" : "text-foreground")}>
              {when}
            </span>
          ) : null}
        </span>
      </Link>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {awaiting ? (
          <Button size="xs" variant="outline" onClick={onRunSoa}>
            <Play />
            Run SOA
          </Button>
        ) : (
          <>
            <Amount
              value={due.totalDue}
              size="md"
              tone={paid ? "muted" : state === "overdue" ? "due" : "default"}
              className={cn(paid && "line-through decoration-1")}
            />
            {paid ? null : (
              <Button
                size="xs"
                variant="ghost"
                className="-mr-1.5 text-primary"
                disabled={uploadPending}
                onClick={() => onUploadReceipt(due.id)}
              >
                <Upload />
                Receipt
              </Button>
            )}
          </>
        )}
      </div>
    </li>
  );
}
