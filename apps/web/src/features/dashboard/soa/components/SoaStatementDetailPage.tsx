'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { inferRouterOutputs } from '@trpc/server';
import {
  ArrowLeft,
  Calendar,
  FileText,
  PhilippinePeso,
  Receipt,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import { DashboardPageHeader } from '@/components/shared/DashboardPageHeader';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { MissingSoaNotice } from '@/components/shared/MissingSoaBadge';
import { SoaStatementDetailContentSkeleton } from '@/components/shared/skeletons';
import { StatCard, statGridClassName } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ViewPaymentReceiptButton } from '@/components/shared/ViewPaymentReceiptButton';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ROUTES } from '@/config/routes';
import { api } from '@/lib/api/client';
import type { AppRouter } from '@/server/routers/_app';
import { isMissingSoaForStatementPeriod } from '@/lib/credit-cards/billing-cycle';
import { normalizeCardLast4 } from '@/lib/due/normalize';
import { todayYmdLocal } from '@/lib/reminders/reminder-status';
import { formatPhpAmount } from '@/lib/utils/format-money';
import { isStatementMarkedPaid } from '@/lib/soa/paid-status';
import { receiptsForStatement } from '@/lib/soa/statement-receipts';
import type { ReceiptListItem } from '@/features/dashboard/receipts/lib/receipt-utils';

import {
  CategorizeWithAiProvider,
  useCategorizeWithAiActions,
} from './CategorizeWithAiProvider';
import { SoaPdfPreview } from './SoaPdfPreview';
import { PaymentReceiptPreview } from '@/features/dashboard/receipts/components/PaymentReceiptPreview';
import { StatementPaidBadge } from './StatementSettlement';
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
    return (
      <div className="space-y-4">
        <SoaStatementDetailContentSkeleton />
      </div>
    );
  }

  if (!period || !statement) {
    return (
      <div className="py-12 space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          {isFetching ? 'Loading statement…' : 'Statement not found.'}
        </p>
        <Button variant="outline" asChild>
          <Link href={ROUTES.dashboard.soaPeriod(periodId)}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Link>
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-y-1 gap-x-2 items-center text-sm text-muted-foreground">
        <Link
          href={ROUTES.dashboard.soa}
          className="transition-colors shrink-0 hover:text-foreground"
        >
          SOA
        </Link>
        <span className="shrink-0">/</span>
        <Link
          href={ROUTES.dashboard.soaPeriod(periodId)}
          className="min-w-0 max-w-[12rem] truncate transition-colors hover:text-foreground sm:max-w-none"
        >
          {period.label}
        </Link>
        <span className="shrink-0">/</span>
        <span className="min-w-0 truncate text-foreground">
          {statementTitle(statement)}
        </span>
      </div>

      <DashboardPageHeader
        title={statementTitle(statement)}
        actions={
          hasPdf || txStats.count > 0 || linkedReceipts.length > 0 ? (
            <PageActionBar
              secondary={
                (hasPdf && (txStats.count > 0 || linkedReceipts.length > 0)) ||
                (!hasPdf && linkedReceipts.length > 0 && txStats.count > 0) ? (
                <>
                  {hasPdf && txStats.count > 0 ? (
                    <Button
                      variant="outline"
                      onClick={() => categorize.openChoiceDialog()}
                      disabled={categorize.isPending}
                    >
                      <Sparkles className="mr-2 w-4 h-4" />
                      Categorize with AI
                    </Button>
                  ) : null}
                  {hasPdf && linkedReceipts.length > 0 ? (
                    <ViewPaymentReceiptButton
                      count={linkedReceipts.length}
                      label="Payment"
                      className="w-auto"
                      onClick={() => setPaymentOpen(true)}
                    />
                  ) : null}
                  {!hasPdf &&
                  linkedReceipts.length > 0 &&
                  txStats.count > 0 ? (
                    <Button
                      variant="outline"
                      onClick={() => categorize.openChoiceDialog()}
                      disabled={categorize.isPending}
                    >
                      <Sparkles className="mr-2 w-4 h-4" />
                      Categorize with AI
                    </Button>
                  ) : null}
                </>
                ) : undefined
              }
              primary={
                hasPdf ? (
                  <Button variant="outline" onClick={() => setPdfOpen(true)}>
                    <FileText className="mr-2 w-4 h-4" />
                    SOA
                  </Button>
                ) : linkedReceipts.length > 0 ? (
                  <ViewPaymentReceiptButton
                    count={linkedReceipts.length}
                    label="Payment"
                    className="w-auto"
                    onClick={() => setPaymentOpen(true)}
                  />
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => categorize.openChoiceDialog()}
                    disabled={categorize.isPending}
                  >
                    <Sparkles className="mr-2 w-4 h-4" />
                    Categorize with AI
                  </Button>
                )
              }
            />
          ) : null
        }
      />

      <Card
        className="overflow-hidden border-border/80 shadow-card"
        style={accent.stripeStyle}
      >
        <CardHeader className="space-y-3 pb-3">
          <div className="flex flex-wrap gap-2 items-center">
            <CardBankLabel
              issuerId={statement.issuerId}
              color={statement.cardColor}
              label={statement.cardDisplayLabel}
            />
            <span className="text-xs text-muted-foreground">
              {stmtMonthLabel}
            </span>
            {dues ? <StatementPaidBadge paid={paid} /> : null}
            {countdown && !paid && (
              <StatusBadge label={countdown} variant={urgencyVariant} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Total due
              </p>
              <p className="font-display text-xl font-semibold tabular-nums sm:text-2xl">
                {formatDisplayAmount(statement.totalDue)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Minimum
              </p>
              <p className="font-display text-base font-semibold tabular-nums sm:text-lg">
                {formatDisplayAmount(statement.minimumDue)}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <Calendar className="w-3 h-3" />
                Due
              </p>
              <p className="font-medium">{statement.dueDate ?? '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Statement date
              </p>
              <p className="font-medium">{statement.statementDate ?? '—'}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {missingSoa ? <MissingSoaNotice /> : null}

      {txStats.count > 0 && (
        <div className={statGridClassName}>
          <StatCard title="Transactions" value={txStats.count} icon={Receipt} />
          <StatCard
            title="Charges"
            value={formatPhpAmount(txStats.charges)}
            icon={TrendingUp}
          />
          <StatCard
            title="Credits"
            value={formatPhpAmount(txStats.credits)}
            icon={TrendingDown}
          />
          {(txStats.interest > 0 || txStats.fees > 0) && (
            <StatCard
              title="Interest & fees"
              value={formatPhpAmount(txStats.interest + txStats.fees)}
              icon={PhilippinePeso}
            />
          )}
        </div>
      )}

      <section className="space-y-4">
        <div className="flex gap-3 justify-between items-center">
          <h2 className="font-display text-base font-semibold">Transactions</h2>
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
