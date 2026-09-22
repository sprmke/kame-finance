# User Flows

**Status:** Planned high-level flows for v1 dashboard.

## Onboarding

1. Sign up / sign in (Supabase Auth)
2. Connect integrations (Telegram, Slack, Gmail, Calendar)
3. Add credit cards (or import from migration script)
4. Run first SOA

## Monthly SOA cycle

1. Bank emails SOA → manual **Run SOA** (or scheduled `run_soa_pipeline` automation)
2. View parsed statement, transactions, summary PDF
3. Calendar events + reminder window start (D-4…D-0)
4. Daily reminder pings until paid
5. Mark paid via UI, Telegram, or receipt photo
6. Reminders stop; calendar shows paid

### Missing SOA fallback

1. Each card has a required recurring due day (1–31; shorter months use their last day). Parsed SOA fills this from the card’s due-date history when it was left blank.
2. When no parsed SOA exists as the reminder window opens, Kame Finance creates an expected due entry.
3. Dashboard, Telegram/Slack, and Google Calendar flag the missing SOA and direct the user to check email or the bank app.
4. Expected entries cannot be marked paid because the amount is unknown.
5. A later SOA replaces the expected entry with the bank-provided date and amounts.

### Manual SOA upload

1. Open a period on **SOA** and choose **Upload** (PDF or image).
2. Kame Finance detects bank, card last-4, and statement month; AI fills gaps when parsers/OCR cannot.
3. If the detected card is not in **Credit cards** yet, it is added automatically (due day from the SOA when available; set the PDF password later in Cards if Gmail unlock is needed).
4. Multi-month periods attach to the matching month. A mismatch vs the current period asks to attach here or save the detected month.
5. The statement is stored like a Gmail SOA: totals, transactions, analytics, and due entries.

### SOA period analytics

1. Open a period → **Analytics**.
2. Click a category (or a distribution slice) to see that category’s transactions on the same card.
3. **Back** (or Escape) returns to the breakdown.

## Reminders & schedule

1. Open **Reminders** → **Schedule** (payment reminders + SOA Gmail check) and **Due dates** (cards in window)
2. Toggle a job, edit daily time, or run now
3. Mark paid/unpaid on due cards; upload receipt from mark-paid flow

## Automation management

Managed on **Reminders** (Schedule section). `/dashboard/automations` redirects there.

1. Payment reminders — daily check for cards in reminder window
2. SOA Gmail check — daily fetch/parse pipeline
3. Toggle job, view last run status, retry with Run now

## Receipt upload

1. Upload payment receipt in **Receipts**
2. AI validates card, amount, and bank/wallet (Gemini + Groq fallback)
3. Mark SOA paid when amount meets minimum/total due

Expand with screen-level steps when UI is implemented.
