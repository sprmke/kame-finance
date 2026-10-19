# User Flows

**Status:** Planned high-level flows for v1 dashboard.

## Onboarding

1. Sign up / sign in (Supabase Auth)
2. Connect integrations (Telegram, Slack, Gmail, Calendar)
3. Add credit cards (or import from migration script)
4. Run first SOA

## Overview

1. Overview opens on the current calendar month (Asia/Manila).
2. Previous and next, beside **Run SOA**, move one month at a time. The period control switches between **Month** and **Year**; in year view, previous and next move one year.
3. The mission panel, category breakdown, and period summary follow that selection. A year adds each month’s own totals. **This month** or **This year** returns to the current period.
4. **View SOA** opens that month’s period, or the SOA list when a year is selected.

## Monthly SOA cycle

1. From the configured calendar day each month (default **20**, Settings → SOA), signed-in users with at least one card see a one-time prompt to **Run SOA** for the **next** statement month if that period does not exist yet. **Not now** dismisses until the next target month.
2. Bank emails SOA → manual **Run SOA** (or scheduled `run_soa_pipeline` automation)
3. **Re-run** (SOA list or period) shows **Skip cards with SOA**, on by default. Cards that already have a statement for a month in the selected range are not fetched or parsed again. Cards without one still run. Telegram, Slack, and Google Calendar follow the run toggles for those new statements. Overview, transactions, and analytics update when a new statement is saved. Turn the switch off to process every card again.
4. View parsed statement, transactions, summary PDF
5. When **Add to Google Calendar** is enabled on the run, due-date events (D-4…D-0) are created for every active card with a due day — including cards with no SOA yet (estimated due from card settings). Calendar copy explains missing SOA; if the billing period has ended, it prompts a manual check or upload. A re-run that skips cards with an existing SOA does not replace those cards' events with a missing-SOA estimate.
6. Reminder window start (D-4…D-0) for expected entries when no SOA exists
7. Daily reminder pings until paid
8. Mark paid via UI, Telegram, or receipt photo
9. Reminders stop; calendar shows paid

### Missing SOA fallback

1. Each card has a required recurring **statement date** and **due date** (day of month, 1–31; shorter months use their last day). On add and edit, statement date sits under the full card number and before the due date. Parsed SOA fills a blank day from that card’s statement or due history.
2. Once today is on or after the statement date for the current billing month and no parsed SOA exists, Kame Finance creates an expected due entry. Before that date the missing-SOA warning stays hidden.
3. **SOA missing** shows on the credit cards list, the overview banner and attention list, reminder due cards, the SOA period table and cards, the statement page, and receipt slots (including a receipt that was uploaded before the statement arrived). The card copy is “Statement date passed. SOA not available.”
4. Dashboard, Telegram/Slack, and Google Calendar flag the missing SOA. Calendar descriptions stay short: waiting for the statement during the billing period, or—after the period ends—check the bank or upload the PDF in Kame Finance.
5. Expected entries cannot be marked paid because the amount is unknown. They stay on the due list for 45 days after the estimated due date.
6. A later SOA replaces the expected entry with the bank-provided date and amounts.

### Manual SOA upload

1. Open a period on **SOA** and choose **Upload** (PDF or image).
2. Kame Finance detects bank, card last-4, and statement month; AI fills gaps when parsers/OCR cannot.
3. If the detected card is not in **Credit cards** yet, it is added automatically (due day from the SOA when available; set the PDF password later in Cards if Gmail unlock is needed).
4. Multi-month periods attach to the matching month. A mismatch vs the current period asks to attach here or save the detected month.
5. The statement is stored like a Gmail SOA: totals, transactions, analytics, and due entries.

### Manual SOA entry

1. Open a period on **SOA** and choose **Add**.
2. Pick the credit card. Multi-month periods also ask which statement month.
3. Enter statement date, due date, minimum due, and total due. Save with no transactions when only the summary is available.
4. Optional transaction lines use the stored columns: date, description, amount, and category. Mark a line **Credit** (or describe it as a payment) so it reduces the balance. Total due then follows the lines and stays read-only. Minimum due stays editable, and cannot exceed total due.
5. The row is stored like a parsed SOA for that card and month (replacing an unavailable placeholder). Due entries, reminders, and analytics use the saved amounts.

### SOA period cards

1. Open a period → **Cards**. Switch between table and cards.
2. **Due** is the date. **Paid** is its own status (Paid or Unpaid).
3. **SOA** opens that card’s statement PDF. **Payment** opens the receipt summary when a receipt is linked to that card’s cycle.

### SOA period transactions

1. Open a period → **Transactions**.
2. Search, filter by card/category/type, sort, or group by card or category.
3. Change category in place (same control as statement detail); **Categorize with AI** in the header still applies to the period.

### SOA period analytics

1. Open a period → **Analytics**.
2. Click a category (or a distribution slice) to see that category’s transactions on the same card.
3. **Back** (or Escape) returns to the breakdown.

## Reminders & schedule

1. Open **Reminders** → **Schedule** (payment reminders + SOA Gmail check) and **Due dates** (cards in window)
2. Toggle a job, edit daily time, or run now
3. Mark paid/unpaid on due cards; upload receipt from mark-paid flow
4. On a paid card with a receipt, **View payment** opens the receipt and its AI summary

## Automation management

Managed on **Reminders** (Schedule section). `/dashboard/automations` redirects there.

1. Payment reminders — daily check for cards in reminder window
2. SOA Gmail check — daily fetch/parse pipeline
3. Toggle job, view last run status, retry with Run now

## Receipt upload

1. Upload payment receipt in **Receipts**
2. Images for the same card and statement period show as one card. Open it to page through each image.
3. AI validates that set together (card, combined amount, date, reference) and shows one summary
4. Mark SOA paid when the combined amount meets minimum/total due

Expand with screen-level steps when UI is implemented.
