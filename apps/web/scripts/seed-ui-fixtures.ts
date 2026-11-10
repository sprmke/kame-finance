#!/usr/bin/env bun
/**
 * Synthetic UI fixtures for visual QA — LOCAL DOCKER POSTGRES ONLY.
 *
 *   bun --env-file=.env.local run scripts/seed-ui-fixtures.ts
 *
 * Ignores DATABASE_URL on purpose and connects to LOCAL_FIXTURE_DATABASE_URL
 * (default: the docker-compose Postgres on :5434). Refuses any non-localhost
 * host. Seeds the `dev@localhost` user (the "Continue locally" login) with
 * five cards, three statement months, transactions, and due entries.
 * All names, numbers, and amounts are made up.
 */
import postgres from "postgres";

import { encryptSecret } from "../src/lib/utils/encryption";

const url =
  process.env.LOCAL_FIXTURE_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5434/kame_finance";

const host = new URL(url.replace(/^postgres(ql)?:/, "http:")).hostname;
if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
  console.error(`Refusing to seed fixtures into non-local host: ${host}`);
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

type CardSeed = {
  issuer: string;
  bankLabel: string;
  last4: string;
  label: string;
  color: string;
  network: string;
  statementDay: number;
  dueDay: number;
};

const CARDS: CardSeed[] = [
  { issuer: "bpi", bankLabel: "BPI", last4: "4412", label: "BPI Gold", color: "#B11116", network: "mastercard", statementDay: 3, dueDay: 22 },
  { issuer: "unionbank", bankLabel: "Unionbank", last4: "5567", label: "UB Rewards", color: "#F7931E", network: "visa", statementDay: 1, dueDay: 11 },
  { issuer: "bdo", bankLabel: "BDO", last4: "7731", label: "BDO Shopmore", color: "#0033A0", network: "visa", statementDay: 2, dueDay: 20 },
  { issuer: "metrobank", bankLabel: "Metrobank", last4: "8890", label: "Metrobank Titanium", color: "#00156D", network: "mastercard", statementDay: 5, dueDay: 25 },
  { issuer: "rcbc", bankLabel: "RCBC", last4: "2203", label: "RCBC Flex", color: "#3A5DAE", network: "jcb", statementDay: 20, dueDay: 10 },
];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SPEND: Array<[string, string, number]> = [
  ["SM SUPERMARKET MEGAMALL", "groceries", 4820.35],
  ["GRAB* RIDE MAKATI", "transport", 286],
  ["JOLLIBEE BGC", "dining", 512.5],
  ["LAZADA PH", "online_shopping", 2399],
  ["MERALCO ONLINE", "bills_payment", 6120.8],
  ["NETFLIX.COM", "subscriptions", 549],
  ["SPOTIFY P0C2", "subscriptions", 279],
  ["MERCURY DRUG ORTIGAS", "health", 1388.25],
  ["SHOPEE PH", "online_shopping", 1675],
  ["CEBU PACIFIC AIR", "travel", 8640],
  ["STARBUCKS UPTOWN", "dining", 395],
  ["UNIQLO GREENBELT", "store_shopping", 2990],
  ["PLDT HOME FIBR", "bills_payment", 1899],
  ["SHELL EDSA", "transport", 2500],
  ["FINANCE CHARGE", "interest_fees", 312.4],
];

function fmt(value: number): string {
  return value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ymd(year: number, month: number, day: number): string {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const d = Math.min(day, last);
  return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function label(ymdValue: string): string {
  const [y, m, d] = ymdValue.split("-").map(Number);
  return `${MONTH_NAMES[m! - 1]} ${d}, ${y}`;
}

function dueFor(card: CardSeed, year: number, month: number): string {
  if (card.dueDay > card.statementDay) return ymd(year, month, card.dueDay);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return ymd(nextYear, nextMonth, card.dueDay);
}

async function main() {
  const [user] = await sql<{ id: string }[]>`
    insert into users (email, name, email_verified)
    values ('dev@localhost', 'Local dev', now())
    on conflict (email) do update set name = excluded.name
    returning id`;
  const userId = user!.id;

  // Reset this user's fixture rows only.
  await sql`delete from receipts where user_id = ${userId}`.catch(() => undefined);
  await sql`delete from due_entries where user_id = ${userId}`;
  await sql`delete from soa_transactions where soa_statement_id in (select id from soa_statements where user_id = ${userId})`;
  await sql`delete from soa_statements where user_id = ${userId}`;
  await sql`delete from soa_periods where user_id = ${userId}`;
  await sql`delete from credit_cards where user_id = ${userId}`;

  const cardIds = new Map<string, string>();
  for (const card of CARDS) {
    const [row] = await sql<{ id: string }[]>`
      insert into credit_cards (user_id, issuer, last4, label, full_pan, pdf_password_encrypted,
        statement_day, due_day, color, card_network, is_active, soa_subject)
      values (${userId}, ${card.issuer}, ${card.last4}, ${card.label},
        ${`5${card.last4}000011${card.last4}`.slice(0, 16)}, ${encryptSecret("fixture")},
        ${card.statementDay}, ${card.dueDay}, ${card.color}, ${card.network}, true,
        ${`${card.bankLabel} Statement of Account`})
      returning id`;
    cardIds.set(card.issuer, row!.id);
  }

  // Sep, Oct: every card has a statement and is paid. Nov: BPI, UB, BDO have
  // statements (BDO paid); Metrobank is past its statement day with no SOA;
  // RCBC's statement day has not arrived yet.
  const months: Array<{ month: number; year: number; issuers: string[] }> = [
    { month: 9, year: 2026, issuers: CARDS.map((c) => c.issuer) },
    { month: 10, year: 2026, issuers: CARDS.map((c) => c.issuer) },
    { month: 11, year: 2026, issuers: ["bpi", "unionbank", "bdo"] },
  ];

  let seed = 7;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (const { month, year, issuers } of months) {
    await sql`
      insert into soa_periods (user_id, mode, from_month, from_year, to_month, to_year,
        notify_telegram, notify_slack, create_calendar, last_run_at)
      values (${userId}, 'single', ${month}, ${year}, ${month}, ${year}, false, false, false,
        ${new Date(Date.UTC(year, month - 1, 6, 4))})`;

    for (const issuer of issuers) {
      const card = CARDS.find((c) => c.issuer === issuer)!;
      const statementYmd = ymd(year, month, card.statementDay);
      const dueYmd = dueFor(card, year, month);
      const lines = SPEND.filter(() => rand() > 0.35);
      const charges = lines.reduce((sum, [, , amount]) => sum + amount, 0);
      const total = Math.round(charges * 100) / 100;
      const minimum = Math.max(500, Math.round(total * 0.05 * 100) / 100);

      const [statement] = await sql<{ id: string }[]>`
        insert into soa_statements (user_id, credit_card_id, statement_month, statement_year,
          bank_label, issuer_id, card_last4, minimum_due, total_due, statement_date, due_date, due_date_ymd)
        values (${userId}, ${cardIds.get(issuer)!}, ${month}, ${year}, ${card.bankLabel}, ${issuer},
          ${card.last4}, ${fmt(minimum)}, ${fmt(total)}, ${label(statementYmd)}, ${label(dueYmd)}, ${dueYmd})
        returning id`;

      const prevMonth = month === 1 ? 12 : month - 1;
      for (const [index, [description, category, amount]] of lines.entries()) {
        const day = String(1 + ((index * 3) % 27)).padStart(2, "0");
        await sql`
          insert into soa_transactions (soa_statement_id, date, description, amount, category_slug, category_source)
          values (${statement!.id}, ${`${String(prevMonth).padStart(2, "0")}/${day}/${String(year).slice(2)}`},
            ${description}, ${fmt(amount)}, ${index % 5 === 4 ? null : category}, ${index % 5 === 4 ? null : "rule"})`;
      }

      const paid = month < 11 || issuer === "bdo";
      await sql`
        insert into due_entries (user_id, credit_card_id, issuer_id, card_last4, bank_label, card_display_label,
          due_date, due_date_ymd, minimum_due, total_due, source, paid_at, paid_amount)
        values (${userId}, ${cardIds.get(issuer)!}, ${issuer}, ${card.last4}, ${card.bankLabel}, ${card.label},
          ${label(dueYmd)}, ${dueYmd}, ${fmt(minimum)}, ${fmt(total)}, 'soa',
          ${paid ? new Date(`${dueYmd}T02:00:00Z`) : null}, ${paid ? fmt(total) : null})`;
    }
  }

  console.log(`Seeded fixtures for dev@localhost (${userId}).`);
  await sql.end();
}

main().catch(async (error) => {
  console.error(error);
  await sql.end();
  process.exit(1);
});
