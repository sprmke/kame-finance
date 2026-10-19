import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import {
  cardHasParsedSoaForStatementMonth,
  type CardBillingSchedule,
} from "@/lib/credit-cards/billing-cycle";
import {
  currentStatementMonth,
  expectedDueYmdsToEnsure,
  isStaleFutureExpectedDue,
} from "@/lib/credit-cards/expected-cycle";
import { formatExpectedDueDate } from "@/lib/credit-cards/expected-due";
import { normalizeCardLast4 } from "@/lib/due/normalize";
import { db } from "@/lib/db";
import { creditCards, dueEntries, formatBankIssuer, soaStatements } from "@/lib/db/schema";
import { todayYmdLocal } from "@/lib/reminders/reminder-status";

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
    let removed = 0;
    const removedIds = new Set<string>();

    for (const card of cards) {
      if (!card.dueDay) continue;

      const schedule = cardSchedule(card);
      const current = currentStatementMonth(asOfYmd, schedule.gmailMonthOffset);
      const targets = expectedDueYmdsToEnsure({
        asOfYmd,
        schedule,
        windowDays: card.reminderWindowDays ?? DEFAULT_WINDOW_DAYS,
        overdueFollowUpDays: OVERDUE_FOLLOW_UP_DAYS,
        hasParsedSoa: (year, month) =>
          cardHasParsedSoaForStatementMonth(statements, card, year, month),
      });
      const keep = new Set(targets);

      for (const entry of existing) {
        if (!sameCard(entry, card)) continue;
        if (entry.source !== "expected" || entry.paidAt) continue;
        if (
          !isStaleFutureExpectedDue(
            entry.dueDateYmd,
            schedule,
            current,
            keep,
          )
        ) {
          continue;
        }
        await db
          .delete(dueEntries)
          .where(
            and(eq(dueEntries.id, entry.id), eq(dueEntries.userId, userId)),
          );
        removedIds.add(entry.id);
        removed++;
      }

      for (const dueDateYmd of targets) {
        const dueMonth = dueDateYmd.slice(0, 7);
        const forMonth = existing.filter(
          (entry) =>
            !removedIds.has(entry.id) &&
            sameCard(entry, card) &&
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
          source: "expected" as const,
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

    if (added > 0 || updated > 0 || removed > 0) invalidateDueEntryRows();
    return { added, updated, removed };
  },
};

function sameCard(
  entry: { creditCardId: string | null; issuerId: string; cardLast4: string },
  card: { id: string; issuer: string; last4: string },
): boolean {
  if (entry.creditCardId && entry.creditCardId === card.id) return true;
  return (
    entry.issuerId.trim().toLowerCase() === card.issuer.trim().toLowerCase() &&
    normalizeCardLast4(entry.cardLast4) === normalizeCardLast4(card.last4)
  );
}
