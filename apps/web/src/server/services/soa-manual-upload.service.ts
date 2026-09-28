import "server-only";

import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import { TRPCError } from "@trpc/server";

import { and, eq, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { soaPeriods, soaStatements, type BankIssuer } from "@/lib/db/schema";
import { normalizeCardLast4 } from "@/lib/due/normalize";
import {
  isImageMime,
  isPdfMime,
  resolveAllowedUploadMime,
} from "@/lib/files/sniff-upload";
import {
  calendarMonthFromSoaDates,
  enumerateCalendarMonths,
  isValidCalendarMonth,
  normalizeSoaDisplayDate,
  parseSoaCalendarDate,
  type CalendarMonth,
} from "@/lib/soa/calendar-month";
import {
  bankLabelForIssuer,
  detectIssuerFromSoaText,
} from "@/lib/soa/detect-issuer";
import { collapseLetterSpacedText } from "@/lib/soa/letter-spacing";
import { alignManualUploadMonth } from "@/lib/soa/manual-upload-align";
import {
  applyMatchedCardMeta,
  mergeAiIntoSoaRow,
  pickIdentityText,
  resolveManualUploadIdentity,
  soaRowNeedsAiFill,
  statementHasParsedAmounts,
  type PeriodIssuerSlot,
} from "@/lib/soa/manual-upload-identity";
import {
  ocrDisabledForIssuer,
  ocrForcedForIssuer,
  ocrTuningForIssuer,
} from "@/lib/soa/ocr-env";
import { parseSoaText } from "@/lib/soa/parse-soa";
import { extractTransactions } from "@/lib/soa/parse-transactions";
import {
  extractPdfLinesReadingOrderDualAxis,
  tryUnlockAndExtractText,
} from "@/lib/soa/pdf";
import { ocrPdfToPlainText, parseSoaOcrPsmEnv } from "@/lib/soa/pdf-ocr";
import { formatSoaPeriodLabel } from "@/lib/soa/period";
import { privateStoragePathBelongsToUser } from "@/lib/storage/owned-path";
import {
  assessSoaTextQuality,
  pickBetterSoaText,
} from "@/lib/soa/text-quality";
import type { CardCredential, SoaRow, TransactionLine } from "@/lib/soa/types";
import { rasterizePdfPages } from "@/server/lib/pdf-rasterize";

import { creditCardService } from "./credit-card.service";
import { dueEntryUpsertService } from "./due-entry-upsert.service";
import { decryptPdfFile } from "./pdf-unlock.service";
import {
  soaAiExtractService,
  type SoaAiExtractResult,
} from "./soa-ai-extract.service";
import { soaPersistService } from "./soa-persist.service";
import { storageService } from "./storage.service";
import { invalidateSoaStatementRows } from "./user-rows.service";

const CARD_UNKNOWN_MESSAGE =
  "Could not detect which card this statement belongs to.";

function credentialsFromPipeline(
  cards: Awaited<ReturnType<typeof creditCardService.listForSoaPipeline>>,
): CardCredential[] {
  return cards.map((c) => ({
    issuer: c.issuer,
    last4: c.last4,
    password: c.password,
    label: c.label,
    fullPan: c.fullPan,
    contactLine: c.contactLine,
  }));
}

function dueDayFromSoaRow(row: SoaRow): number | null {
  const d = parseSoaCalendarDate(row.dueDate);
  if (!d) return null;
  const day = d.getDate();
  return day >= 1 && day <= 31 ? day : null;
}

async function ensureDetectedCard(
  userId: string,
  issuerId: string,
  last4: string,
  row: SoaRow,
  pdfPassword: string,
): Promise<{ created: boolean; restored: boolean }> {
  const issuer = issuerId.toLowerCase() as BankIssuer;
  return creditCardService.ensureForManualUpload(userId, {
    issuer,
    last4,
    pdfPassword,
    dueDay: dueDayFromSoaRow(row),
    label: row.cardDisplayLabel?.trim() || undefined,
  });
}

function rcbcGeomImproves(
  baseline: TransactionLine[],
  candidate: TransactionLine[],
): boolean {
  if (candidate.length === 0) return false;
  return candidate.length > baseline.length;
}

function previewFromRow(
  row: SoaRow,
  month: CalendarMonth | null,
  usedAi: boolean,
) {
  return {
    issuerId: row.issuerId,
    bankLabel: row.bankLabel,
    cardLast4: row.cardLast4,
    statementDate: row.statementDate,
    dueDate: row.dueDate,
    minimumDue: row.minimumDue,
    totalDue: row.totalDue,
    transactionCount: row.transactions?.length ?? 0,
    month: month?.month ?? null,
    year: month?.year ?? null,
    usedAi,
  };
}

function rowFromAi(
  ai: SoaAiExtractResult,
  fileName: string,
  messageId: string,
  issuerId: string,
  last4: string,
): SoaRow {
  return {
    bankLabel: bankLabelForIssuer(issuerId),
    issuerId,
    cardLast4: last4,
    sourceEmailSubject: "Manual upload",
    sourceMessageId: messageId,
    pdfFileName: fileName,
    minimumDue: ai.minimumDue ?? "—",
    totalDue: ai.totalDue ?? "—",
    statementDate: ai.statementDate ?? "—",
    dueDate: ai.dueDate ?? "—",
    transactions: ai.transactions,
  };
}

function finalizeRow(row: SoaRow, cards: CardCredential[]): SoaRow {
  const dated = {
    ...row,
    statementDate: normalizeSoaDisplayDate(row.statementDate),
    dueDate: normalizeSoaDisplayDate(row.dueDate),
  };
  return applyMatchedCardMeta(dated, cards);
}

export type ManualUploadProcessInput = {
  periodId: string;
  storagePath: string;
  originalFileName: string;
  mimeType?: string;
  forceMonth?: number;
  forceYear?: number;
  allowOutOfRange?: boolean;
};

export type ManualUploadProcessResult =
  | {
      status: "saved" | "updated";
      fileName: string;
      assignedMonth: CalendarMonth;
      outOfRange: boolean;
      cardCreated: boolean;
      preview: ReturnType<typeof previewFromRow>;
    }
  | {
      status: "needs_confirmation";
      fileName: string;
      reason: "out_of_range" | "unknown_month";
      detected: CalendarMonth | null;
      periodMonths: CalendarMonth[];
      periodLabel: string;
      preview: ReturnType<typeof previewFromRow>;
    }
  | {
      status: "error";
      fileName: string;
      message: string;
    };

async function loadPeriod(userId: string, periodId: string) {
  const period = await db.query.soaPeriods.findFirst({
    where: and(eq(soaPeriods.id, periodId), eq(soaPeriods.userId, userId)),
  });
  if (!period) {
    throw new TRPCError({ code: "NOT_FOUND", message: "SOA period not found" });
  }
  return period;
}

async function loadPeriodIssuerSlots(
  userId: string,
  months: CalendarMonth[],
): Promise<PeriodIssuerSlot[]> {
  if (months.length === 0) return [];
  const monthConds = months.map((m) =>
    and(
      eq(soaStatements.statementMonth, m.month),
      eq(soaStatements.statementYear, m.year),
    ),
  );
  const rows = await db.query.soaStatements.findMany({
    where: and(eq(soaStatements.userId, userId), or(...monthConds)),
    columns: {
      issuerId: true,
      cardLast4: true,
      soaUnavailable: true,
      minimumDue: true,
      totalDue: true,
      statementDate: true,
      dueDate: true,
    },
  });
  return rows.map((r) => ({
    issuerId: r.issuerId,
    last4: r.cardLast4,
    soaUnavailable: Boolean(r.soaUnavailable),
    hasParsedAmounts: statementHasParsedAmounts(r),
  }));
}

/** Drop a blank/mistaken duplicate row left behind when upload remapped last-4. */
async function dropRemappedDuplicateStatement(
  userId: string,
  issuerId: string,
  orphanLast4: string,
  keepLast4: string,
  month: CalendarMonth,
) {
  const orphan = normalizeCardLast4(orphanLast4);
  const keep = normalizeCardLast4(keepLast4);
  if (!orphan || orphan === keep) return;
  const deleted = await db
    .delete(soaStatements)
    .where(
      and(
        eq(soaStatements.userId, userId),
        sql`lower(${soaStatements.issuerId}) = ${issuerId.toLowerCase()}`,
        eq(soaStatements.cardLast4, orphan),
        eq(soaStatements.statementMonth, month.month),
        eq(soaStatements.statementYear, month.year),
        or(
          eq(soaStatements.soaUnavailable, true),
          and(
            eq(soaStatements.minimumDue, "—"),
            eq(soaStatements.totalDue, "—"),
          ),
        ),
      ),
    )
    .returning({ id: soaStatements.id });
  if (deleted.length > 0) invalidateSoaStatementRows();
}

async function extractPdfText(
  localPath: string,
  cards: CardCredential[],
): Promise<{
  text: string;
  rawText: string;
  password: string;
  unlockLast4: string;
  usedOcr: boolean;
  ocrAttempted: boolean;
}> {
  const withEmpty: CardCredential[] = [
    { issuer: "unknown", last4: "0000", password: "" },
    ...cards,
  ];
  const unlocked = await tryUnlockAndExtractText(localPath, withEmpty);
  const layerText = collapseLetterSpacedText(unlocked.text);
  let parseText = layerText;
  const textQuality = assessSoaTextQuality(parseText);
  const issuerGuess = detectIssuerFromSoaText(parseText) ?? "bpi";
  const shouldTryOcr =
    !ocrDisabledForIssuer(issuerGuess) &&
    (!textQuality.looksUsable || ocrForcedForIssuer(issuerGuess));

  let usedOcr = false;
  if (shouldTryOcr) {
    const { maxPages, scale, psmRaw, dualSparse } =
      ocrTuningForIssuer(issuerGuess);
    try {
      const ocrText = await ocrPdfToPlainText(localPath, unlocked.password, {
        maxPages,
        scale,
        psm: parseSoaOcrPsmEnv(psmRaw),
        dualSparse,
      });
      const picked = pickBetterSoaText(parseText, ocrText);
      if (picked.usedCandidate) {
        parseText = picked.text;
        usedOcr = true;
      }
    } catch {
      /* keep extracted text */
    }
  }

  return {
    text: parseText,
    rawText: layerText,
    password: unlocked.password,
    unlockLast4: unlocked.last4,
    usedOcr,
    ocrAttempted: shouldTryOcr,
  };
}

async function maybeRcbcGeometry(
  localPath: string,
  password: string,
  issuerId: string,
  parseText: string,
): Promise<string> {
  if (issuerId !== "rcbc") return parseText;
  try {
    const [linesYDesc, linesYAsc] = await extractPdfLinesReadingOrderDualAxis(
      localPath,
      password,
    );
    let txnSource = parseText;
    let bestTxns = extractTransactions("rcbc", parseText);
    for (const lines of [linesYDesc, linesYAsc]) {
      const candidate = lines.join("\n");
      const tx = extractTransactions("rcbc", candidate);
      if (rcbcGeomImproves(bestTxns, tx)) {
        bestTxns = tx;
        txnSource = candidate;
      }
    }
    return txnSource;
  } catch {
    return parseText;
  }
}

async function firstPdfPagePng(
  localPath: string,
  password: string,
): Promise<Buffer | null> {
  try {
    for await (const page of rasterizePdfPages(localPath, password, 1.5, 1)) {
      return page;
    }
  } catch {
    return null;
  }
  return null;
}

export const soaManualUploadService = {
  async process(
    userId: string,
    input: ManualUploadProcessInput,
  ): Promise<ManualUploadProcessResult> {
    const fileName = input.originalFileName || "upload";

    if (!privateStoragePathBelongsToUser(input.storagePath, userId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Invalid file path",
      });
    }

    const period = await loadPeriod(userId, input.periodId);
    const periodFrom: CalendarMonth = {
      month: period.fromMonth,
      year: period.fromYear,
    };
    const periodTo: CalendarMonth = {
      month: period.toMonth,
      year: period.toYear,
    };
    const periodMonths = enumerateCalendarMonths(periodFrom, periodTo);
    const periodLabel = `${formatSoaPeriodLabel(period.fromMonth, period.fromYear)}${
      period.fromMonth !== period.toMonth || period.fromYear !== period.toYear
        ? ` – ${formatSoaPeriodLabel(period.toMonth, period.toYear)}`
        : ""
    }`;

    let cards = await creditCardService.listForSoaPipeline(userId);
    let credentials = credentialsFromPipeline(cards);
    const knownForAi = cards.map((c) => ({
      issuer: c.issuer,
      last4: c.last4,
      label: c.label,
    }));
    const periodSlots = await loadPeriodIssuerSlots(userId, periodMonths);

    const messageId = `manual:${randomUUID()}`;
    let usedAi = false;
    let row: SoaRow | null = null;
    let persistStoragePath = input.storagePath;
    let unlockPassword = "";
    let cardCreated = false;
    let printedLast4 = "";

    try {
      const localPath = await storageService.resolveLocalPath(
        input.storagePath,
      );
      const bytes = await readFile(localPath);
      const mime =
        resolveAllowedUploadMime(bytes, fileName, input.mimeType) ?? "";
      const isImage = isImageMime(mime);
      const isPdf = isPdfMime(mime);

      if (isImage && !isPdf) {
        const ai = await soaAiExtractService.extractFromImage(
          userId,
          bytes,
          mime,
          knownForAi,
        );
        if (!ai) {
          return {
            status: "error",
            fileName,
            message:
              "Could not read this image. Add AI keys in Settings or upload a PDF.",
          };
        }
        usedAi = true;
        const identity = resolveManualUploadIdentity({
          text: `${ai.issuerId ?? ""} ${ai.cardLast4 ?? ""} ${ai.statementDate ?? ""}`,
          cards: credentials,
          unlockLast4: "",
          ai,
          periodSlots,
        });
        if (!identity.issuerId || !identity.last4) {
          return {
            status: "error",
            fileName,
            message: CARD_UNKNOWN_MESSAGE,
          };
        }
        printedLast4 = identity.detectedLast4;
        row = rowFromAi(
          ai,
          fileName,
          messageId,
          identity.issuerId,
          identity.last4,
        );
      } else if (isPdf) {
        const extracted = await extractPdfText(localPath, credentials);
        unlockPassword = extracted.password;
        const identityText = pickIdentityText(
          extracted.text,
          extracted.rawText,
        );
        let ai: SoaAiExtractResult | null = null;
        if (!assessSoaTextQuality(extracted.text).looksUsable) {
          ai = await soaAiExtractService.extractFromText(
            userId,
            extracted.text,
            knownForAi,
          );
          if (ai) usedAi = true;
        }

        let identity = resolveManualUploadIdentity({
          text: identityText,
          cards: credentials,
          unlockLast4: extracted.unlockLast4,
          ai,
          periodSlots,
        });

        if (!identity.issuerId || !identity.last4) {
          if (!ai) {
            ai = await soaAiExtractService.extractFromText(
              userId,
              extracted.text,
              knownForAi,
            );
            if (ai) usedAi = true;
          }
          identity = resolveManualUploadIdentity({
            text: identityText,
            cards: credentials,
            unlockLast4: extracted.unlockLast4,
            ai,
            periodSlots,
          });
        }

        if (!identity.issuerId || !identity.last4) {
          const page = await firstPdfPagePng(localPath, extracted.password);
          if (page) {
            const vision = await soaAiExtractService.extractFromImage(
              userId,
              page,
              "image/png",
              knownForAi,
            );
            if (vision) {
              usedAi = true;
              ai = vision;
              identity = resolveManualUploadIdentity({
                text: identityText,
                cards: credentials,
                unlockLast4: extracted.unlockLast4,
                ai,
                periodSlots,
              });
            }
          }
        }

        if (!identity.issuerId || !identity.last4) {
          return {
            status: "error",
            fileName,
            message: CARD_UNKNOWN_MESSAGE,
          };
        }
        printedLast4 = identity.detectedLast4;

        const txnText = await maybeRcbcGeometry(
          localPath,
          extracted.password,
          identity.issuerId,
          extracted.text,
        );
        row = parseSoaText(
          bankLabelForIssuer(identity.issuerId),
          identity.issuerId,
          identity.last4,
          "Manual upload",
          messageId,
          fileName,
          extracted.text,
          { usedOcr: extracted.usedOcr, ocrAttempted: extracted.ocrAttempted },
        );
        row.transactions = extractTransactions(identity.issuerId, txnText);
        if (extracted.usedOcr) {
          const rawTxns = extractTransactions(
            identity.issuerId,
            extracted.rawText,
          );
          if (rawTxns.length > row.transactions.length) {
            row.transactions = rawTxns;
          }
        }
        row = mergeAiIntoSoaRow(row, ai);

        if (soaRowNeedsAiFill(row) && !ai) {
          const fill = await soaAiExtractService.extractFromText(
            userId,
            extracted.text,
            knownForAi,
          );
          if (fill) {
            usedAi = true;
            row = mergeAiIntoSoaRow(row, fill);
            const filledIdentity = resolveManualUploadIdentity({
              text: identityText,
              cards: credentials,
              unlockLast4: extracted.unlockLast4,
              ai: fill,
              periodSlots,
            });
            if (filledIdentity.issuerId && filledIdentity.last4) {
              row.issuerId = filledIdentity.issuerId;
              row.bankLabel = bankLabelForIssuer(filledIdentity.issuerId);
              row.cardLast4 = filledIdentity.last4;
            }
          }
        }

        try {
          const unlocked = await decryptPdfFile(localPath, extracted.password);
          persistStoragePath = await storageService.uploadPrivate(
            userId,
            `unlocked-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
            unlocked,
            "application/pdf",
            "soa",
          );
        } catch {
          persistStoragePath = input.storagePath;
        }
      } else {
        return {
          status: "error",
          fileName,
          message: "Upload a PDF or image of the statement.",
        };
      }
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      const message =
        error instanceof Error ? error.message : "Could not read the file.";
      if (/password/i.test(message)) {
        return {
          status: "error",
          fileName,
          message: "Could not open this PDF. Check the card PDF password.",
        };
      }
      return { status: "error", fileName, message: "Could not read the file." };
    }

    if (!row) {
      return {
        status: "error",
        fileName,
        message: "Could not parse this file.",
      };
    }

    const ensured = await ensureDetectedCard(
      userId,
      row.issuerId,
      row.cardLast4,
      row,
      unlockPassword,
    );
    cardCreated = ensured.created || ensured.restored;

    cards = await creditCardService.listForSoaPipeline(userId);
    credentials = credentialsFromPipeline(cards);

    row = finalizeRow(row, credentials);

    row.sourceEmailSubject = "Manual upload";
    row.sourceMessageId = messageId;
    row.pdfFileName = fileName;
    row.pdfStoragePath = persistStoragePath;

    const detectedMonth = calendarMonthFromSoaDates(
      row.statementDate,
      row.dueDate,
    );
    const force = isValidCalendarMonth({
      month: input.forceMonth ?? 0,
      year: input.forceYear ?? 0,
    })
      ? { month: input.forceMonth!, year: input.forceYear! }
      : null;
    const aligned = alignManualUploadMonth({
      detected: detectedMonth,
      periodFrom,
      periodTo,
      force,
      allowOutOfRange: input.allowOutOfRange,
    });

    const preview = previewFromRow(row, detectedMonth, usedAi);

    if (aligned.kind === "needs_confirmation") {
      return {
        status: "needs_confirmation",
        fileName,
        reason: aligned.reason,
        detected: aligned.detected,
        periodMonths,
        periodLabel,
        preview,
      };
    }

    const persistMonth = aligned.month;
    const persisted = await soaPersistService.persistRows(
      userId,
      [row],
      persistMonth,
    );
    if (persisted.saved === 0 && persisted.updated === 0) {
      return {
        status: "error",
        fileName,
        message: "Could not save this statement.",
      };
    }

    if (printedLast4 && printedLast4 !== row.cardLast4) {
      await dropRemappedDuplicateStatement(
        userId,
        row.issuerId,
        printedLast4,
        row.cardLast4,
        persistMonth,
      );
    }

    await dueEntryUpsertService.upsertFromSoaRows(userId, [row]);

    return {
      status: persisted.updated > 0 ? "updated" : "saved",
      fileName,
      assignedMonth: persistMonth,
      outOfRange: aligned.outOfRange,
      cardCreated,
      preview: previewFromRow(row, persistMonth, usedAi),
    };
  },
};
