"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { ReceiptText, Upload } from "lucide-react";

import { Amount } from "@/components/shared/Amount";
import { DashboardPageHeader } from "@/components/shared/DashboardPageHeader";
import { FigureLine } from "@/components/shared/Ledger";
import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { Button } from "@/components/ui/button";
import type { BillsView } from "@/config/routes";
import { useQuickActions } from "@/features/dashboard/components/shell/QuickActionsProvider";
import { ReceiptsPage } from "@/features/dashboard/receipts/components/ReceiptsPage";
import { ReminderDueEntriesPanel } from "@/features/dashboard/reminders/components/ReminderDueEntriesPanel";
import { api } from "@/lib/api/client";
import { todayYmdLocal } from "@/lib/reminders/reminder-status";
import { parsePhpAmount } from "@/lib/utils/format-money";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const VIEW_OPTIONS = [
  { value: "due", label: "Due", icon: undefined },
  { value: "receipts", label: "Receipts", icon: ReceiptText },
] as const;

function parseView(value: string | null): BillsView {
  return value === "receipts" ? "receipts" : "due";
}

/** Pay and prove every card for the month: due list and receipts in one place. */
export function BillsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = parseView(searchParams.get("view"));
  const actions = useQuickActions();
  const { data: dues } = api.reminders.listDue.useQuery({ unpaidOnly: false });

  /** Header figures cover the open billing month only (history stays in the list). */
  const openMonthKey = todayYmdLocal().slice(0, 7);
  const openMonthLabel = (() => {
    const [y, m] = openMonthKey.split("-").map(Number);
    return `${MONTH_NAMES[(m ?? 1) - 1]} ${y}`;
  })();
  const figures = useMemo(() => {
    const rows = (dues ?? []).filter((row) => row.statementPeriodKey === openMonthKey);
    const withAmounts = rows.filter((row) => row.source !== "expected");
    const total = withAmounts.reduce((sum, row) => sum + parsePhpAmount(row.totalDue), 0);
    const paid = withAmounts
      .filter((row) => row.paidAt)
      .reduce((sum, row) => sum + parsePhpAmount(row.paidAmount ?? row.totalDue), 0);
    const outstanding = withAmounts
      .filter((row) => !row.paidAt)
      .reduce((sum, row) => sum + parsePhpAmount(row.totalDue), 0);
    return {
      total,
      paid,
      outstanding,
      cards: rows.length,
      paidCards: rows.filter((row) => row.paidAt).length,
    };
  }, [dues, openMonthKey]);

  function setView(next: BillsView) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "due") params.delete("view");
    else params.set("view", next);
    const query = params.toString();
    router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Bills"
        description={openMonthLabel}
        actions={
          <Button onClick={() => actions.uploadReceipt()} loading={actions.receiptUploadPending}>
            <Upload />
            Upload receipt
          </Button>
        }
        meta={
          figures.cards > 0 ? (
            <FigureLine
              items={[
                {
                  key: "outstanding",
                  figure: <Amount value={figures.outstanding} size="lg" tone={figures.outstanding > 0 ? "default" : "success"} />,
                  label: "Outstanding",
                },
                { key: "paid", figure: <Amount value={figures.paid} size="lg" tone="success" />, label: "Paid" },
                {
                  key: "cards",
                  figure: (
                    <span className="font-numeral text-2xl leading-none">
                      {figures.paidCards}
                      <span className="text-muted-foreground">/{figures.cards}</span>
                    </span>
                  ),
                  label: "Cards paid",
                },
              ]}
            />
          ) : null
        }
      />

      <SegmentedControl
        ariaLabel="Bills view"
        value={view}
        onChange={setView}
        options={VIEW_OPTIONS}
        className="w-full sm:w-auto"
      />

      {view === "receipts" ? <ReceiptsPage embedded /> : <ReminderDueEntriesPanel />}
    </div>
  );
}
