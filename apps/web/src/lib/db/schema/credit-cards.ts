import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  check,
  index,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";

import { accounts, users } from "./users";

/**
 * Philippine credit-card issuers. List and grouping match Kame Homes
 * `PH_PAYMENT_PROVIDERS` banks + digital banks (e-wallets omitted — they are
 * not card issuers). IDs stay kebab-case so existing `bpi` / `metrobank` /
 * `rcbc` / `unionbank` rows keep working.
 */
export type BankIssuerGroup = "digital_bank" | "bank";

export const BANK_ISSUER_GROUP_ORDER: readonly BankIssuerGroup[] = [
  "digital_bank",
  "bank",
];

export const BANK_ISSUER_GROUP_LABELS: Record<BankIssuerGroup, string> = {
  digital_bank: "Digital banks",
  bank: "Traditional banks",
};

export const PH_BANK_ISSUERS = [
  { id: "maribank", label: "MariBank", group: "digital_bank" },
  { id: "gotyme-bank", label: "GoTyme Bank", group: "digital_bank" },
  {
    id: "uniondigital-bank",
    label: "UnionDigital Bank",
    group: "digital_bank",
  },
  { id: "tonik-bank", label: "Tonik Bank", group: "digital_bank" },
  { id: "uno-digital-bank", label: "UNO Digital Bank", group: "digital_bank" },
  {
    id: "cimb-bank-philippines",
    label: "CIMB Bank Philippines",
    group: "digital_bank",
  },
  { id: "bdo", label: "BDO", group: "bank" },
  { id: "bpi", label: "BPI", group: "bank" },
  { id: "metrobank", label: "Metrobank", group: "bank" },
  { id: "unionbank", label: "Unionbank", group: "bank" },
  { id: "land-bank", label: "Land Bank of the Philippines", group: "bank" },
  { id: "security-bank", label: "Security Bank", group: "bank" },
  { id: "rcbc", label: "RCBC", group: "bank" },
  { id: "chinabank", label: "Chinabank", group: "bank" },
  { id: "pnb", label: "PNB", group: "bank" },
  { id: "eastwest-bank", label: "EastWest Bank", group: "bank" },
  { id: "psbank", label: "PSBank", group: "bank" },
  { id: "robinsons-bank", label: "Robinsons Bank", group: "bank" },
  { id: "asia-united-bank", label: "Asia United Bank", group: "bank" },
  { id: "bank-of-commerce", label: "Bank of Commerce", group: "bank" },
] as const;

export type BankIssuer = (typeof PH_BANK_ISSUERS)[number]["id"];

export const BANK_ISSUERS = PH_BANK_ISSUERS.map((entry) => entry.id) as [
  BankIssuer,
  ...BankIssuer[],
];

const BANK_ISSUER_SET = new Set<string>(BANK_ISSUERS);

export const BANK_ISSUER_LABELS: Record<BankIssuer, string> =
  Object.fromEntries(
    PH_BANK_ISSUERS.map((entry) => [entry.id, entry.label]),
  ) as Record<BankIssuer, string>;

const BANK_ISSUER_ALIASES: Record<string, BankIssuer> = {
  "bdo unibank": "bdo",
  bdo: "bdo",
  "bank of the philippine islands": "bpi",
  "union bank": "unionbank",
  unionbank: "unionbank",
  "land bank": "land-bank",
  landbank: "land-bank",
  "land bank of the philippines": "land-bank",
  securitybank: "security-bank",
  "east west bank": "eastwest-bank",
  eastwest: "eastwest-bank",
  "eastwest bank": "eastwest-bank",
  "china bank": "chinabank",
  "china banking": "chinabank",
  "philippine national bank": "pnb",
  "ps bank": "psbank",
  "robinson bank": "robinsons-bank",
  "robinsons bank": "robinsons-bank",
  "asia united": "asia-united-bank",
  aub: "asia-united-bank",
  "bank of commerce": "bank-of-commerce",
  bocom: "bank-of-commerce",
  gotyme: "gotyme-bank",
  "gotyme bank": "gotyme-bank",
  uniondigital: "uniondigital-bank",
  "union digital": "uniondigital-bank",
  "union digital bank": "uniondigital-bank",
  tonik: "tonik-bank",
  "tonik bank": "tonik-bank",
  uno: "uno-digital-bank",
  "uno digital": "uno-digital-bank",
  "uno digital bank": "uno-digital-bank",
  cimb: "cimb-bank-philippines",
  "cimb bank": "cimb-bank-philippines",
  "cimb bank philippines": "cimb-bank-philippines",
  mari: "maribank",
  maribank: "maribank",
};

export function isBankIssuer(value: string): value is BankIssuer {
  return BANK_ISSUER_SET.has(value);
}

export function issuersByGroup(
  group: BankIssuerGroup,
): (typeof PH_BANK_ISSUERS)[number][] {
  return PH_BANK_ISSUERS.filter((entry) => entry.group === group);
}

export function bankIssuerGroup(issuer: string): BankIssuerGroup | null {
  const id = parseBankIssuerId(issuer);
  if (!id) return null;
  return PH_BANK_ISSUERS.find((entry) => entry.id === id)?.group ?? null;
}

/** Minutes between reminder pings while inside the due window. */
export const REMINDER_INTERVALS = [
  { value: 60, label: "Hourly" },
  { value: 120, label: "Every 2 hours" },
  { value: 240, label: "Every 4 hours" },
  { value: 720, label: "Every 12 hours" },
  { value: 1440, label: "Once per day" },
] as const;

export type ReminderIntervalMinutes =
  (typeof REMINDER_INTERVALS)[number]["value"];

export const DEFAULT_REMINDER_INTERVAL_MINUTES: ReminderIntervalMinutes = 1440;

export function normalizeReminderIntervalMinutes(
  value: number | null | undefined,
): ReminderIntervalMinutes {
  const minutes = Number(value);
  if (!Number.isFinite(minutes)) return DEFAULT_REMINDER_INTERVAL_MINUTES;
  return (
    REMINDER_INTERVALS.find((i) => i.value === minutes)?.value ??
    DEFAULT_REMINDER_INTERVAL_MINUTES
  );
}

export function formatBankIssuer(issuer: string): string {
  const id = parseBankIssuerId(issuer);
  if (id) return BANK_ISSUER_LABELS[id];
  return issuer;
}

export function parseBankIssuerId(
  raw: string | null | undefined,
): BankIssuer | null {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;
  if (isBankIssuer(trimmed)) return trimmed;

  const lower = trimmed.toLowerCase();
  if (isBankIssuer(lower)) return lower;

  const collapsed = lower.replace(/\s+/g, " ");
  if (collapsed in BANK_ISSUER_ALIASES) {
    return BANK_ISSUER_ALIASES[collapsed]!;
  }

  const slug = collapsed.replace(/\s+/g, "-");
  if (isBankIssuer(slug)) return slug;
  if (slug in BANK_ISSUER_ALIASES) {
    return BANK_ISSUER_ALIASES[slug]!;
  }

  const byLabel = PH_BANK_ISSUERS.find(
    (entry) => entry.label.toLowerCase() === collapsed,
  );
  return byLabel?.id ?? null;
}

export function normalizeBankIssuer(issuer: string): BankIssuer {
  return parseBankIssuerId(issuer) ?? "bpi";
}

/** Default Gmail SOA subject line per bank (form default + SOA search). */
const SOA_SUBJECT_OVERRIDES: Partial<Record<BankIssuer, string>> = {
  metrobank: "Metrobank Credit Card MSOA Statement of Account",
  rcbc: "FLEX VISA eStatement",
  bpi: "BPI Credit Card Electronic Statement of Account",
  unionbank: "REWARDS VISA PLATINUM Credit Card e-Statement",
};

export const DEFAULT_SOA_SUBJECTS: Record<BankIssuer, string> =
  Object.fromEntries(
    BANK_ISSUERS.map((id) => [
      id,
      SOA_SUBJECT_OVERRIDES[id] ??
        `${BANK_ISSUER_LABELS[id]} Credit Card Statement of Account`,
    ]),
  ) as Record<BankIssuer, string>;

export function defaultSoaSubject(issuer: BankIssuer): string {
  return DEFAULT_SOA_SUBJECTS[issuer];
}

export function normalizeSoaSubject(
  value: string | null | undefined,
  issuer: BankIssuer,
): string {
  const trimmed = value?.trim();
  return trimmed || DEFAULT_SOA_SUBJECTS[issuer];
}

/** Null/blank or bank default → use legacy bank.buildQuery (matches CLI). Custom only when user overrides. */
export function effectiveSoaSubject(
  value: string | null | undefined,
  issuer: BankIssuer,
): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed === DEFAULT_SOA_SUBJECTS[issuer]) return undefined;
  return trimmed;
}

export function soaSubjectForStorage(
  value: string | null | undefined,
  issuer: BankIssuer,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === DEFAULT_SOA_SUBJECTS[issuer]) return null;
  return trimmed;
}

/** Default accent colors for new cards (hex). */
export const DEFAULT_CARD_COLORS: Record<BankIssuer, string> = {
  maribank: "#EE4D2D",
  "gotyme-bank": "#00C853",
  "uniondigital-bank": "#F7931E",
  "tonik-bank": "#FF3B7A",
  "uno-digital-bank": "#5B2CFF",
  "cimb-bank-philippines": "#ED1C24",
  bdo: "#0033A0",
  bpi: "#B11116",
  metrobank: "#00156D",
  unionbank: "#F7931E",
  "land-bank": "#006B3F",
  "security-bank": "#E31837",
  rcbc: "#3884D9",
  chinabank: "#003DA5",
  pnb: "#002B5C",
  "eastwest-bank": "#FF6600",
  psbank: "#00A651",
  "robinsons-bank": "#0066B3",
  "asia-united-bank": "#E31C23",
  "bank-of-commerce": "#1B4F72",
};

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

export function isValidCardColor(
  value: string | null | undefined,
): value is string {
  return !!value && HEX_COLOR_RE.test(value);
}

export function normalizeCardColor(
  value: string | null | undefined,
  issuer?: BankIssuer,
): string | null {
  if (isValidCardColor(value)) return value.toUpperCase();
  if (issuer) return DEFAULT_CARD_COLORS[issuer];
  return null;
}

export const creditCards = pgTable(
  "credit_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    issuer: varchar("issuer", { length: 32 }).notNull(),
    last4: varchar("last4", { length: 4 }).notNull(),
    label: varchar("label", { length: 255 }),
    fullPan: varchar("full_pan", { length: 64 }),
    contactLine: text("contact_line"),
    pdfPasswordEncrypted: text("pdf_password_encrypted").notNull(),
    gmailMonthOffset: integer("gmail_month_offset").default(0),
    /** Gmail subject line hint for SOA search (null = bank default query). */
    soaSubject: text("soa_subject"),
    /** Normal monthly due day. Used as a fallback when no SOA is received. */
    dueDay: integer("due_day"),
    /** Hex accent color (#RRGGBB) for SOA and card UI. */
    color: varchar("color", { length: 7 }),
    /** Days before due date to start reminders (null = use global default). */
    reminderWindowDays: integer("reminder_window_days"),
    /** Minutes between pings while in window (default once per day). */
    reminderIntervalMinutes: integer("reminder_interval_minutes")
      .notNull()
      .default(1440),
    /** Linked Google OAuth account for Gmail SOA fetch (null = default account). */
    googleAccountId: uuid("google_account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    check("credit_cards_due_day_check", sql`${table.dueDay} between 1 and 31`),
    index("credit_cards_user_idx").on(table.userId),
    index("credit_cards_issuer_last4_idx").on(table.issuer, table.last4),
    index("credit_cards_google_account_idx").on(table.googleAccountId),
  ],
);

export const soaStatements = pgTable(
  "soa_statements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    creditCardId: uuid("credit_card_id").references(() => creditCards.id, {
      onDelete: "set null",
    }),
    statementMonth: integer("statement_month").notNull(),
    statementYear: integer("statement_year").notNull(),
    bankLabel: varchar("bank_label", { length: 64 }).notNull(),
    issuerId: varchar("issuer_id", { length: 32 }).notNull(),
    cardLast4: varchar("card_last4", { length: 4 }).notNull(),
    sourceEmailSubject: text("source_email_subject"),
    sourceMessageId: varchar("source_message_id", { length: 128 }),
    pdfFileName: varchar("pdf_file_name", { length: 512 }),
    pdfStoragePath: text("pdf_storage_path"),
    summaryPdfPath: text("summary_pdf_path"),
    minimumDue: varchar("minimum_due", { length: 64 }),
    totalDue: varchar("total_due", { length: 64 }),
    statementDate: varchar("statement_date", { length: 64 }),
    dueDate: varchar("due_date", { length: 64 }),
    dueDateYmd: varchar("due_date_ymd", { length: 10 }),
    parseNotes: text("parse_notes"),
    soaUnavailable: boolean("soa_unavailable").default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("soa_statements_user_idx").on(table.userId),
    index("soa_statements_period_idx").on(
      table.statementYear,
      table.statementMonth,
    ),
  ],
);

export const soaPeriods = pgTable(
  "soa_periods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mode: varchar("mode", { length: 16 }).notNull().default("single"),
    fromMonth: integer("from_month").notNull(),
    fromYear: integer("from_year").notNull(),
    toMonth: integer("to_month").notNull(),
    toYear: integer("to_year").notNull(),
    notifyTelegram: boolean("notify_telegram").notNull().default(true),
    notifySlack: boolean("notify_slack").notNull().default(true),
    createCalendar: boolean("create_calendar").notNull().default(false),
    summaryPdfStoragePath: text("summary_pdf_storage_path"),
    lastRunAt: timestamp("last_run_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("soa_periods_user_idx").on(table.userId),
    uniqueIndex("soa_periods_range_uidx").on(
      table.userId,
      table.fromMonth,
      table.fromYear,
      table.toMonth,
      table.toYear,
    ),
  ],
);

export const soaTransactions = pgTable(
  "soa_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    soaStatementId: uuid("soa_statement_id")
      .notNull()
      .references(() => soaStatements.id, { onDelete: "cascade" }),
    date: varchar("date", { length: 32 }),
    description: text("description").notNull(),
    amount: varchar("amount", { length: 32 }).notNull(),
    categorySlug: varchar("category_slug", { length: 32 }),
    categorySource: varchar("category_source", { length: 16 }),
  },
  (table) => [index("soa_transactions_statement_idx").on(table.soaStatementId)],
);

export const dueEntries = pgTable(
  "due_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    creditCardId: uuid("credit_card_id").references(() => creditCards.id, {
      onDelete: "set null",
    }),
    issuerId: varchar("issuer_id", { length: 32 }).notNull(),
    cardLast4: varchar("card_last4", { length: 4 }).notNull(),
    bankLabel: varchar("bank_label", { length: 64 }).notNull(),
    cardDisplayLabel: varchar("card_display_label", { length: 255 }),
    fullPan: varchar("full_pan", { length: 64 }),
    dueDate: varchar("due_date", { length: 64 }).notNull(),
    dueDateYmd: varchar("due_date_ymd", { length: 10 }).notNull(),
    minimumDue: varchar("minimum_due", { length: 64 }).notNull(),
    totalDue: varchar("total_due", { length: 64 }).notNull(),
    interestCharges: varchar("interest_charges", { length: 64 }),
    contactLine: text("contact_line"),
    /** `expected` means this row was generated because no SOA was received. */
    source: varchar("source", { length: 16 }).notNull().default("soa"),
    paidAt: timestamp("paid_at"),
    paidAmount: varchar("paid_amount", { length: 64 }),
    receiptId: uuid("receipt_id"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    check(
      "due_entries_source_check",
      sql`${table.source} in ('soa', 'expected')`,
    ),
    index("due_entries_user_idx").on(table.userId),
    index("due_entries_due_ymd_idx").on(table.dueDateYmd),
    index("due_entries_card_idx").on(table.issuerId, table.cardLast4),
    uniqueIndex("due_entries_user_card_due_uidx").on(
      table.userId,
      table.creditCardId,
      table.dueDateYmd,
    ),
  ],
);

export const creditCardsRelations = relations(creditCards, ({ one, many }) => ({
  user: one(users, { fields: [creditCards.userId], references: [users.id] }),
  googleAccount: one(accounts, {
    fields: [creditCards.googleAccountId],
    references: [accounts.id],
  }),
  statements: many(soaStatements),
  dueEntries: many(dueEntries),
}));

export const soaPeriodsRelations = relations(soaPeriods, ({ one }) => ({
  user: one(users, { fields: [soaPeriods.userId], references: [users.id] }),
}));

export const soaStatementsRelations = relations(
  soaStatements,
  ({ one, many }) => ({
    user: one(users, {
      fields: [soaStatements.userId],
      references: [users.id],
    }),
    creditCard: one(creditCards, {
      fields: [soaStatements.creditCardId],
      references: [creditCards.id],
    }),
    transactions: many(soaTransactions),
  }),
);

export const soaTransactionsRelations = relations(
  soaTransactions,
  ({ one }) => ({
    statement: one(soaStatements, {
      fields: [soaTransactions.soaStatementId],
      references: [soaStatements.id],
    }),
  }),
);

export const dueEntriesRelations = relations(dueEntries, ({ one }) => ({
  user: one(users, { fields: [dueEntries.userId], references: [users.id] }),
  creditCard: one(creditCards, {
    fields: [dueEntries.creditCardId],
    references: [creditCards.id],
  }),
}));
