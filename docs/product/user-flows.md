# User Flows

**Status:** Current flows after the 2026-11 redesign (see `apps/web/DESIGN.md`).

## Navigation

Five destinations: **Home**, **Bills**, **Statements**, **Cards**, **Settings** (left rail on desktop, bottom tab bar on phone). **New** (rail) or **+** (phone top bar) opens Upload receipt, Run SOA, or Add card from any page.

## Onboarding

1. Sign in with Google. Local development can also continue with a local session (no Gmail access).
2. Home shows a three-step checklist until the first statement exists: **Connect Gmail** (Settings → Connections), **Add a card**, **Run your first SOA**. Each step shows done or next.
3. Telegram, Slack, and AI keys are optional (Settings → Connections / AI).

## Home

1. Home opens on the current calendar month (Asia/Manila): ‹ NOVEMBER 2026 › with **Month / Year** and **Run SOA** (opens the run dialog in place).
2. The month calendar marks each card's due date (pen circle; red when due within 3 days or overdue; check when paid; dashed ring for SOA missing; dotted ring while awaiting the SOA) and each card's statement day. Today is a filled square; Sundays are red. Tap a day to see only that day's bills.
3. **Needs you** lists the month's bills by urgency — overdue, SOA missing, due soon, unpaid, awaiting SOA — then **Crossed off** (paid). Each row opens that bill on **Bills**; **Receipt** uploads a payment for it directly; **Run SOA** shows for missing statements. Reminders ready, cards below minimum, and uncategorized transactions follow.
4. **Month summary** (outstanding, paid share, statement total, minimum met, cards paid, next due, spend, interest & fees) and **Spend by category** follow the selected month or year. A category opens that month's statement on **Analytics** (`?tab=analytics&category=`).
5. **Year** shows the twelve months; pick one to return to month view.

## Bills

1. **Bills** shows the open billing month's figures (outstanding, paid, cards paid) and **Upload receipt**.
2. **Due** lists one bill per card per month: due date with its mark, status, reminder schedule, minimum and total, and actions — **Mark paid** (asks to upload a receipt or mark without one), **Receipt** (upload for that card), **View payment**, **Mark unpaid**, or **Run SOA** when the statement is missing. Filter **All / Unpaid / Paid / No SOA**; group by month or card.
3. Marking paid draws a check through the date.
4. **Receipts** (`?view=receipts`) is the receipt board described under *Receipt upload*.
5. Links of the form `/dashboard/bills#bill-<id>` scroll to that bill and highlight it.

## Monthly SOA cycle

1. From the configured calendar day each month (default **20**, Settings → Statements), signed-in users with at least one card see a one-time prompt to **Run SOA** for the **next** statement month if that period does not exist yet. **Not now** dismisses until the next target month.
2. Bank emails SOA → manual **Run SOA** (or scheduled `run_soa_pipeline` automation)
3. **Re-run** (Statements list or a statement month) keeps that period’s month and year. The dialog hides Period, month, and year, and shows **Skip cards with SOA**, on by default. Cards that already have a statement for a month in that range are not fetched or parsed again. Cards without one still run. Telegram, Slack, and Google Calendar follow the run toggles for those new statements. Overview, transactions, and analytics update when a new statement is saved. Turn the switch off to process every card again.
4. View parsed statement, transactions, summary PDF
5. When **Add to Google Calendar** is enabled on the run, due-date events (D-4…D-0) are created for every active card with a due day — including cards with no SOA yet (estimated due from card settings). Calendar copy explains missing SOA; if the billing period has ended, it prompts a manual check or upload. A re-run that skips cards with an existing SOA does not replace those cards' events with a missing-SOA estimate.
6. Reminder window start (D-4…D-0) for expected entries when no SOA exists
7. Daily reminder pings until paid
8. Mark paid via UI, Telegram, or receipt photo
9. Reminders stop; calendar shows paid

### Missing SOA fallback

1. Each card has a required recurring **statement date** and **due date** (day of month, 1–31; shorter months use their last day). On add and edit, statement date sits under the full card number and before the due date. Parsed SOA fills a blank day from that card’s statement or due history.
2. The open billing month is the current calendar month (plus the card’s Gmail month offset). Reminders and receipts show that month only, with one row per registered card. The next month is not opened early. When the due day is after the statement day, the payment date stays in the statement month (statement day 7, due day 28 → the 28th of that month). When the due day is on or before the statement day, payment is the following month, still grouped under the statement month.
3. Once today is on or after the statement date for that month and no parsed SOA exists, the row is marked **SOA missing**. Before that date the card still appears as pending, and the missing-SOA warning stays hidden.
4. **SOA missing** shows on the Cards list, the Home calendar and Needs you list, Bills rows, the statement month tables, the statement page, and receipt slots (including a receipt that was uploaded before the statement arrived). The card copy is “Statement date passed. SOA not available.”
5. Dashboard, Telegram/Slack, and Google Calendar flag the missing SOA. Calendar descriptions stay short: waiting for the statement during the billing period, or—after the period ends—check the bank or upload the PDF in Kame Finance.
6. Expected entries cannot be marked paid because the amount is unknown. They stay on the due list for 45 days after the estimated due date.
7. A later SOA replaces the expected entry with the bank-provided date and amounts. Calendar events follow that date: the estimate’s events are removed, and the statement due date gets the D-4…D-0 series (marked paid when the due is already paid).

### Manual SOA upload

1. Open a month on **Statements** and choose **Upload SOA** (PDF or image).
2. Kame Finance detects bank, card last-4, and statement month; AI fills gaps when parsers/OCR cannot.
3. If the detected card is not in **Credit cards** yet, it is added automatically (due day from the SOA when available; set the PDF password later in Cards if Gmail unlock is needed).
4. Multi-month periods attach to the matching month. A mismatch vs the current period asks to attach here or save the detected month.
5. The statement is stored like a Gmail SOA: totals, transactions, analytics, and due entries.

### Manual SOA entry

1. Open a month on **Statements** and choose **More → Add manually**.
2. Pick the credit card. Multi-month periods also ask which statement month.
3. Enter statement date, due date, minimum due, and total due. Save with no transactions when only the summary is available.
4. Optional transaction lines use the stored columns: date, description, amount, and category. Mark a line **Credit** (or describe it as a payment) so it reduces the balance. Total due then follows the lines and stays read-only. Minimum due stays editable, and cannot exceed total due.
5. The row is stored like a parsed SOA for that card and month (replacing an unavailable placeholder). Due entries, reminders, and analytics use the saved amounts.

### SOA period cards

1. Open a statement month → **Cards**. Switch between table and cards.
2. **Due** is the date. **Paid** is its own status (Paid or Unpaid).
3. **SOA** opens that card’s statement PDF. **Payment** opens the receipt summary when a receipt is linked to that card’s cycle.

### SOA period transactions

1. Open a statement month → **Transactions**.
2. Search, filter by card/category/type, sort, or group by card or category.
3. Change category in place (same control as statement detail); **Categorize with AI** in the header still applies to the period.

### SOA period analytics

1. Open a statement month → **Analytics**, or open `?tab=analytics&category=<slug>` for a category.
2. Click a category (chart, legend, or distribution slice) to see that category’s transactions. Each row has the same category dropdown as the transactions table. Changing it saves the category and updates the breakdown. The selection is stored in the URL.
3. **Back** (or Escape) returns to the breakdown and clears `category`.

## Reminders & schedule

1. Open **Settings → Automations** for the two daily jobs: payment reminders and SOA Gmail check. Toggle a job, edit its daily time, or **Run now** (live progress and result).
2. Due bills and mark paid/unpaid live on **Bills**. Each bill shows minimum and total due (`—` until a statement amount exists) and its reminder schedule (when reminders start, or that one is ready).

## Automation management

Managed on **Settings → Automations**. `/dashboard/automations` and `/dashboard/reminders` redirect.

1. Payment reminders — daily check for cards in reminder window
2. SOA Gmail check — daily fetch/parse pipeline
3. Toggle job, view last run status, retry with Run now

## Receipt upload

1. Upload a payment receipt from **Bills** (or **New → Upload receipt** anywhere, or **Receipt** on a Home or Bills row). The **Receipts** view on Bills shows the board. Each month lists unpaid cards first, then paid cards. Open a card’s menu and choose **Add receipt** to attach more files to that bank and statement month. A card with no statement yet shows **SOA not yet available**, and its SOA button stays disabled until a statement file exists. **Card info** on a placeholder or uploaded receipt opens the card name, masked number, card type, minimum and total due, statement date, and due date. Copy uses the full number with no spaces, amounts without commas, and dates as `YYYY-MM-DD`.
2. If more than one file is selected, choose **One payment** or **Separate payments**. One payment counts the set once. Separate payments records each receipt. One file skips this choice. Bills, Home, quick actions, and a statement month use the same step.
3. Images for the same card and statement period show as one card. Open it to page through each image.
4. AI validates that set together (card, combined amount, date, reference) and shows one summary
5. Mark SOA paid when the combined amount meets minimum/total due
6. **Add receipt** keeps later files on that statement after the due is already paid. A separate-payment upload adds each amount. A one-payment upload counts that set once

Expand with screen-level steps when UI is implemented.
