# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Today:** the owner and family members in the Philippines, each signing in with their own Google account, each carrying several credit cards across PH banks and e-wallets.
- **Next:** public sign-ups once the product is stable (SaaS). First-run setup, empty states, and per-user scoping must already work for a stranger with zero cards.
- **Scene:** the monthly loop is run on phone and desktop equally. Phone: glance at what is due, upload a payment screenshot from a banking app or GCash/Maya, mark paid. Desktop: review a statement month, browse and recategorize transactions, check spend analytics, manage cards and integrations.

## Product Purpose

Kame Finance closes every credit card's monthly cycle with as little manual work as possible:

1. Bank sends the statement of account (SOA) PDF to Gmail.
2. Kame Finance fetches, unlocks, and parses it (bank parsers, OCR, AI fallback), or the user uploads or types it in manually.
3. Dues (minimum and total) and due dates become due entries; a card with no SOA after its statement date is flagged **SOA missing**.
4. Reminders go out through Telegram and Slack, and Google Calendar holds D-4…D-0 events, until the card is paid.
5. A payment receipt (image or PDF) is validated by AI against the due amount and marks the card paid (also via Telegram).
6. Transactions are categorized (rules, learned corrections, AI) and roll up into spend analytics.

Success: each month every card goes from statement to paid without the user chasing inboxes, bank apps, and spreadsheets, and the user can see at a glance which card still needs something.

## Positioning

It works from the bank's own SOA PDFs (Gmail fetch + PH bank parsers + OCR/AI), not bank APIs or manual entry, and it links each statement to its due entry, reminders, calendar events, and payment receipts as one cycle per card per month.

## Operating Context

- Philippine banks and issuers (`PH_BANK_ISSUERS`): dedicated parsers for Metrobank, RCBC, BPI, Unionbank; others via OCR/AI. Currency is PHP (₱). Timezone Asia/Manila.
- Inputs: Gmail (multiple linked Google accounts, per-card routing), password-protected PDFs, manual PDF/image upload, manual summary entry.
- Outputs: Telegram/Slack messages, Google Calendar events, a generated summary PDF per period.
- Automations: two managed daily jobs — payment reminders and SOA Gmail check — with run history and Run now.
- Terminology in use: SOA (statement of account), statement date, due date, minimum due, total due, SOA missing, billing month / statement month, period, receipt, mark paid / mark unpaid, categorize with AI.

## Capabilities and Constraints

- Every existing capability stays: card CRUD (encrypted PDF password, statement/due day, Gmail routing, network, color, reminder window/interval, statement month shift, notes); SOA run/re-run with live progress and skip-existing; manual upload with month confirm; manual entry with transaction lines; period overview/cards/transactions/analytics; statement detail; summary PDF; category rules, custom categories, AI categorization with progress; due entries with mark paid/unpaid and progress; receipts batch upload (one vs separate payments), AI verdict, revalidate, carousel, card info copy, delete; automation schedule edit/run; integrations (Google accounts, Telegram, Slack, AI keys); SOA early-run prompt; Google reconnect monitor.
- Stack: Next.js 15 App Router, React 19, Tailwind 3, Radix/shadcn primitives, tRPC + TanStack Query, server-prefetched pages.
- Light and dark themes are both required.
- Minimal UI copy: labels, data, and actions over prose (see `.cursor/rules/21-minimal-ui-copy.mdc`).
- Undecided: pricing, plan limits, public marketing claims, multi-tenant/team accounts.

## Brand Commitments

- Name stays **Kame Finance**. The mark is open for redesign (kame = turtle).
- No references to other projects or to the previous visual system.

## Evidence on Hand

- Real product behavior and copy live in `docs/product/user-flows.md` and `docs/reference/application-inventory.md`.
- No testimonials, customer logos, usage numbers, or benchmarks exist. Do not invent them on the landing page.

## Product Principles

1. **One cycle, one place.** A card's month — statement, due, reminders, receipt, paid — reads as one connected story, never four modules.
2. **What needs me next comes first.** Every screen leads with the action the user owes (missing SOA, due soon, unpaid, uncategorized) before history and analytics.
3. **Trust the numbers.** Amounts, dates, and status are exact, aligned, and sourced (SOA, receipt, manual) so the user never second-guesses a figure.
4. **Automation is visible.** Background runs, progress, and failures are always inspectable and recoverable in place.
5. **Ready for strangers.** A brand-new user can get from sign-in to a first parsed statement without reading docs.

## Accessibility & Inclusion

WCAG 2.2 AA: text contrast ≥ 4.5:1 in both themes, visible focus, 44px touch targets on phone, keyboard-operable dialogs and menus, `prefers-reduced-motion` respected.
