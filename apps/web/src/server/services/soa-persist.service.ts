import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { creditCards, soaStatements, soaTransactions } from "@/lib/db/schema";
import { parseDueDateToYmd } from "@/lib/due/parse-due-date";
import { normalizeCardLast4 } from "@/lib/due/normalize";
import { pickCanonicalSoaStatements } from "@/lib/soa/statement-identity";

import {
  categorizeTransaction,
  transactionCategoryService,
} from "./transaction-category.service";
import { invalidateSoaStatementRows } from "./user-rows.service";

type SoaRow = {
  bankLabel: string;
  issuerId: string;
  cardLast4: string;
  sourceEmailSubject: string;
  sourceMessageId: string;
  pdfFileName: string;
  minimumDue: string;
  totalDue: string;
  statementDate: string;
  dueDate: string;
  parseNotes?: string;
  soaUnavailable?: boolean;
  pdfStoragePath?: string | null;
  transactions?: { date: string; description: string; amount: string }[];
};

export const soaPersistService = {
  async persistRows(
    userId: string,
    rows: SoaRow[],
    period: { month: number; year: number },
  ) {
    const userCards = await db.query.creditCards.findMany({
      where: and(eq(creditCards.userId, userId), isNull(creditCards.deletedAt)),
    });

    let saved = 0;
    let updated = 0;
    let unavailable = 0;

    for (const row of rows) {
      if (row.soaUnavailable && row.cardLast4 === "—") {
        // Bank-level placeholder (no SOA email for this issuer at all) — expand to
        // every card under that issuer so each one gets its own "unavailable" record.
        const issuerCards = userCards.filter(
          (c) => c.issuer.toLowerCase() === row.issuerId.toLowerCase(),
        );
        for (const card of issuerCards) {
          const expanded = {
            ...row,
            cardLast4: normalizeCardLast4(card.last4),
            soaUnavailable: true,
          };
          const result = await persistOneRow(
            userId,
            expanded,
            period,
            userCards,
          );
          if (result === "saved") saved++;
          if (result === "updated") updated++;
          if (result === "unavailable") unavailable++;
        }
        continue;
      }

      if (row.cardLast4 === "—") continue;

      // Card-level placeholder (bank had SOA email(s) this period, but this specific
      // card had no matching PDF/row) or a normally parsed row — both persist via the
      // same path; persistOneRow reports "unavailable" when row.soaUnavailable is set.
      const result = await persistOneRow(userId, row, period, userCards);
      if (result === "saved") saved++;
      if (result === "updated") updated++;
      if (result === "unavailable") unavailable++;
    }

    await collapseDuplicateStatements(userId);

    return { saved, updated, unavailable };
  },

  async collapseDuplicateStatements(userId: string) {
    return collapseDuplicateStatements(userId);
  },
};

type PersistRowResult = "saved" | "updated" | "skipped" | "unavailable";

/**
 * One statement row per (user, issuer, card, period) — always. Previously this
 * matched real (parsed) rows by `sourceMessageId`/`pdfFileName` while
 * "unavailable" placeholders (which never have a real message id or file
 * name) matched by card instead. That let a placeholder saved on one run and
 * the real statement found on a later run resolve to two different lookups,
 * so the real row was INSERTed next to the placeholder instead of replacing
 * it — the duplicate "blank card + real card" rows in the SOA table. Two Gmail
 * messages for the same card (e.g. Metrobank MSOA + SOA) used to insert two
 * fully parsed rows as well. Lookups now match every leftover row for the
 * card+period, keep one, and delete the extras.
 */
export function soaStatementLookupWhere(
  userId: string,
  row: Pick<SoaRow, "issuerId" | "cardLast4">,
  period: { month: number; year: number },
) {
  return and(
    eq(soaStatements.userId, userId),
    sql`lower(${soaStatements.issuerId}) = ${row.issuerId.toLowerCase()}`,
    eq(soaStatements.cardLast4, normalizeCardLast4(row.cardLast4)),
    eq(soaStatements.statementMonth, period.month),
    eq(soaStatements.statementYear, period.year),
  );
}

async function collapseDuplicateStatements(userId: string) {
  const rows = await db.query.soaStatements.findMany({
    where: eq(soaStatements.userId, userId),
    orderBy: [desc(soaStatements.createdAt)],
  });
  const { keep, drop } = pickCanonicalSoaStatements(rows);
  if (drop.length === 0) return { removed: 0, kept: keep.length };

  await db
    .delete(soaStatements)
    .where(
      inArray(
        soaStatements.id,
        drop.map((row) => row.id),
      ),
    );
  invalidateSoaStatementRows();
  return { removed: drop.length, kept: keep.length };
}

async function persistOneRow(
  userId: string,
  row: SoaRow,
  period: { month: number; year: number },
  userCards: { id: string; issuer: string; last4: string }[],
): Promise<PersistRowResult> {
  const cardLast4 = normalizeCardLast4(row.cardLast4);
  const creditCard = userCards.find(
    (c) =>
      c.issuer.toLowerCase() === row.issuerId.toLowerCase() &&
      normalizeCardLast4(c.last4) === cardLast4,
  );

  const matches = await db.query.soaStatements.findMany({
    where: soaStatementLookupWhere(userId, { ...row, cardLast4 }, period),
  });
  const { keep, drop } = pickCanonicalSoaStatements(matches);
  if (drop.length > 0) {
    await db
      .delete(soaStatements)
      .where(
        inArray(
          soaStatements.id,
          drop.map((match) => match.id),
        ),
      );
    invalidateSoaStatementRows();
  }
  const existing = keep[0] ?? null;

  // Never let a "no SOA email found this run" placeholder erase a
  // previously saved real statement. Overwriting it would wipe the real
  // `dueDateYmd`, which in turn breaks the due-entry ↔ statement matching
  // used for the "Paid" badge (a stale paid due from another period can
  // then get attributed to this statement once its own due date is gone).
  if (row.soaUnavailable && existing && !existing.soaUnavailable) {
    return "skipped";
  }

  const statementValues = {
    creditCardId: creditCard?.id,
    bankLabel: row.bankLabel,
    sourceEmailSubject: row.sourceEmailSubject,
    sourceMessageId: row.sourceMessageId,
    pdfFileName: row.pdfFileName,
    minimumDue: row.minimumDue,
    totalDue: row.totalDue,
    statementDate: row.statementDate,
    dueDate: row.dueDate,
    dueDateYmd: parseDueDateToYmd(row.dueDate),
    parseNotes: row.parseNotes,
    soaUnavailable: row.soaUnavailable ?? false,
    ...(row.pdfStoragePath ? { pdfStoragePath: row.pdfStoragePath } : {}),
  };

  let statement = existing;

  if (existing) {
    const [row_] = await db
      .update(soaStatements)
      .set({
        ...statementValues,
        cardLast4,
        creditCardId: creditCard?.id ?? null,
      })
      .where(eq(soaStatements.id, existing.id))
      .returning();
    statement = row_ ?? existing;
    await db
      .delete(soaTransactions)
      .where(eq(soaTransactions.soaStatementId, existing.id));
  } else {
    const [row_] = await db
      .insert(soaStatements)
      .values({
        userId,
        statementMonth: period.month,
        statementYear: period.year,
        issuerId: row.issuerId,
        cardLast4,
        ...statementValues,
      })
      .returning();
    statement = row_ ?? null;
  }

  if (!statement) return "skipped";

  if (row.transactions?.length) {
    const [rules, customLabels] = await Promise.all([
      transactionCategoryService.getRulesForUser(userId),
      transactionCategoryService.getCustomLabelMap(userId),
    ]);
    const customSlugs = new Set(customLabels.keys());
    await db.insert(soaTransactions).values(
      row.transactions.map((t) => {
        const categorized = categorizeTransaction(t, rules, customSlugs);
        return {
          soaStatementId: statement.id,
          date: t.date,
          description: t.description,
          amount: t.amount,
          categorySlug: categorized.categorySlug,
          categorySource: categorized.categorySource,
        };
      }),
    );
  }

  if (row.soaUnavailable) return "unavailable";

  return existing ? "updated" : "saved";
}
