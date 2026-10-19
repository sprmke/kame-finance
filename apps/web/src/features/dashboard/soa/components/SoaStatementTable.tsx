"use client";

import {
  ClickableTableRow,
  TableRowActions,
} from "@/components/shared/ClickableTableRow";
import { TableCard } from "@/components/shared/TableCard";
import { MissingSoaBadge } from "@/components/shared/MissingSoaBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/config/routes";

import { CardBankLabel } from "@/lib/credit-cards/CardBankLabel";
import { resolveCardAccent } from "@/lib/credit-cards/card-accent";

import {
  daysUntilDue,
  dueCountdownLabel,
  formatDisplayAmount,
  periodLabel,
  type SoaStatement,
} from "../lib/soa-utils";
import { isStatementMarkedPaid } from "@/lib/soa/paid-status";
import type { DueEntryPaidMatchInput } from "@/lib/soa/paid-status";
import {
  shouldOfferStatementPayNow,
  type StatementDueEntryRow,
} from "@/lib/soa/statement-due-entry";
import { StatementPayNowButton } from "./StatementPayNowButton";
import {
  StatementPaidBadge,
  StatementPaymentButton,
  StatementSoaButton,
} from "./StatementSettlement";

type SoaStatementTableProps = {
  periodId: string;
  statements: SoaStatement[];
  paidDues: DueEntryPaidMatchInput[];
  dueEntries?: StatementDueEntryRow[];
  onPayNow?: (dueEntryId: string) => void;
  payNowDisabled?: boolean;
  onPreviewSource: (statement: SoaStatement) => void;
  onPreviewPayment?: (statement: SoaStatement) => void;
  paymentCountFor?: (statement: SoaStatement) => number;
  paidReady?: boolean;
  showPeriodColumn?: boolean;
  isMissingSoa?: (statement: SoaStatement) => boolean;
};

export function SoaStatementTable({
  periodId,
  statements,
  paidDues,
  dueEntries = [],
  onPayNow,
  payNowDisabled,
  onPreviewSource,
  onPreviewPayment,
  paymentCountFor,
  paidReady = true,
  showPeriodColumn = false,
  isMissingSoa,
}: SoaStatementTableProps) {
  return (
    <TableCard>
      <Table className="min-w-[980px]">
        <TableHeader>
          <TableRow>
            {showPeriodColumn && <TableHead>Period</TableHead>}
            <TableHead>Card</TableHead>
            <TableHead>Last 4</TableHead>
            <TableHead>Statement</TableHead>
            <TableHead className="text-right">Total due</TableHead>
            <TableHead className="text-right">Minimum</TableHead>
            <TableHead>Due</TableHead>
            <TableHead className="w-[104px]">Paid</TableHead>
            <TableHead className="w-[72px] text-center">SOA</TableHead>
            <TableHead className="w-[88px] text-center">Payment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {statements.map((statement) => {
            const paid =
              paidReady && isStatementMarkedPaid(statement, paidDues);
            const days = daysUntilDue(statement.dueDateYmd);
            const countdown = dueCountdownLabel(days);
            const accent = resolveCardAccent(
              statement.issuerId,
              statement.cardColor,
            );
            const hasPdf =
              !!statement.pdfFileName &&
              statement.pdfFileName !== "—" &&
              !statement.soaUnavailable;
            const detailHref = ROUTES.dashboard.soaStatement(
              periodId,
              statement.id,
            );
            const payNow = shouldOfferStatementPayNow(
              statement,
              dueEntries,
              paid,
            );
            const paymentCount = paymentCountFor?.(statement) ?? 0;
            const missingSoa = isMissingSoa?.(statement) ?? false;

            const urgencyVariant =
              paid || days === null
                ? ("muted" as const)
                : days < 0
                  ? ("destructive" as const)
                  : days <= 4
                    ? ("warning" as const)
                    : ("default" as const);

            return (
              <ClickableTableRow
                key={statement.id}
                href={detailHref}
                style={accent.stripeStyle}
              >
                {showPeriodColumn && (
                  <TableCell className="text-muted-foreground">
                    {periodLabel(
                      statement.statementMonth,
                      statement.statementYear,
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <CardBankLabel
                    issuerId={statement.issuerId}
                    color={statement.cardColor}
                    label={statement.cardDisplayLabel}
                    showSwatch={false}
                  />
                </TableCell>
                <TableCell className="font-medium tabular-nums">
                  ···· {statement.cardLast4}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="flex flex-col items-start gap-1.5">
                    <span>
                      {statement.statementDate &&
                      statement.statementDate !== "—"
                        ? statement.statementDate
                        : "—"}
                    </span>
                    {missingSoa ? <MissingSoaBadge /> : null}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatDisplayAmount(statement.totalDue)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatDisplayAmount(statement.minimumDue)}
                </TableCell>
                <TableCell>
                  <div
                    className="flex flex-col items-start gap-1.5"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <span>{statement.dueDate ?? "—"}</span>
                    {paidReady && countdown && !paid && (
                      <StatusBadge label={countdown} variant={urgencyVariant} />
                    )}
                    {paidReady && payNow.show && payNow.dueEntryId && onPayNow ? (
                      <StatementPayNowButton
                        onClick={() => onPayNow(payNow.dueEntryId!)}
                        disabled={payNowDisabled}
                      />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  {paidReady ? (
                    <StatementPaidBadge paid={paid} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                {hasPdf ? (
                  <TableRowActions className="text-center">
                    <StatementSoaButton
                      onClick={() => onPreviewSource(statement)}
                    />
                  </TableRowActions>
                ) : (
                  <TableCell className="text-center">
                    <StatementSoaButton />
                  </TableCell>
                )}
                {paymentCount > 0 && onPreviewPayment ? (
                  <TableRowActions className="text-center">
                    <StatementPaymentButton
                      count={paymentCount}
                      onClick={() => onPreviewPayment(statement)}
                    />
                  </TableRowActions>
                ) : (
                  <TableCell className="text-center">
                    <StatementPaymentButton count={0} />
                  </TableCell>
                )}
              </ClickableTableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableCard>
  );
}
