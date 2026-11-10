'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { inferRouterOutputs } from '@trpc/server';
import {
  ChevronRight,
  CreditCard,
  FileText,
  MoreHorizontal,
  Receipt,
  ReceiptText,
  Sparkles,
} from 'lucide-react';
import type { Route } from 'next';

import { DateNumeral } from '@/components/calendar/DateNumeral';
import { Amount } from '@/components/shared/Amount';
import { CardSwatch } from '@/components/shared/CardChip';
import { FigureLine } from '@/components/shared/Ledger';
import { BillStatusTag } from '@/components/shared/StatusBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { markForState } from '@/lib/calendar/month-grid';
import { resolveBillState } from '@/lib/due/bill-state';
import { cn } from '@/lib/utils/cn';

import { DashboardPageHeader } from '@/components/shared/DashboardPageHeader';
import { MissingSoaNotice } from '@/components/shared/MissingSoaBadge';
import { SoaStatementDetailContentSkeleton } from '@/components/shared/skeletons';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/routes';
import { api } from '@/lib/api/client';
import type { AppRouter } from '@/server/routers/_app';
import { isMissingSoaForStatementPeriod } from '@/lib/credit-cards/billing-cycle';
import { normalizeCardLast4 } from '@/lib/due/normalize';
import { todayYmdLocal } from '@/lib/reminders/reminder-status';
import { isStatementMarkedPaid } from '@/lib/soa/paid-status';
import { receiptsForStatement } from '@/lib/soa/statement-receipts';
import type { ReceiptListItem } from '@/features/dashboard/receipts/lib/receipt-utils';

import {
  CategorizeWithAiProvider,
  useCategorizeWithAiActions,
} from './CategorizeWithAiProvider';
import { SoaPdfPreview } from './SoaPdfPreview';
import { PaymentReceiptPreview } from '@/features/dashboard/receipts/components/PaymentReceiptPreview';
import { SoaTransactionList } from './SoaTransactionList';
import { CardBankLabel } from '@/lib/credit-cards/CardBankLabel';
import { resolveCardAccent } from '@/lib/credit-cards/card-accent';

import {
  daysUntilDue,
  dueCountdownLabel,
  formatDisplayAmount,
  periodLabel,
  statementTitle,
} from '../lib/soa-utils';
import {
  classifyTransaction,
  parseTransactionAmount,
  sumTransactionsByKind,
} from '../lib/transaction-utils';

type SoaStatementDetailPageProps = {
  periodId: string;
  statementId: string;
};

type SoaStatementDetail = NonNullable<
  inferRouterOutputs<AppRouter>['soa']['getStatement']
>;

function statementRichness(statement: {
  totalDue?: string | null;
  minimumDue?: string | null;
  statementDate?: string | null;
  dueDate?: string | null;
  transactions?: unknown[] | null;
}): number {
  const filled = (v: string | null | undefined) =>
    Boolean(v && v.trim() && v !== '—');
  return (
    Number(filled(statement.totalDue)) +
    Number(filled(statement.minimumDue)) +
    Number(filled(statement.statementDate)) +
    Number(filled(statement.dueDate)) +
    Number((statement.transactions?.length ?? 0) > 0) * 2
  );
}

export function SoaStatementDetailPage({
  periodId,
  statementId,
}: SoaStatementDetailPageProps) {
  const utils = api.useUtils();
  const { data, isLoading, isFetching } = api.soa.getStatement.useQuery(
    { periodId, statementId },
    {
      staleTime: 0,
      placeholderData: () => {
        const period = utils.soa.getPeriod.getData({ periodId });
        if (!period) return undefined;
        const statement = period.statements.find((s) => s.id === statementId);
        if (!statement) return undefined;
        return {
          period: {
            id: period.id,
            mode: period.mode,
            fromMonth: period.fromMonth,
            fromYear: period.fromYear,
            toMonth: period.toMonth,
            toYear: period.toYear,
            label: period.label,
          },
          statement,
        } as SoaStatementDetail;
      },
    },
  );

  const periodCached = utils.soa.getPeriod.getData({ periodId });
  const fromPeriod = periodCached?.statements.find((s) => s.id === statementId);
  const statement =
    data?.statement && fromPeriod
      ? statementRichness(fromPeriod) > statementRichness(data.statement)
        ? fromPeriod
        : data.statement
      : (data?.statement ?? fromPeriod);
  const period = data?.period ??
    (periodCached
      ? {
          id: periodCached.id,
          mode: periodCached.mode,
          fromMonth: periodCached.fromMonth,
          fromYear: periodCached.fromYear,
          toMonth: periodCached.toMonth,
          toYear: periodCached.toYear,
          label: periodCached.label,
        }
      : null);

  if (isLoading && !statement) {
    return <SoaStatementDetailContentSkeleton />;
  }

  if (!period || !statement) {
    return (
      <div className="py-12 space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          {isFetching ? 'Loading statement…' : 'Statement not found.'}
        </p>
        <Button variant="outline" asChild>
          <Link href={ROUTES.dashboard.statementPeriod(periodId)}>Back to the month</Link>
        </Button>
      </div>
    );
  }

  return (
    <CategorizeWithAiProvider
      periodId={periodId}
      statementId={statementId}
      transactions={statement.transactions ?? []}
    >
      <SoaStatementDetailBody
        periodId={periodId}
        period={period}
        statement={statement}
      />
    </CategorizeWithAiProvider>
  );
}

function SoaStatementDetailBody({
  periodId,
  period,
  statement,
}: {
  periodId: string;
  period: { label: string };
  statement: SoaStatementDetail['statement'];
}) {
  const { data: dues } = api.reminders.listDue.useQuery({ unpaidOnly: false });
  const { data: receipts } = api.receipts.list.useQuery();
  const { data: cards } = api.creditCards.list.useQuery(undefined, {
    enabled: Boolean(statement.soaUnavailable),
  });
  const categorize = useCategorizeWithAiActions();
  const [pdfOpen, setPdfOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const dueEntries = useMemo(
    () =>
      (dues ?? []).map((due) => ({
        id: due.id,
        issuerId: due.issuerId,
        cardLast4: due.cardLast4,
        dueDateYmd: due.dueDateYmd,
        paidAt: due.paidAt,
        statementPeriodKey: due.statementPeriodKey,
      })),
    [dues],
  );

  const paid = useMemo(() => {
    if (!dues) return false;
    return isStatementMarkedPaid(statement, dueEntries);
  }, [statement, dues, dueEntries]);

  const linkedReceipts = useMemo(
    () =>
      receiptsForStatement(
        statement,
        dueEntries,
        (receipts ?? []) as ReceiptListItem[],
      ) as ReceiptListItem[],
    [statement, dueEntries, receipts],
  );

  const txStats = useMemo(() => {
    const transactions = statement.transactions ?? [];
    const charges = transactions.reduce((sum, t) => {
      const kind = classifyTransaction(t.description, t.amount);
      if (kind === 'purchase' || kind === 'interest' || kind === 'fee') {
        return sum + parseTransactionAmount(t.amount);
      }
      return sum;
    }, 0);
    const credits = sumTransactionsByKind(transactions, ['credit', 'payment']);
    const interest = sumTransactionsByKind(transactions, ['interest']);
    const fees = sumTransactionsByKind(transactions, ['fee']);

    return { charges, credits, interest, fees, count: transactions.length };
  }, [statement.transactions]);

  const accent = resolveCardAccent(statement.issuerId, statement.cardColor);
  const days = daysUntilDue(statement.dueDateYmd);
  const countdown = dueCountdownLabel(days);
  const hasPdf =
    !!statement.pdfFileName &&
    statement.pdfFileName !== '—' &&
    !statement.soaUnavailable;
  const matchedCard = (cards ?? []).find(
    (card) =>
      card.issuer.toLowerCase() === statement.issuerId.toLowerCase() &&
      normalizeCardLast4(card.last4) ===
        normalizeCardLast4(statement.cardLast4),
  );
  const missingSoa = isMissingSoaForStatementPeriod(
    todayYmdLocal(),
    statement,
    matchedCard?.statementDay,
  );

  const urgencyVariant =
    paid || days === null
      ? ('muted' as const)
      : days < 0
        ? ('destructive' as const)
        : days <= 4
          ? ('warning' as const)
          : ('default' as const);

  const stmtMonthLabel = periodLabel(
    statement.statementMonth,
    statement.statementYear,
  );

  const billState = resolveBillState({ paid, daysAway: days });

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        breadcrumb={
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-13 text-muted-foreground">
            <Link href={ROUTES.dashboard.statements} className="shrink-0 hover:text-foreground hover:underline">
              Statements
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <Link
              href={ROUTES.dashboard.statementPeriod(periodId)}
              className="min-w-0 truncate hover:text-foreground hover:underline"
            >
              {period.label}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="min-w-0 truncate text-foreground" aria-current="page">
              {statementTitle(statement)}
            </span>
          </nav>
        }
        title={
          <span className="flex min-w-0 items-center gap-3">
            <CardSwatch color={accent.color} />
            <span className="truncate">{statementTitle(statement)}</span>
          </span>
        }
        actions={
          <>
            {linkedReceipts.length > 0 ? (
              <Button variant="outline" onClick={() => setPaymentOpen(true)}>
                <Receipt />
                {linkedReceipts.length > 1 ? `${linkedReceipts.length} payments` : "Payment"}
              </Button>
            ) : null}
            {hasPdf ? (
              <Button variant="outline" onClick={() => setPdfOpen(true)}>
                <FileText />
                SOA
              </Button>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More statement actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {txStats.count > 0 ? (
                  <DropdownMenuItem
                    disabled={categorize.isPending}
                    onSelect={() => categorize.openChoiceDialog()}
                  >
                    <Sparkles />
                    Categorize with AI
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.dashboard.bills}>
                    <ReceiptText />
                    Open in Bills
                  </Link>
                </DropdownMenuItem>
                {matchedCard ? (
                  <DropdownMenuItem asChild>
                    <Link href={`${ROUTES.dashboard.cards}?edit=${matchedCard.id}` as Route}>
                      <CreditCard />
                      Edit card
                    </Link>
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <section aria-label="Statement summary" className="rounded-lg border bg-card">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-4 p-4 sm:grid-cols-[auto_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-center sm:p-5">
          <DateNumeral ymd={statement.dueDateYmd} mark={markForState(billState)} size="lg" />
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Total due</p>
            <Amount
              value={statement.totalDue}
              size="xl"
              tone={paid ? "muted" : billState === "overdue" ? "due" : "default"}
              className={cn(paid && "line-through decoration-2")}
            />
            <div className="flex flex-wrap items-center gap-2">
              {dues ? <BillStatusTag state={billState} /> : null}
              {countdown && !paid ? (
                <StatusBadge label={countdown} variant={urgencyVariant === "default" ? "muted" : urgencyVariant} />
              ) : null}
            </div>
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-4 border-t pt-4 sm:col-span-2 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Minimum</p>
              <Amount value={statement.minimumDue} size="md" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Statement</p>
              <p className="text-sm font-semibold">{statement.statementDate ?? stmtMonthLabel}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Due date</p>
              <p className="text-sm font-semibold">{statement.dueDate ?? "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Card</p>
              <CardBankLabel
                issuerId={statement.issuerId}
                color={statement.cardColor}
                label={statement.cardDisplayLabel}
              />
            </div>
          </div>
        </div>
        {txStats.count > 0 ? (
          <div className="border-t px-4 py-3 sm:px-5">
            <FigureLine
              items={[
                { key: "charges", figure: <Amount value={txStats.charges} size="md" />, label: "Charges" },
                { key: "credits", figure: <Amount value={txStats.credits} size="md" tone="success" />, label: "Credits" },
                ...(txStats.interest > 0 || txStats.fees > 0
                  ? [
                      {
                        key: "interest",
                        figure: <Amount value={txStats.interest + txStats.fees} size="md" tone="due" />,
                        label: "Interest & fees",
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        ) : null}
      </section>

      {missingSoa ? <MissingSoaNotice /> : null}

      <section className="space-y-4">
        <div className="flex gap-3 justify-between items-center">
          <h2>Transactions</h2>
          {txStats.count > 0 && (
            <p className="text-sm tabular-nums text-muted-foreground">
              {txStats.count} {txStats.count === 1 ? 'line' : 'lines'}
            </p>
          )}
        </div>
        <SoaTransactionList
          transactions={statement.transactions ?? []}
          issuerId={statement.issuerId}
        />
      </section>

      {hasPdf && (
        <SoaPdfPreview
          open={pdfOpen}
          onOpenChange={setPdfOpen}
          title={statementTitle(statement)}
          pdfUrl={`/api/soa/pdf?statementId=${statement.id}`}
        />
      )}

      <PaymentReceiptPreview
        receipts={paymentOpen ? linkedReceipts : null}
        onOpenChange={setPaymentOpen}
      />
    </div>
  );
}
