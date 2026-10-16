"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ROUTES } from "@/config/routes";
import { api } from "@/lib/api/client";
import { formatBankIssuer } from "@/lib/db/schema/credit-cards";
import { enumerateCalendarMonths } from "@/lib/soa/calendar-month";
import {
  encodeTransactionAmount,
  formatSoaMoney,
  netManualTransactionTotal,
} from "@/lib/soa/manual-entry";
import { CANNOT_ANALYZE_SLUG } from "@/lib/transactions/categories";

import { periodLabel } from "../lib/soa-utils";

const AUTO_CATEGORY = "__auto__";

type ManualEntryCard = {
  id: string;
  issuer: string;
  last4: string;
  label: string | null;
  isActive: boolean;
};

type ManualEntryPeriod = {
  fromMonth: number;
  fromYear: number;
  toMonth: number;
  toYear: number;
};

type DraftLine = {
  id: string;
  date: string;
  description: string;
  amount: string;
  credit: boolean;
  categorySlug: string;
};

type ManualSoaEntryDialogProps = {
  periodId: string;
  period: ManualEntryPeriod;
  cards: ManualEntryCard[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function parseMoneyInput(raw: string): number | null {
  const trimmed = raw.replace(/,/g, "").trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100;
}

function blankLine(): DraftLine {
  return {
    id: crypto.randomUUID(),
    date: "",
    description: "",
    amount: "",
    credit: false,
    categorySlug: AUTO_CATEGORY,
  };
}

function monthKeyFor(period: ManualEntryPeriod): string {
  const periodMonths = enumerateCalendarMonths(
    { month: period.fromMonth, year: period.fromYear },
    { month: period.toMonth, year: period.toYear },
  );
  const latest = periodMonths[periodMonths.length - 1];
  return latest ? `${latest.year}-${latest.month}` : "";
}

function cardOptionLabel(card: ManualEntryCard): string {
  const name = card.label?.trim() || formatBankIssuer(card.issuer);
  return `${name} ···· ${card.last4}`;
}

export function ManualSoaEntryDialog({
  periodId,
  period,
  cards,
  open,
  onOpenChange,
}: ManualSoaEntryDialogProps) {
  const utils = api.useUtils();
  const { data: categories } = api.transactionCategories.listOptions.useQuery(
    undefined,
    { enabled: open },
  );
  const months = enumerateCalendarMonths(
    { month: period.fromMonth, year: period.fromYear },
    { month: period.toMonth, year: period.toYear },
  );

  const [creditCardId, setCreditCardId] = useState("");
  const [monthKey, setMonthKey] = useState(() => monthKeyFor(period));
  const [statementDate, setStatementDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [minimumDue, setMinimumDue] = useState("");
  const [totalDue, setTotalDue] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);

  useEffect(() => {
    if (!open) return;
    setMonthKey(monthKeyFor(period));
    setCreditCardId("");
    setStatementDate("");
    setDueDate("");
    setMinimumDue("");
    setTotalDue("");
    setLines([]);
  }, [
    open,
    period.fromMonth,
    period.fromYear,
    period.toMonth,
    period.toYear,
  ]);

  useEffect(() => {
    if (!open || creditCardId || cards.length === 0) return;
    setCreditCardId(
      cards.find((card) => card.isActive)?.id ?? cards[0]?.id ?? "",
    );
  }, [open, creditCardId, cards]);

  const totalsLocked = lines.length > 0;
  const computedTotal = netManualTransactionTotal(
    lines.map((line) => ({
      description: line.description,
      amount: encodeTransactionAmount(
        parseMoneyInput(line.amount) ?? 0,
        line.credit,
      ),
    })),
  );

  const create = api.soa.createManualEntry.useMutation({
    onSuccess: () => {
      toast.success("Statement saved");
      void utils.soa.getPeriod.invalidate({ periodId });
      void utils.soa.getStatement.invalidate();
      void utils.soa.listPeriods.invalidate();
      void utils.reminders.listDue.invalidate();
      void utils.overview.stats.invalidate();
      void utils.creditCards.list.invalidate();
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message),
  });

  function updateLine(id: string, patch: Partial<DraftLine>) {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const selectedMonth = months.find(
      (month) => `${month.year}-${month.month}` === monthKey,
    );
    const minimum = parseMoneyInput(minimumDue);
    const typedTotal = parseMoneyInput(totalDue);
    if (!creditCardId || !selectedMonth || !statementDate || !dueDate) {
      toast.error("Card, dates, and dues are required");
      return;
    }
    if (minimum === null) {
      toast.error("Enter a minimum due");
      return;
    }

    const transactions = lines.map((line) => {
      const amount = parseMoneyInput(line.amount);
      return {
        date: line.date,
        description: line.description.trim(),
        amount,
        credit: line.credit,
        categorySlug:
          line.categorySlug === AUTO_CATEGORY ? undefined : line.categorySlug,
      };
    });
    if (
      transactions.some(
        (line) => !line.date || !line.description || line.amount === null || line.amount <= 0,
      )
    ) {
      toast.error("Each transaction needs a date, description, and amount");
      return;
    }

    const total = totalsLocked ? computedTotal : typedTotal;
    if (total === null) {
      toast.error("Enter a total due");
      return;
    }

    create.mutate({
      periodId,
      creditCardId,
      statementMonth: selectedMonth.month,
      statementYear: selectedMonth.year,
      statementDate,
      dueDate,
      minimumDue: minimum,
      totalDue: total,
      transactions: transactions.map((line) => ({
        date: line.date,
        description: line.description,
        amount: line.amount ?? 0,
        credit: line.credit,
        categorySlug: line.categorySlug,
      })),
    });
  }

  const categoryOptions =
    categories?.filter((option) => option.slug !== CANNOT_ANALYZE_SLUG) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,840px)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Add statement</DialogTitle>
        </DialogHeader>

        {cards.length === 0 ? (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">No credit cards yet.</p>
            <Button asChild variant="outline" size="sm">
              <Link href={ROUTES.dashboard.creditCards}>Add card</Link>
            </Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="manual-soa-card">Card</Label>
              <Select
                value={creditCardId || undefined}
                onValueChange={setCreditCardId}
              >
                <SelectTrigger id="manual-soa-card">
                  <SelectValue placeholder="Select card" />
                </SelectTrigger>
                <SelectContent>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {cardOptionLabel(card)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {months.length > 1 ? (
              <div className="space-y-2">
                <Label htmlFor="manual-soa-month">Statement month</Label>
                <Select value={monthKey} onValueChange={setMonthKey}>
                  <SelectTrigger id="manual-soa-month">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem
                        key={`${month.year}-${month.month}`}
                        value={`${month.year}-${month.month}`}
                      >
                        {periodLabel(month.month, month.year)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="manual-soa-statement-date">Statement date</Label>
                <Input
                  id="manual-soa-statement-date"
                  type="date"
                  value={statementDate}
                  onChange={(event) => setStatementDate(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-soa-due-date">Due date</Label>
                <Input
                  id="manual-soa-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-soa-min-due">Minimum due</Label>
                <Input
                  id="manual-soa-min-due"
                  inputMode="decimal"
                  value={minimumDue}
                  onChange={(event) => setMinimumDue(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-soa-total-due">Total due</Label>
                <Input
                  id="manual-soa-total-due"
                  inputMode="decimal"
                  value={totalsLocked ? formatSoaMoney(computedTotal) : totalDue}
                  onChange={(event) => setTotalDue(event.target.value)}
                  readOnly={totalsLocked}
                  required={!totalsLocked}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Transactions</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLines((current) => [...current, blankLine()])}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add transaction
                </Button>
              </div>

              {lines.map((line, index) => (
                <div
                  key={line.id}
                  className="space-y-3 rounded-lg border border-border/80 bg-muted/30 p-3"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`manual-tx-date-${line.id}`}>Date</Label>
                      <Input
                        id={`manual-tx-date-${line.id}`}
                        type="date"
                        value={line.date}
                        onChange={(event) =>
                          updateLine(line.id, { date: event.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`manual-tx-amount-${line.id}`}>Amount</Label>
                      <Input
                        id={`manual-tx-amount-${line.id}`}
                        inputMode="decimal"
                        value={line.amount}
                        onChange={(event) =>
                          updateLine(line.id, { amount: event.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`manual-tx-description-${line.id}`}>
                      Description
                    </Label>
                    <Input
                      id={`manual-tx-description-${line.id}`}
                      value={line.description}
                      onChange={(event) =>
                        updateLine(line.id, { description: event.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="min-w-[12rem] flex-1 space-y-2">
                      <Label htmlFor={`manual-tx-category-${line.id}`}>
                        Category
                      </Label>
                      <Select
                        value={line.categorySlug}
                        onValueChange={(categorySlug) =>
                          updateLine(line.id, { categorySlug })
                        }
                      >
                        <SelectTrigger id={`manual-tx-category-${line.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={AUTO_CATEGORY}>Auto</SelectItem>
                          {categoryOptions.map((option) => (
                            <SelectItem key={option.slug} value={option.slug}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-3 pb-2">
                      <Label
                        htmlFor={`manual-tx-credit-${line.id}`}
                        className="font-normal"
                      >
                        Credit
                      </Label>
                      <Switch
                        id={`manual-tx-credit-${line.id}`}
                        checked={line.credit}
                        onCheckedChange={(credit) =>
                          updateLine(line.id, { credit })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove transaction ${index + 1}`}
                        onClick={() => {
                          setLines((current) => {
                            const next = current.filter(
                              (item) => item.id !== line.id,
                            );
                            if (next.length === 0) {
                              setTotalDue(computedTotal.toFixed(2));
                            }
                            return next;
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending || !creditCardId}>
                Save
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
