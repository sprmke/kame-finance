import fs from "node:fs";
import path from "node:path";

import { BANK_ISSUER_LABELS, BANK_ISSUERS } from "@/lib/db/schema/credit-cards";

import type {
  BankDefinition,
  CardCredential,
  GmailMonthContext,
} from "./types";

function resolveDataDir(): string {
  const raw = process.env.DATA_DIR;
  if (!raw) {
    throw new Error(
      "DATA_DIR is not set. Call prepareSoaWorkdir before running SOA.",
    );
  }
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

export function ensureDirs() {
  const dataDir = resolveDataDir();
  const downloads = path.join(dataDir, "downloads");
  const output = path.join(dataDir, "output");
  fs.mkdirSync(downloads, { recursive: true });
  fs.mkdirSync(output, { recursive: true });
  return { downloads, output, dataDir };
}

export function loadCardCredentials(): CardCredential[] {
  const raw = process.env.CARDS_JSON;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => {
        const c = x as CardCredential;
        if (
          !c ||
          typeof c.issuer !== "string" ||
          typeof c.last4 !== "string" ||
          typeof c.password !== "string"
        ) {
          return null;
        }
        const card: CardCredential = {
          issuer: c.issuer,
          last4: c.last4,
          password: c.password,
        };
        if (
          typeof c.gmailMonthOffset === "number" &&
          Number.isFinite(c.gmailMonthOffset)
        ) {
          card.gmailMonthOffset = Math.trunc(c.gmailMonthOffset);
        }
        if (typeof c.label === "string" && c.label.trim()) {
          card.label = c.label.trim();
        }
        if (typeof c.fullPan === "string" && c.fullPan.trim()) {
          card.fullPan = c.fullPan.trim();
        }
        if (typeof c.contactLine === "string" && c.contactLine.trim()) {
          card.contactLine = c.contactLine.trim();
        }
        if (
          typeof c.reminderWindowDays === "number" &&
          Number.isFinite(c.reminderWindowDays)
        ) {
          card.reminderWindowDays = Math.trunc(c.reminderWindowDays);
        }
        if (
          typeof c.reminderIntervalMinutes === "number" &&
          Number.isFinite(c.reminderIntervalMinutes)
        ) {
          card.reminderIntervalMinutes = Math.trunc(c.reminderIntervalMinutes);
        }
        if (typeof c.soaSubject === "string" && c.soaSubject.trim()) {
          card.soaSubject = c.soaSubject.trim();
        }
        return card;
      })
      .filter((c): c is CardCredential => c !== null);
  } catch {
    return [];
  }
}

function genericSoaQuery(label: string, ctx: GmailMonthContext): string {
  const escaped = label.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return [
    `subject:("${escaped}" (statement OR eStatement OR "e-Statement" OR SOA OR "Statement of Account"))`,
    `("${ctx.monthShort} ${ctx.year}" OR "${ctx.monthLong} ${ctx.year}")`,
  ].join(" ");
}

const SPECIFIC_QUERIES: Record<string, (ctx: GmailMonthContext) => string> = {
  maya: (ctx) =>
    [
      'subject:("Maya Black Credit Card" OR "Maya Credit Card")',
      '(billing OR statement OR "Statement of Account")',
      `("${ctx.monthShort} ${ctx.year}" OR "${ctx.monthLong} ${ctx.year}")`,
    ].join(" "),
  metrobank: (ctx) =>
    [
      'subject:"Metrobank Credit Card MSOA Statement of Account"',
      `(${ctx.monthNum2} OR "${ctx.monthLong}" OR "${ctx.monthShort}")`,
      `"${ctx.year}"`,
    ].join(" "),
  rcbc: (ctx) =>
    [
      'subject:"FLEX VISA eStatement"',
      `("${ctx.monthShort} ${ctx.year}" OR "${ctx.monthLong} ${ctx.year}")`,
    ].join(" "),
  bpi: (ctx) =>
    [
      'subject:("BPI Credit Card Electronic Statement" OR "Electronic Statement of Account")',
      `("${ctx.monthShort} ${ctx.year}" OR "${ctx.monthLong} ${ctx.year}")`,
    ].join(" "),
  unionbank: (ctx) =>
    [
      'subject:("REWARDS VISA PLATINUM" OR "REWARDS VISA")',
      "2600",
      `("${ctx.monthLong} ${ctx.year}" OR "${ctx.monthShort} ${ctx.year}")`,
    ].join(" "),
};

export const banks: BankDefinition[] = BANK_ISSUERS.map((id) => ({
  id,
  label: BANK_ISSUER_LABELS[id],
  buildQuery:
    SPECIFIC_QUERIES[id] ??
    ((ctx) => genericSoaQuery(BANK_ISSUER_LABELS[id], ctx)),
}));

export function buildGmailQuery(
  bank: BankDefinition,
  ctx: GmailMonthContext,
): string {
  const core = bank.buildQuery(ctx);
  return `(${core}) after:${ctx.afterYMD} before:${ctx.beforeYMD}`;
}

export function buildGmailQueryWithSubject(
  bank: BankDefinition,
  ctx: GmailMonthContext,
  subject: string,
): string {
  const escaped = subject.trim().replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  let monthPart: string;
  switch (bank.id) {
    case "metrobank":
      monthPart = `(${ctx.monthNum2} OR "${ctx.monthLong}" OR "${ctx.monthShort}") "${ctx.year}"`;
      break;
    case "unionbank":
      monthPart = `"${ctx.monthLong} ${ctx.year}" OR "${ctx.monthShort} ${ctx.year}"`;
      break;
    default:
      monthPart = `"${ctx.monthShort} ${ctx.year}" OR "${ctx.monthLong} ${ctx.year}"`;
  }
  const core = [`subject:"${escaped}"`, monthPart].join(" ");
  return `(${core}) after:${ctx.afterYMD} before:${ctx.beforeYMD}`;
}

/** Telegram web link for calendar/reminder copy (from integration env bridge). */
export function telegramWebLinkFromEnv(): string {
  return (process.env.TELEGRAM_WEB_LINK ?? "").trim();
}
