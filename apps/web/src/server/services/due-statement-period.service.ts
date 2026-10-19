import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { statementMonthForDueYmd } from "@/lib/credit-cards/billing-cycle";
import { db } from "@/lib/db";
import { creditCards, soaStatements } from "@/lib/db/schema";
import { normalizeCardLast4 } from "@/lib/due/normalize";
import { dueEntryKey } from "@/lib/soa/outstanding";
import {
  formatSoaPeriodLabel,
  formatSoaPeriodLabelFromKey,
  soaPeriodMonthKey,
} from "@/lib/soa/period";

function statementOrdinal(year: number, month: number): number {
  return year * 12 + month;
}

type SoaStatementPeriodRow = {
  issuerId: string;
  cardLast4: string;
  dueDateYmd: string | null;
  statementMonth: number;
  statementYear: number;
};

function periodFromStatement(statement: SoaStatementPeriodRow): {
  statementPeriodKey: string;
  statementPeriodLabel: string;
} {
  return {
    statementPeriodKey: soaPeriodMonthKey(
      statement.statementYear,
      statement.statementMonth,
    ),
    statementPeriodLabel: formatSoaPeriodLabel(
      statement.statementMonth,
      statement.statementYear,
    ),
  };
}

function periodFromDueDateFallback(dueDateYmd: string): {
  statementPeriodKey: string;
  statementPeriodLabel: string;
} {
  const key = dueDateYmd.slice(0, 7);
  return {
    statementPeriodKey: key,
    statementPeriodLabel: formatSoaPeriodLabelFromKey(key),
  };
}

function periodFromCardSchedule(
  dueDateYmd: string,
  schedule: { statementDay: number | null; dueDay: number | null },
): {
  statementPeriodKey: string;
  statementPeriodLabel: string;
} {
  const { year, month } = statementMonthForDueYmd(dueDateYmd, schedule);
  return {
    statementPeriodKey: soaPeriodMonthKey(year, month),
    statementPeriodLabel: formatSoaPeriodLabel(month, year),
  };
}

export async function enrichDueEntriesWithSoaPeriod<
  T extends {
    issuerId: string;
    cardLast4: string;
    dueDateYmd: string;
    creditCardId?: string | null;
  },
>(userId: string, rows: T[]) {
  const [statements, cards] = await Promise.all([
    db.query.soaStatements.findMany({
      where: eq(soaStatements.userId, userId),
      columns: {
        issuerId: true,
        cardLast4: true,
        dueDateYmd: true,
        statementMonth: true,
        statementYear: true,
      },
    }),
    db.query.creditCards.findMany({
      where: and(eq(creditCards.userId, userId), isNull(creditCards.deletedAt)),
      columns: {
        id: true,
        issuer: true,
        last4: true,
        statementDay: true,
        dueDay: true,
      },
    }),
  ]);

  const stmtByDueKey = new Map<string, SoaStatementPeriodRow>();

  for (const stmt of statements) {
    const key = dueEntryKey(stmt.issuerId, stmt.cardLast4, stmt.dueDateYmd);
    const existing = stmtByDueKey.get(key);
    if (
      !existing ||
      statementOrdinal(stmt.statementYear, stmt.statementMonth) >
        statementOrdinal(existing.statementYear, existing.statementMonth)
    ) {
      stmtByDueKey.set(key, stmt);
    }
  }

  return rows.map((row) => {
    // Only trust a statement's billing period when its own due date exactly
    // matches this due entry. A "latest statement for this card" fallback used
    // to live here, but it could attribute a stale (already paid) due entry
    // from an older cycle to the newest statement's period — making the new,
    // unpaid statement show up as "Paid". Expected rows use the card's
    // statement and due days so a November payment still belongs to October.
    const matched = stmtByDueKey.get(
      dueEntryKey(row.issuerId, row.cardLast4, row.dueDateYmd),
    );

    if (matched) {
      return { ...row, ...periodFromStatement(matched) };
    }

    const card = cardScheduleForDue(cards, row);
    if (card) {
      return {
        ...row,
        ...periodFromCardSchedule(row.dueDateYmd, card),
      };
    }

    return { ...row, ...periodFromDueDateFallback(row.dueDateYmd) };
  });
}

function cardScheduleForDue(
  cards: readonly {
    id: string;
    issuer: string;
    last4: string;
    statementDay: number | null;
    dueDay: number | null;
  }[],
  row: { issuerId: string; cardLast4: string; creditCardId?: string | null },
): { statementDay: number | null; dueDay: number | null } | undefined {
  const byId = row.creditCardId
    ? cards.find((card) => card.id === row.creditCardId)
    : undefined;
  if (byId) {
    return { statementDay: byId.statementDay, dueDay: byId.dueDay };
  }
  const issuer = row.issuerId.trim().toLowerCase();
  const last4 = normalizeCardLast4(row.cardLast4);
  const match = cards.find(
    (card) =>
      card.issuer.trim().toLowerCase() === issuer &&
      normalizeCardLast4(card.last4) === last4,
  );
  if (!match) return undefined;
  return { statementDay: match.statementDay, dueDay: match.dueDay };
}
