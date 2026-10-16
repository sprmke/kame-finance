import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import {
  cardHasParsedSoaForStatementMonth,
  isOnOrPastExpectedStatementDate,
  targetStatementMonthForCard,
  type CardBillingSchedule,
} from "@/lib/credit-cards/billing-cycle";
import {
  expectedDueDateCandidates,
  formatExpectedDueDate,
} from "@/lib/credit-cards/expected-due";
import { estimatedDueYmdForStatementMonth } from "@/lib/soa/calendar-sync-rows";
import { db } from "@/lib/db";
import { creditCards, dueEntries, formatBankIssuer, soaStatements } from "@/lib/db/schema";
import { daysUntilYmd, todayYmdLocal } from "@/lib/reminders/reminder-status";

import { invalidateDueEntryRows } from "./user-rows.service";

const DEFAULT_WINDOW_DAYS = Math.max(
  0,
  Number(process.env.DUE_REMINDERS_WINDOW_DAYS ?? "4") || 4,
);
const OVERDUE_FOLLOW_UP_DAYS = 7;

type EnsureExpectedDueEntriesOptions = {
  asOfYmd?: string;
  cardId?: string;
};

function cardSchedule(card: {
  statementDay: number | null;
  dueDay: number | null;
  gmailMonthOffset: number | null;
}): CardBillingSchedule {
  return {
    statementDay: card.statementDay,
    dueDay: card.dueDay,
    gmailMonthOffset: card.gmailMonthOffset ?? 0,
  };
}

export const expectedDueEntryService = {
  async ensureForUser(
    userId: string,
    options: EnsureExpectedDueEntriesOptions = {},
  ) {
    const asOfYmd = options.asOfYmd ?? todayYmdLocal();
    const cards = await db.query.creditCards.findMany({
      where: and(
        eq(creditCards.userId, userId),
        isNull(creditCards.deletedAt),
        eq(creditCards.isActive, true),
        options.cardId ? eq(creditCards.id, options.cardId) : undefined,
      ),
    });
    const [existing, statements] = await Promise.all([
      db.query.dueEntries.findMany({
        where: eq(dueEntries.userId, userId),
      }),
      db.query.soaStatements.findMany({
        where: eq(soaStatements.userId, userId),
        columns: {
          creditCardId: true,
          issuerId: true,
          cardLast4: true,
          statementYear: true,
          statementMonth: true,
          soaUnavailable: true,
          dueDateYmd: true,
        },
      }),
    ]);
    let added = 0;
    let updated = 0;

    for (const card of cards) {
      if (!card.dueDay) continue;

      const schedule = cardSchedule(card);
      const { year, month } = targetStatementMonthForCard(
        asOfYmd,
        schedule.gmailMonthOffset,
      );
      const hasParsedSoa = cardHasParsedSoaForStatementMonth(
        statements,
        card,
        year,
        month,
      );
      const pastStatementDate = isOnOrPastExpectedStatementDate(
        asOfYmd,
        schedule,
      );

      const dueCandidates = new Set(
        pastStatementDate && !hasParsedSoa
          ? [
              estimatedDueYmdForStatementMonth(
                year,
                month,
                card.dueDay,
              ),
            ]
          : expectedDueDateCandidates(asOfYmd, card.dueDay),
      );

      for (const dueDateYmd of dueCandidates) {
        const daysAway = daysUntilYmd(dueDateYmd, asOfYmd);
        const windowDays = card.reminderWindowDays ?? DEFAULT_WINDOW_DAYS;
        const inDueWindow =
          daysAway <= windowDays && daysAway >= -OVERDUE_FOLLOW_UP_DAYS;
        const missingSoaForCycle =
          pastStatementDate &&
          !hasParsedSoa &&
          dueDateYmd ===
            estimatedDueYmdForStatementMonth(year, month, card.dueDay);

        if (!inDueWindow && !missingSoaForCycle) {
          continue;
        }

        const dueMonth = dueDateYmd.slice(0, 7);
        const forMonth = existing.filter(
          (entry) =>
            entry.creditCardId === card.id &&
            entry.dueDateYmd.startsWith(dueMonth),
        );
        if (forMonth.some((entry) => entry.source === "soa")) continue;

        const expected = forMonth.find((entry) => entry.source === "expected");
        const values = {
          issuerId: card.issuer,
          cardLast4: card.last4,
          bankLabel: formatBankIssuer(card.issuer),
          cardDisplayLabel: card.label,
          fullPan: card.fullPan,
          dueDate: formatExpectedDueDate(dueDateYmd),
          dueDateYmd,
          minimumDue: "—",
          totalDue: "—",
          contactLine: card.contactLine,
          source: "expected",
          creditCardId: card.id,
          updatedAt: new Date(),
        };

        if (expected) {
          await db
            .update(dueEntries)
            .set(values)
            .where(
              and(
                eq(dueEntries.id, expected.id),
                eq(dueEntries.userId, userId),
              ),
            );
          updated++;
          continue;
        }

        const inserted = await db
          .insert(dueEntries)
          .values({ userId, ...values })
          .onConflictDoNothing()
          .returning({ id: dueEntries.id });
        added += inserted.length;
      }
    }

    if (added > 0 || updated > 0) invalidateDueEntryRows();
    return { added, updated };
  },
};
