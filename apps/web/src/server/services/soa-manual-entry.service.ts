import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  creditCards,
  soaPeriods,
  soaStatements,
  soaTransactions,
} from "@/lib/db/schema";
import { formatBankIssuer } from "@/lib/db/schema/credit-cards";
import { normalizeCardLast4 } from "@/lib/due/normalize";
import { parseDueDateToYmd } from "@/lib/due/parse-due-date";
import {
  formatSoaDisplayDate,
  isMonthInInclusiveRange,
} from "@/lib/soa/calendar-month";
import {
  encodeTransactionAmount,
  formatSoaMoney,
  netManualTransactionTotal,
} from "@/lib/soa/manual-entry";
import { pickCanonicalSoaStatements } from "@/lib/soa/statement-identity";
import { isValidCategorySlug } from "@/lib/transactions/categories";

import { creditCardService } from "./credit-card.service";
import { dueEntryUpsertService } from "./due-entry-upsert.service";
import { soaStatementLookupWhere } from "./soa-persist.service";
import { soaPersistService } from "./soa-persist.service";
import {
  categorizeTransaction,
  transactionCategoryService,
} from "./transaction-category.service";
import {
  invalidateDueEntryRows,
  invalidateSoaStatementRows,
} from "./user-rows.service";

export type ManualSoaTransactionInput = {
  date: string;
  description: string;
  amount: number;
  credit: boolean;
  categorySlug?: string;
};

export type ManualSoaEntryInput = {
  periodId: string;
  creditCardId: string;
  statementMonth: number;
  statementYear: number;
  statementDate: string;
  dueDate: string;
  minimumDue: number;
  totalDue: number;
  transactions: ManualSoaTransactionInput[];
};

function cents(value: number): number {
  return Math.round(value * 100);
}

export const soaManualEntryService = {
  async create(userId: string, input: ManualSoaEntryInput) {
    const period = await db.query.soaPeriods.findFirst({
      where: and(eq(soaPeriods.id, input.periodId), eq(soaPeriods.userId, userId)),
    });
    if (!period) {
      throw new TRPCError({ code: "NOT_FOUND", message: "SOA period not found" });
    }

    const statementMonth = {
      month: input.statementMonth,
      year: input.statementYear,
    };
    if (
      !isMonthInInclusiveRange(
        statementMonth,
        { month: period.fromMonth, year: period.fromYear },
        { month: period.toMonth, year: period.toYear },
      )
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Statement month is outside this period",
      });
    }

    const card = await db.query.creditCards.findFirst({
      where: and(
        eq(creditCards.id, input.creditCardId),
        eq(creditCards.userId, userId),
        isNull(creditCards.deletedAt),
      ),
    });
    if (!card) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Card not found" });
    }

    const statementDate = formatSoaDisplayDate(input.statementDate);
    const dueDate = formatSoaDisplayDate(input.dueDate);
    if (!statementDate || !dueDate || !parseDueDateToYmd(dueDate)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Enter a valid statement date and due date",
      });
    }

    const [rules, customLabels] = await Promise.all([
      transactionCategoryService.getRulesForUser(userId),
      transactionCategoryService.getCustomLabelMap(userId),
    ]);
    const customSlugs = new Set(customLabels.keys());

    const storedTransactions = input.transactions.map((tx) => {
      if (
        tx.categorySlug &&
        !isValidCategorySlug(tx.categorySlug) &&
        !customSlugs.has(tx.categorySlug)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unknown category",
        });
      }

      const credit =
        tx.credit ||
        /\b(payment|paid|thank you|autopay|auto-pay)\b/i.test(tx.description);
      const amount = encodeTransactionAmount(tx.amount, credit);
      const date = formatSoaDisplayDate(tx.date);
      if (!date) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Enter a valid transaction date",
        });
      }

      const categorized = categorizeTransaction(
        {
          description: tx.description.trim(),
          amount,
          categorySlug: tx.categorySlug ?? null,
          categorySource: tx.categorySlug ? "manual" : null,
        },
        rules,
        customSlugs,
      );

      return {
        date,
        description: tx.description.trim(),
        amount,
        categorySlug: categorized.categorySlug,
        categorySource: categorized.categorySource,
      };
    });

    const totalValue = storedTransactions.length
      ? netManualTransactionTotal(storedTransactions)
      : input.totalDue;
    if (cents(input.minimumDue) > cents(totalValue)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Minimum due cannot exceed total due",
      });
    }

    const minimumDue = formatSoaMoney(input.minimumDue);
    const totalDue = formatSoaMoney(totalValue);
    const cardLast4 = normalizeCardLast4(card.last4);
    const bankLabel = card.label?.trim() || formatBankIssuer(card.issuer);
    const issuerId = card.issuer.toLowerCase();

    const matches = await db.query.soaStatements.findMany({
      where: soaStatementLookupWhere(
        userId,
        { issuerId, cardLast4 },
        statementMonth,
      ),
    });
    const { keep, drop } = pickCanonicalSoaStatements(matches);
    const existing = keep[0] ?? null;

    const statementId = await db.transaction(async (tx) => {
      if (drop.length > 0) {
        await tx.delete(soaStatements).where(
          inArray(
            soaStatements.id,
            drop.map((row) => row.id),
          ),
        );
      }

      const values = {
        creditCardId: card.id,
        bankLabel,
        minimumDue,
        totalDue,
        statementDate,
        dueDate,
        dueDateYmd: parseDueDateToYmd(dueDate),
        soaUnavailable: false,
      };

      let id = existing?.id;
      if (existing) {
        await tx
          .update(soaStatements)
          .set({
            ...values,
            issuerId,
            cardLast4,
          })
          .where(
            and(eq(soaStatements.id, existing.id), eq(soaStatements.userId, userId)),
          );
      } else {
        const [inserted] = await tx
          .insert(soaStatements)
          .values({
            userId,
            statementMonth: statementMonth.month,
            statementYear: statementMonth.year,
            issuerId,
            cardLast4,
            sourceEmailSubject: "Manual entry",
            sourceMessageId: `manual-entry:${card.id}:${statementMonth.year}-${String(statementMonth.month).padStart(2, "0")}`,
            parseNotes: "Entered manually",
            ...values,
          })
          .returning({ id: soaStatements.id });
        id = inserted?.id;
      }

      if (!id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not save this statement",
        });
      }

      if (storedTransactions.length > 0) {
        await tx
          .delete(soaTransactions)
          .where(eq(soaTransactions.soaStatementId, id));
        await tx.insert(soaTransactions).values(
          storedTransactions.map((line) => ({
            soaStatementId: id,
            date: line.date,
            description: line.description,
            amount: line.amount,
            categorySlug: line.categorySlug,
            categorySource: line.categorySource,
          })),
        );
      }

      return id;
    });

    await soaPersistService.collapseDuplicateStatements(userId);

    const dueTransactions =
      storedTransactions.length > 0
        ? storedTransactions
        : (
            await db.query.soaTransactions.findMany({
              where: eq(soaTransactions.soaStatementId, statementId),
            })
          ).map((line) => ({
            date: line.date ?? "",
            description: line.description,
            amount: line.amount,
          }));

    await dueEntryUpsertService.upsertFromSoaRows(userId, [
      {
        issuerId,
        cardLast4,
        bankLabel,
        cardDisplayLabel: card.label ?? undefined,
        fullPan: card.fullPan ?? undefined,
        dueDate,
        minimumDue,
        totalDue,
        contactLine: card.contactLine ?? undefined,
        transactions: dueTransactions,
      },
    ]);
    await creditCardService.syncDueDaysFromStatements(userId);
    await creditCardService.syncStatementDaysFromStatements(userId);
    invalidateSoaStatementRows();
    invalidateDueEntryRows();

    return {
      statementId,
      status: existing ? ("updated" as const) : ("saved" as const),
    };
  },
};
