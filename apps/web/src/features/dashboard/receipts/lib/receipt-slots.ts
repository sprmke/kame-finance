import { isOnOrPastStatementDateForPeriod } from "@/lib/credit-cards/billing-cycle";
import { formatCardDisplayLabel } from "@/lib/credit-cards/card-display-label";
import { normalizeCardLast4 } from "@/lib/due/normalize";
import {
  formatSoaPeriodLabelFromKey,
  soaPeriodMonthKey,
} from "@/lib/soa/period";

import {
  receiptCardGroupKey,
  receiptCardLabel,
  receiptMonthGroup,
  type ReceiptGroupMode,
  type ReceiptListItem,
  type ReceiptMonthDueContext,
} from "./receipt-utils";

export type ReceiptSlotCard = {
  issuerId: string;
  last4: string;
  label?: string | null;
  color?: string | null;
  isActive: boolean;
  statementDay?: number | null;
};

export type ReceiptSlotDue = ReceiptMonthDueContext & {
  paidAt: Date | string | null;
  minimumDue: string | null;
  totalDue: string | null;
  cardDisplayLabel: string | null;
  bankLabel: string | null;
};

export type ReceiptSlotStatement = {
  id: string;
  issuerId: string;
  cardLast4: string;
  statementMonth: number;
  statementYear: number;
  pdfStoragePath: string | null;
  pdfFileName: string | null;
  soaUnavailable: boolean | null;
};

export type ReceiptSlot = {
  key: string;
  periodKey: string;
  periodLabel: string;
  cardKey: string;
  issuerId: string;
  cardLast4: string;
  label: string;
  color: string | null;
  dueEntryId: string | null;
  dueDateYmd: string | null;
  minimumDue: string | null;
  totalDue: string | null;
  paid: boolean;
  statementId: string | null;
  soaMissing: boolean;
  receipts: ReceiptListItem[];
};

export type ReceiptBoardGroup = {
  key: string;
  label: string;
  slots: ReceiptSlot[];
  looseReceipts: ReceiptListItem[];
  paidCount: number;
  totalCount: number;
};

type RegistryCard = ReceiptSlotCard & {
  fromRegistry: boolean;
  bankLabel: string | null;
};

function slotCardKey(issuerId: string, last4: string): string {
  return `${issuerId.trim().toLowerCase()}:${normalizeCardLast4(last4)}`;
}

export function currentReceiptPeriodKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function ymdFromDate(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function statementCountsAsSoa(
  statement: ReceiptSlotStatement | undefined,
): boolean {
  return Boolean(statement && !statement.soaUnavailable);
}

export function isReceiptSlotMissingSoa(
  card: Pick<ReceiptSlotCard, "statementDay">,
  periodKey: string,
  statement: ReceiptSlotStatement | undefined,
  now: Date,
): boolean {
  if (statementCountsAsSoa(statement)) return false;
  if (card.statementDay == null) return false;
  const match = /^(\d{4})-(\d{2})$/.exec(periodKey);
  if (!match) return false;
  return isOnOrPastStatementDateForPeriod(
    ymdFromDate(now),
    Number(match[1]),
    Number(match[2]),
    { statementDay: card.statementDay },
  );
}

function statementHasPdf(statement: ReceiptSlotStatement): boolean {
  if (statement.soaUnavailable) return false;
  if (statement.pdfStoragePath) return true;
  const name = statement.pdfFileName?.trim();
  return Boolean(name && name !== "—" && name !== "-");
}

function banksAlign(
  bankDetected: string | null,
  card: RegistryCard,
): boolean {
  const bank = bankDetected?.trim().toLowerCase();
  if (!bank) return false;
  const issuer = card.issuerId.toLowerCase();
  const label = `${card.label ?? ""} ${card.bankLabel ?? ""}`.toLowerCase();
  return (
    issuer.includes(bank) || bank.includes(issuer) || label.includes(bank)
  );
}

function matchReceiptCardKey(
  receipt: ReceiptListItem,
  cardsByKey: Map<string, RegistryCard>,
  dues: ReceiptSlotDue[],
): string | null {
  if (receipt.dueEntryId) {
    const due = dues.find((row) => row.id === receipt.dueEntryId);
    if (due) return slotCardKey(due.issuerId, due.cardLast4);
  }

  const raw = receipt.parsedCardLast4?.replace(/\D/g, "") ?? "";
  if (!raw) return null;
  const last4 = normalizeCardLast4(raw);
  const matches = [...cardsByKey.entries()].filter(
    ([, card]) => normalizeCardLast4(card.last4) === last4,
  );
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0]![0];

  const byBank = matches.find(([, card]) =>
    banksAlign(receipt.bankDetected, card),
  );
  return (byBank ?? matches[0])![0];
}

function labelForCard(
  card: RegistryCard,
  dues: ReceiptSlotDue[],
): string {
  const named = dues.find(
    (due) =>
      slotCardKey(due.issuerId, due.cardLast4) ===
        slotCardKey(card.issuerId, card.last4) && due.cardDisplayLabel,
  );
  if (named?.cardDisplayLabel) return named.cardDisplayLabel;
  return formatCardDisplayLabel(card.issuerId, card.label ?? card.bankLabel);
}

function paidSummary(slots: ReceiptSlot[]): {
  paidCount: number;
  totalCount: number;
} {
  return {
    totalCount: slots.length,
    paidCount: slots.filter((slot) => slot.paid).length,
  };
}

export function buildReceiptBoard(input: {
  mode: ReceiptGroupMode;
  receipts: ReceiptListItem[];
  cards: ReceiptSlotCard[];
  dues: ReceiptSlotDue[];
  statements?: ReceiptSlotStatement[];
  now?: Date;
}): ReceiptBoardGroup[] {
  const {
    mode,
    receipts,
    cards,
    dues,
    statements = [],
    now = new Date(),
  } = input;
  const currentKey = currentReceiptPeriodKey(now);
  const dueContext: ReceiptMonthDueContext[] = dues;

  const cardsByKey = new Map<string, RegistryCard>();
  for (const card of cards) {
    cardsByKey.set(slotCardKey(card.issuerId, card.last4), {
      ...card,
      fromRegistry: true,
      bankLabel: null,
    });
  }
  for (const due of dues) {
    const key = slotCardKey(due.issuerId, due.cardLast4);
    if (cardsByKey.has(key)) continue;
    cardsByKey.set(key, {
      issuerId: due.issuerId,
      last4: due.cardLast4,
      label: due.cardDisplayLabel,
      color: null,
      isActive: false,
      fromRegistry: false,
      bankLabel: due.bankLabel,
    });
  }

  const receiptsBySlot = new Map<string, ReceiptListItem[]>();
  const loose: ReceiptListItem[] = [];

  for (const receipt of receipts) {
    const month = receiptMonthGroup(receipt, dueContext);
    const cardKey = matchReceiptCardKey(receipt, cardsByKey, dues);
    if (!cardKey) {
      loose.push(receipt);
      continue;
    }
    const slotKey = `${cardKey}|${month.key}`;
    const list = receiptsBySlot.get(slotKey) ?? [];
    list.push(receipt);
    receiptsBySlot.set(slotKey, list);
  }

  for (const list of receiptsBySlot.values()) {
    list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  const statementBySlot = new Map<string, ReceiptSlotStatement>();
  for (const statement of statements) {
    const key = `${slotCardKey(statement.issuerId, statement.cardLast4)}|${soaPeriodMonthKey(statement.statementYear, statement.statementMonth)}`;
    const existing = statementBySlot.get(key);
    if (!existing || (statementHasPdf(statement) && !statementHasPdf(existing))) {
      statementBySlot.set(key, statement);
    }
  }

  const dueBySlot = new Map<string, ReceiptSlotDue>();
  for (const due of dues) {
    const key = `${slotCardKey(due.issuerId, due.cardLast4)}|${due.statementPeriodKey}`;
    const existing = dueBySlot.get(key);
    if (!existing || due.dueDateYmd > existing.dueDateYmd) {
      dueBySlot.set(key, due);
    }
  }

  function makeSlot(cardKey: string, monthKey: string): ReceiptSlot {
    const card = cardsByKey.get(cardKey)!;
    const slotKey = `${cardKey}|${monthKey}`;
    const due = dueBySlot.get(slotKey);
    const slotReceipts = receiptsBySlot.get(slotKey) ?? [];
    const statement = statementBySlot.get(slotKey);
    const firstReceipt = slotReceipts[0];
    const paid =
      Boolean(due?.paidAt) ||
      slotReceipts.some((receipt) => receipt.paymentStatus === "marked_paid");

    return {
      key: slotKey,
      periodKey: monthKey,
      periodLabel:
        due?.statementPeriodLabel ?? formatSoaPeriodLabelFromKey(monthKey),
      cardKey,
      issuerId: card.issuerId,
      cardLast4: normalizeCardLast4(card.last4),
      label: labelForCard(card, dues),
      color: card.color ?? null,
      dueEntryId: due?.id ?? firstReceipt?.dueEntryId ?? null,
      dueDateYmd: due?.dueDateYmd ?? firstReceipt?.dueDateYmd ?? null,
      minimumDue: due?.minimumDue ?? firstReceipt?.minimumDue ?? null,
      totalDue: due?.totalDue ?? firstReceipt?.totalDue ?? null,
      paid,
      statementId:
        statement && statementHasPdf(statement) ? statement.id : null,
      soaMissing: isReceiptSlotMissingSoa(card, monthKey, statement, now),
      receipts: slotReceipts,
    };
  }

  function includeSlot(
    card: RegistryCard,
    monthKey: string,
    due: ReceiptSlotDue | undefined,
    slotReceipts: ReceiptListItem[],
  ): boolean {
    if (due || slotReceipts.length > 0) return true;
    return monthKey === currentKey && card.fromRegistry && card.isActive;
  }

  if (mode === "month") {
    const monthKeys = new Set<string>([currentKey]);
    for (const due of dues) monthKeys.add(due.statementPeriodKey);
    for (const receipt of receipts) {
      monthKeys.add(receiptMonthGroup(receipt, dueContext).key);
    }

    return [...monthKeys]
      .sort((a, b) => b.localeCompare(a))
      .flatMap((monthKey) => {
        const slots = [...cardsByKey.entries()]
          .filter(([cardKey, card]) => {
            const slotKey = `${cardKey}|${monthKey}`;
            return includeSlot(
              card,
              monthKey,
              dueBySlot.get(slotKey),
              receiptsBySlot.get(slotKey) ?? [],
            );
          })
          .map(([cardKey]) => makeSlot(cardKey, monthKey))
          .sort((a, b) => a.label.localeCompare(b.label));

        const looseReceipts = loose.filter(
          (receipt) => receiptMonthGroup(receipt, dueContext).key === monthKey,
        );
        if (slots.length === 0 && looseReceipts.length === 0) return [];

        return [
          {
            key: monthKey,
            label:
              slots[0]?.periodLabel ?? formatSoaPeriodLabelFromKey(monthKey),
            slots,
            looseReceipts,
            ...paidSummary(slots),
          },
        ];
      });
  }

  const groups: ReceiptBoardGroup[] = [];

  for (const [cardKey, card] of cardsByKey) {
    const monthKeys = new Set<string>();
    if (card.fromRegistry && card.isActive) monthKeys.add(currentKey);
    for (const due of dues) {
      if (slotCardKey(due.issuerId, due.cardLast4) === cardKey) {
        monthKeys.add(due.statementPeriodKey);
      }
    }
    for (const slotKey of receiptsBySlot.keys()) {
      const prefix = `${cardKey}|`;
      if (slotKey.startsWith(prefix)) monthKeys.add(slotKey.slice(prefix.length));
    }

    const slots = [...monthKeys]
      .filter((monthKey) => {
        const slotKey = `${cardKey}|${monthKey}`;
        return includeSlot(
          card,
          monthKey,
          dueBySlot.get(slotKey),
          receiptsBySlot.get(slotKey) ?? [],
        );
      })
      .sort((a, b) => b.localeCompare(a))
      .map((monthKey) => makeSlot(cardKey, monthKey));

    if (slots.length === 0) continue;

    const currentSlots = slots.filter((slot) => slot.periodKey === currentKey);

    groups.push({
      key: cardKey,
      label: labelForCard(card, dues),
      slots,
      looseReceipts: [],
      ...paidSummary(currentSlots.length > 0 ? currentSlots : slots),
    });
  }

  groups.sort((a, b) => a.label.localeCompare(b.label));

  const orphanMap = new Map<string, ReceiptListItem[]>();
  for (const receipt of loose) {
    const key = receiptCardGroupKey(receipt);
    const list = orphanMap.get(key) ?? [];
    list.push(receipt);
    orphanMap.set(key, list);
  }

  for (const [key, items] of orphanMap) {
    groups.push({
      key: `loose:${key}`,
      label: receiptCardLabel(items[0]!),
      slots: [],
      looseReceipts: items,
      paidCount: 0,
      totalCount: 0,
    });
  }

  return groups;
}
