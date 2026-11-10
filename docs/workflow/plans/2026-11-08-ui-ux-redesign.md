# Plan: Kame Finance UI/UX redesign ("Kalendaryo")

| | |
| --- | --- |
| Status | Phases 0–9 implemented 2026-11-08; Phase 10–11 polish and QA items open (see §8) |
| Owner | Michael Manlulu |
| Scope | `apps/web` — every route, section, dialog, sheet, card, table, skeleton, empty and error state |
| Product record | [`apps/web/PRODUCT.md`](../../../apps/web/PRODUCT.md) |
| Design system | [`apps/web/DESIGN.md`](../../../apps/web/DESIGN.md) (replaces `docs/product/design-system.md`) |
| Rule | Every existing capability keeps working. Behavior changes only where this plan says so. |

---

## 1. Goals

1. **UX first:** fix the disconnected flow. One card's month (statement → due → reminders → receipt → paid) must read as one connected story, not four modules.
2. **New design system from scratch:** delete the warm-orange gradient system (tokens, glow shadows, gradient bars, DM Sans/Sora, cream background) and every reference to it or to other projects.
3. **Not AI-looking:** avoid the template dashboard (hero-metric cards, icon tiles, gradient accents, glass, tracked eyebrows everywhere). The system takes its grammar from something the users already know by heart.
4. **Production ready:** typed, accessible (WCAG 2.2 AA), light and dark, phone and desktop equally, skeletons that match the final layout, no regressions in tests.

## 2. Inputs and research

### 2.1 Who and where (from the owner, 2026-11-08)

- Today: the owner and family; goal: public SaaS once stable → first-run onboarding and empty states matter now.
- The monthly loop runs on **phone and desktop equally**.
- Navigation and modules may be restructured freely (keep every feature; old URLs redirect).
- Keep the name **Kame Finance**; the mark is redesigned (kame = turtle).

### 2.2 Research summary

| Question | Finding | Decision |
| --- | --- | --- |
| Best font for finance UI | Sources agree on a screen sans with **tabular figures**; Inter is the most cited, IBM Plex / Source Sans next ([fontalternatives: legible numerals](https://fontalternatives.com/blog/best-fonts-legible-numerals-ui/), [madegooddesigns: dashboards](https://madegooddesigns.com/best-fonts-for-dashboards/), [fontalternatives: fintech](https://fontalternatives.com/best-fonts-for/fintech/)). Monospace wastes width; tabular numerals in a proportional face align without the density penalty. | Use one variable grotesque with tabular figures **and a width axis**: **Archivo** (wght 100–900, wdth 62–125). Normal width for UI, condensed heavy for dates and amounts. Inter/IBM Plex are skipped on purpose: they are the default every generated dashboard ships. |
| Theme for a personal finance tracker | The `ui-ux-pro-max` database recommends "Glassmorphism + Dark OLED, calm blue + success green" for every finance product type. | Treated as the **anti-reference**: that is the generic look. Light default (daylight phone use + desk use), dark fully supported. |
| Bill-pay screen UX | Mastercard's bill-pay design guide: keep pay/schedule central, make status/due dates/alerts easy to find, confirm risky selections, highlight the edited bill when returning from a pay flow ([Mastercard guide](https://developer.mastercard.com/bill-pay-experience-design-guide/documentation/design/navigating-the-bills-screen/)). Reminders should be consistent, not noisy ([MoneyPatrol](https://moneypatrol.com/moneytalk/budgeting/bill-tracking-app-reminders-due-dates-and-auto-pay-tips)). Monthly checklist + progress + partial payments open until full ([BillsPaid listing](https://appshunter.io/ios/app/billspaid-bill-tracker/id6789635723)). | New **Bills** workspace: one row per card for the month, status + due date + amounts + receipts + the one next action on the row; "Needs you" list on Home. |

### 2.3 Skills and tools for this work

| Skill / tool | Source | Use in this plan |
| --- | --- | --- |
| `impeccable` | installed (`~/.claude/skills/impeccable`) | Direction (done), `craft-floor`, `critique`, `audit`, `polish`, `harden`, `adapt`, `onboard`, and the mechanical detector (`scripts/detect.mjs`) after each phase |
| `frontend-design` | Anthropic official; the most cited design skill in 2026 roundups ([designrevision](https://designrevision.com/blog/best-claude-code-skills), [claudemarket](https://www.claudemarket.ai/skills/best-frontend-design-skills)) | Second opinion on typography and composition |
| `ui-ux-pro-max` | installed; widely listed ([claudemarket UI/UX](https://www.claudemarket.ai/skills/best-ui-ux-skills)) | Accessibility/UX rule lookups; its style picks for finance are the anti-reference |
| `dataviz` | installed | Category chart colors, legends, tooltips, both themes |
| `find-skills` | installed | Discover more skills later (e.g. Vercel's React/web-design guideline packs) — verify the source before installing |
| Playwright (cached Chromium) | local | Screenshot QA at 390 / 768 / 1280 in light and dark against a **local** Docker DB with fixture data (never the remote DB) |

## 3. Diagnosis of the current UI/UX

Evidence from the code (paths under `apps/web/src`).

**Flow and information architecture**

1. Navigation mirrors the backend, not the job. One card's month is split across **Credit cards** (setup), **SOA** (statement), **Reminders** (due + mark paid), and **Receipts** (proof). Reminders and Receipts both render "one row per registered card for the open month" from the same `reminders.listDue` data, with different actions on each.
2. Overview's attention list sends every item to `/dashboard/reminders` generically (`OverviewPeriodMission.tsx`), not to that card's bill or statement.
3. Overview's **Run SOA** is a link to the SOA list, where the user must press Run SOA again.
4. Reminders mixes the task (due cards) with system config (the automation schedule below it).
5. Settings is one long scroll; automations live elsewhere.
6. Action overload: period detail has five header actions behind a "More" sheet on phone; statement detail computes its actions through nested conditionals (`SoaStatementDetailPage.tsx`).
7. Card add/edit is a 15-field modal with a "Show advanced settings" toggle (`CreditCardsPage.tsx`, 1,060 lines).
8. The Gmail reconnect dialog could not be dismissed (2026-10-19 critique, P0).

**Visual**

1. Orange gradient primary buttons with glow (`button.tsx`), gradient top bars on every stat card and the mission card, glow logo tile, cream page with grid + radial glow (`brand-page-bg`), `text-gradient` hero.
2. Hero-metric template everywhere: four equal `StatCard`s with icon tiles on SOA list, period detail, statement detail.
3. DM Sans + Sora (both on the default list), `border-l` accent on every page and section title, tracked uppercase micro-labels on most cards.
4. Light-mode white-on-orange contrast ≈ 2.7:1 (critique).

## 4. Direction contract

```
THESIS: Kame Finance is the kitchen wall calendar where bills get circled and
crossed off. It refuses the KPI-card fintech dashboard and the dark neon one.
OWN-WORLD: white paper (not cream), black print ink, calendar red for due /
overdue / Sundays, ballpen blue for everything the user does (primary actions,
selection, focus, circle and check marks), bank colors only on card chips.
Archivo in two widths: condensed heavy numerals for dates and amounts, normal
width for UI. Ruled cells, hairlines, 6px radii, flat paper, one crisp shadow
for overlays only.
STORY: open the app → see this month and which card needs you → act on that
row (upload receipt / mark paid / open statement) → it gets crossed off.
FIRST VIEWPORT (Home): month header ‹ NOVEMBER 2026 › with year toggle; month
grid with statement (S) and due marks per card; "Needs you" list beside it on
desktop, below a week strip on phone; month ledger line (due · paid · cards).
FORM: candidate 4 of 7 (Filipino wall calendar), staging: native calendar +
agenda, seed de2811a3.
```

Status grammar used everywhere (badges, calendar, rows):

| State | Mark | Color |
| --- | --- | --- |
| Due / unpaid | pen circle around the date | calendar red when ≤ 3 days or overdue, ink otherwise |
| Paid | check stroke crossing the date off | paid green |
| SOA missing | dashed ring | ochre |
| Expected (no SOA yet, before statement date) | dotted ring | muted ink |
| Today | filled ink square | ink |

Motion: month change slides the page up like a calendar sheet (180 ms); **Mark paid** draws the check like a pen stroke (320 ms). Everything else ≤ 200 ms state feedback. `prefers-reduced-motion` turns both into instant swaps.

## 5. New information architecture

### 5.1 Navigation

| Nav item | Route | Replaces | Job |
| --- | --- | --- | --- |
| Home | `/dashboard` | Overview | What's happening this month and what needs me |
| Bills | `/dashboard/bills` | Reminders (due list) + Receipts | Pay and prove each card for the month |
| Statements | `/dashboard/statements` | SOA | Statement months, cards, transactions, analytics |
| Cards | `/dashboard/cards` | Credit cards | Register and configure cards |
| Settings | `/dashboard/settings` | Settings + Schedule | Connections, automations, statements, categories, AI |

- **Desktop (≥ 1024px):** left rail (wordmark, nav, quick actions, account). **Tablet/phone (< 1024px):** compact top bar (mark, page title, quick actions, account) + **bottom tab bar** with the five items (44px+ targets, safe-area aware).
- **Quick actions** (top bar `+` menu, everywhere): Run SOA, Upload statement, Upload receipt, Add card. Each opens the real flow on the right page via an intent query (`?intent=run-soa|upload-soa|upload-receipt|add-card`), consumed once and removed from the URL.

### 5.2 Route map and redirects

| Old | New | How |
| --- | --- | --- |
| `/dashboard/soa` | `/dashboard/statements` | move route folder; `next.config` redirect (307, keeps query) |
| `/dashboard/soa/:periodId` | `/dashboard/statements/:periodId` | same |
| `/dashboard/soa/:periodId/:statementId` | `/dashboard/statements/:periodId/:statementId` | same |
| `/dashboard/credit-cards` | `/dashboard/cards` | same |
| `/dashboard/reminders` | `/dashboard/bills` | same |
| `/dashboard/receipts` | `/dashboard/bills?view=receipts` | same |
| `/dashboard/automations` | `/dashboard/settings?section=automations` | same |

Also update: `config/routes.ts`, `hooks/use-nav-data-prefetch.ts`, every `loading.tsx`, `soa-period-query` (+ test), Google link `callbackUrl`s, docs.

### 5.3 Cross-links (the "connected" part)

| From | To |
| --- | --- |
| Home "Needs you" row | that card's row on Bills (`#bill-<dueEntryId>`, highlighted on arrival) or its statement |
| Home calendar day | filters "Needs you" to that day |
| Home month header | that month's statement period, that month's bills |
| Bills row | statement detail, SOA PDF preview, receipts, card edit, card info copy |
| Statement detail | its bill row (pay / receipts), card edit |
| Card row | its latest statement, its current bill |
| SOA missing (anywhere) | Run SOA for that month · Upload statement |
| Settings → Automations | last run result, Run now |

## 6. Design system (summary — normative in `apps/web/DESIGN.md`)

- **Tokens:** HSL CSS variables in `globals.css` (`--background`, `--foreground`, `--card`, `--muted`, `--border`, `--input`, `--primary` (ballpen blue), `--due` (calendar red, also `--destructive`), `--success` (paid green), `--warning` (ochre), `--chart-1…8`, sidebar set). Light and dark.
- **Type:** Archivo variable via `next/font` with the `wdth` axis. Utilities: `font-numeral` (condensed 75, weight 750–800, tabular lining), `tabular-nums` default on amounts. Fixed rem scale 12/13/14/16/18/22/28/36/48.
- **Shape:** `--radius: 6px` controls, 8px sheets/panels, 4px badges, square calendar cells. 1px hairlines. No gradients, no glow, no glass.
- **Elevation:** flat surfaces; one overlay shadow token for dialogs, sheets, menus, toasts.
- **Components to build:** `PageHeader`, `Section`, `Ledger` (label/amount rows), `Amount`, `DateNumeral`, `DayMark`, `StatusTag`, `CardChip`, `BankSwatch`, `MonthSwitcher`, `MonthCalendar`, `WeekStrip`, `SegmentedControl`, `FilterChips`, `Toolbar`, `ResponsiveDialog` (dialog ≥ sm, bottom sheet < sm), `EmptyState` (teaches the next action), `ErrorState`, skeleton kit.
- **Retire:** `StatCard` hero strips, gradient `Card` variants, `StatsCard`, `brand-page-bg`, `gradient-*`, `shadow-glow`, `shadow-soft-*`, `shadow-card*`, `interactive-glow`, `text-gradient`, decorative keyframes (float, bounce, spin-slow, shimmer-as-decoration).

## 7. Surface specs

Every surface lists: layout, primary action, states. "States" always means loading skeleton, empty, error, and populated.

### 7.1 Shell

- `app/(dashboard)/layout.tsx`: rail + main; main max width 1200px; page gutter 16px phone / 24px tablet / 32px desktop; bottom padding for the tab bar on phone.
- `DashboardSidebar` → `AppRail`: wordmark + new turtle mark, five nav items with active ink bar (2px, inside the item, not a card border), quick actions, theme, account menu (name, email, sign out).
- `MobileDashboardNav` → `AppTopBar` + `AppTabBar`.
- `NavigationProgress`: 2px ballpen-blue line at the top.
- `SoaAdvanceRunPrompt`: keeps logic; becomes a compact bottom sheet / dialog with "Run SOA for December" + "Not now".
- `GoogleReconnectModal`: dismissable (Escape, close button, "Later"); persistent top banner while disconnected.
- Toaster: ink surface, 6px radius, overlay shadow, icons per type.

### 7.2 Home (`/dashboard`) — `features/dashboard/overview`

- Header: `MonthSwitcher` (‹ NOVEMBER 2026 ›, Month/Year segmented, "This month" reset) + primary action: **Run SOA** opens the Run dialog in place (no extra page).
- Month view: `MonthCalendar` (desktop/tablet) / `WeekStrip` (phone, expandable to the month). Marks per due entry and per card statement day, card color dots. Tap a day → filter Needs you.
- **Needs you** list (replaces the attention list): SOA missing, due soon/overdue, below minimum, reminders ready, uncategorized; each row has the specific destination and the one action.
- **Month ledger** (replaces three progress bars + summary card): statement total, paid, outstanding, minimum met x/y, cards paid x/y, next due — set as ledger rows with condensed numerals, one thin paid/total bar.
- Spend by category (existing donut/list, recolored) → click goes to Statements analytics with that category.
- Year view: 12 mini months (paid/outstanding per month), click a month → month view.
- Empty (no cards): first-run checklist — Connect Google → Add a card → Run first SOA (each step shows done/next). No SOA for month: "No statements for November" + Run SOA / Upload statement.
- Server: extend `overview.stats` with `calendarDues` (all due rows in span, paid or not, with issuer/last4/label/color/dueDateYmd/paidAt/source/soaMissing) and `statementDays` (active cards' statement day + color) — additive, typed.

### 7.3 Bills (`/dashboard/bills`) — new `features/dashboard/bills`, reusing reminders + receipts logic

- Header: title "Bills · November 2026", ledger line (due / paid / cards paid), primary **Upload receipt**.
- View switch (`SegmentedControl`, URL `?view=`): **Due** (default) · **Receipts**.
- Filters (Due view): All · Unpaid · Paid · SOA missing (chips with counts). Group: by month / by card (existing toggle, persisted).
- **Bill row** (`BillCard`): card chip (bank swatch, label, •••• last4), `DateNumeral` due date with `DayMark`, status tag, schedule line (reminder status), minimum / total, receipts strip (thumbnails + count, opens carousel/preview), actions: primary **Mark paid** (or **Mark unpaid**), secondary **Upload receipt**, menu: View SOA, Card info, Add receipt, View payment, Statement details, Edit card. Expected/SOA-missing rows show **Run SOA** / **Upload statement** instead of Mark paid.
- Keeps: `MarkPaidChoiceDialog`, `DueActionProgressDialog`, confirm-unpaid, `PaymentReceiptPreview`, `ReceiptUploadDialogs` (one vs separate payments), batch progress.
- **Receipts view:** the existing board (month/card grouping, placeholders per card, SOA not yet available, Add receipt, Card info, revalidate, delete, carousel, AI verdict) restyled into the same row grammar.
- Deep link `#bill-<dueEntryId>` scrolls and highlights the row (1.2 s ink-blue wash).
- Skeleton: header + chips + 4 bill rows of real proportions.

### 7.4 Statements (`/dashboard/statements`) — `features/dashboard/soa`

- **List:** header primary **Run SOA**, secondary menu: Clean up duplicates. Replace four stat cards with one ledger line (statements · latest total due · last run). Periods as a ruled table on desktop (month numeral, cards, total due, paid status, type badge, actions) and as month rows on phone. View toggle kept for desktop only if still useful (table/grid → keep grid as "calendar pages").
- **Period detail:** breadcrumb, title = month numeral + name, ledger line (outstanding · minimum · paid · next due), header primary **Re-run**, secondary: Upload, Add manually, Categorize with AI, Summary PDF (desktop inline, phone menu). Tabs: Summary · Cards · Transactions · Analytics (URL-synced as today).
  - Cards tab: statement rows with due mark, paid status, SOA, Payment, Pay now (→ receipt flow).
  - Transactions tab: existing filters/sort/group/search, sticky toolbar, ruled table, category select inline.
  - Analytics: donut + breakdown + drill-down (`?category=`) restyled; chart palette from tokens.
- **Statement detail:** breadcrumb; header shows bank chip, statement month, status; **one** primary action chosen by state (Pay → bill row, or SOA PDF), rest in a menu; ledger block (total due large condensed, minimum, due date numeral with mark, statement date); transactions list; settlement; missing SOA notice with actions.
- Dialogs: `RunSoaDialog` (+ progress panel), `EditSoaPeriodDialog`, `ManualSoaEntryDialog` (sectioned: card & month, summary, lines), `ManualSoaMonthConfirmDialog`, `SoaPdfPreview` (full-height sheet on phone), `CategorizeWithAiDialog`, `CategorizeWithAiProgressDialog`.

### 7.5 Cards (`/dashboard/cards`) — `features/dashboard/credit-cards`

- Header primary **Add card**. List: card rows styled as card plastics in miniature (bank swatch stripe, label, •••• last4, network, statement day S and due day D as numerals, Gmail account, status: active / SOA missing), actions: Edit, Remove, View statements, View bill.
- Add/Edit in a **side sheet** (desktop) / full-height sheet (phone) with sections instead of "advanced": Card (bank, label, number, network) · Billing cycle (statement day, due day, statement month shift) · Statement email (Gmail account, SOA subject, PDF password) · Reminders (days before due, how often) · Look (color) · Notes. Sticky footer with Save.
- Split `CreditCardsPage.tsx` into `CardList`, `CardRow`, `CardFormSheet`, `card-form-state` hook. Draft persistence before Gmail connect kept.

### 7.6 Settings (`/dashboard/settings`) — `features/dashboard/settings` + `automations`

- Section nav (left list desktop, segmented scroll phone; URL `?section=`): **Connections** (Google accounts & calendar, Telegram, Slack) · **Automations** (payment reminders, SOA Gmail check: on/off, daily time, last run, Run now, edit) · **Statements** (early-run reminder day) · **Categories** (custom categories, keyword rules) · **AI** (Gemini/Groq keys, verify).
- Each provider as a row with status (Connected / Not connected) and inline form; secrets masked.

### 7.7 Public

- `/` landing: rebuilt in the same world (month page hero showing the real product loop with synthetic, labelled sample data; four steps: Gmail → parse → remind → crossed off). No invented claims.
- `/login`: calendar-page card, mark, "Continue with Google" (+ local session in dev).
- `/auth/error`: same shell, error copy + retry.

## 8. Task list

Legend: `[ ]` todo · `[x]` done. Each phase ends with `bun run type-check`, `bun run test`, `bun run lint`.

### Phase 0 — Records and cleanup
- [x] Interview owner (users, device, IA freedom, brand)
- [x] `apps/web/PRODUCT.md`
- [x] Direction chosen: Kalendaryo
- [x] This plan
- [x] `apps/web/DESIGN.md` (normative tokens + rules)
- [x] Delete `docs/rebuild/design-system.md`, `docs/temp/atomiq-design-system-plan.md`; rewrite `docs/product/design-system.md` as a pointer to DESIGN.md
- [x] Remove references to other projects in code comments, rules, skills, and docs (`kame-homes`, `kame-desk`, `kame-lends`, `DoctorDesk`, `property management`, AtomIQ)
- [x] Update `.cursor/rules/13-ui-ux-design.mdc`, `14-dashboard-ui.mdc` (and the stale phase table in `11-workflow.mdc`) to the new system and IA

### Phase 1 — Foundation
- [x] `lib/fonts.ts`: Archivo variable with `wdth` axis; drop DM Sans/Sora
- [x] `globals.css`: new token set (light/dark), base typography, `font-numeral`, focus ring, selection, reduced motion, remove every legacy utility
- [x] `tailwind.config.ts`: new colors (`due`), radii, shadows (`overlay` only), font families, motion durations/easings; remove legacy shadows, gradients, decorative animations
- [x] `app/layout.tsx`: theme-color values, font variables

### Phase 2 — Primitives and shared components
- [x] Rebuild `components/ui/*`: button, badge, card, dialog, sheet, alert-dialog, dropdown-menu, select, input, textarea, password-input, switch, radio-group, tabs, table, tooltip, skeleton, sonner, avatar, separator, label, form
- [x] New shared: `PageHeader`, `Section`, `Ledger`, `Amount`, `DateNumeral`, `DayMark`, `StatusTag`, `CardChip`, `SegmentedControl`, `FilterChips`, `ResponsiveDialog`, `EmptyState`, `ErrorState`
- [x] Restyle `StatusBadge`, `MissingSoaBadge`, `ConfirmDialog`, `ListViewToolbar`, `ViewToggle`, `PageActionBar`, `TableCard`, `ClickableTableRow`, `WorkflowProgressPanel`, `LoadingSpinner`
- [x] Retire `StatCard` strips and `StatsCard` (StatCard kept only as a flat fallback; no page uses it)
- [x] Brand: new turtle mark (`BrandMark`) + wordmark (`BrandLogo`), favicon/icon

### Phase 3 — Shell and IA
- [x] Nav config + route renames (statements, cards, bills) + `next.config` redirects
- [x] `AppRail`, `AppTopBar`, `AppTabBar`, quick actions menu, account menu
- [x] Quick actions via `QuickActionsProvider` (Run SOA and Upload receipt open in place; Add card → `/dashboard/cards?add=1`). Upload SOA stays on the statement month (it needs a month); intent query params were not needed
- [x] Prefetch map, `loading.tsx` for every route
- [x] Reconnect modal: "Not now" persists for the browser session (failed Gmail actions still force it). [ ] Persistent banner while disconnected; [ ] SOA advance prompt visual pass

### Phase 4 — Home
- [x] `overview.stats`: `calendarDues`, `calendarCards`, `asOf`
- [x] `MonthHeader`, `MonthCalendar` (full month also on phone; a week strip was not needed at 390px), Needs you, month ledger, spend card, year view, first-run checklist, skeleton

### Phase 5 — Bills
- [x] `features/dashboard/bills`: page, `BillRow`, filters, due view, receipts view (board), deep-link highlight
- [x] Remove `RemindersHubPage`/`DueEntryCard`; receipt slot + tokens sweep. [ ] Deeper pass on `ReceiptCard`, `ReceiptPreviewDialog`, `CardInfoDialog`

### Phase 6 — Statements
- [x] List (months by year), month detail header/figures/tabs, statement detail. [ ] Visual pass on `RunSoaDialog`, `ManualSoaEntryDialog` sections, Cards-tab table/grid, analytics donut legend

### Phase 7 — Cards
- [x] Card rows (`CardList`), side-sheet form with sections. [ ] Extract form state into a hook to shrink `CreditCardsPage.tsx`

### Phase 8 — Settings
- [x] Section nav; Connections, Automations (moved), Statements, Categories, AI

### Phase 9 — Public
- [x] Landing, login, auth error, register redirect

### Phase 10 — States and polish
- [x] Skeleton kit rewritten for every route; empty/error states on Home, Bills, Statements, Cards. [ ] Error states inside Settings sub-panels
- [x] Motion: month sheet-in, pen check on mark paid, deep-link highlight; reduced motion
- [x] `impeccable` detector over changed UI; findings fixed (remaining: tab underline false positive, a test fixture color)

### Phase 11 — QA and docs
- [x] `type-check` + `bun test` (354 pass) + production `next build` green. Note: `bun run lint` is not configured in this repo (`next lint` prompts for setup)
- [x] Screenshot review 390/1280 light/dark on local fixture data (`apps/web/scripts/seed-ui-fixtures.ts`). [ ] 768px tablet pass
- [ ] Contrast check of every token pair; keyboard pass on dialogs/menus
- [x] Docs: `application-inventory.md`, `user-flows.md`, root `README.md`, `docs/README.md`. [ ] `feature-specifications.md` UI references

## 9. Quality gates

| Gate | Command / check |
| --- | --- |
| Types | `bun run type-check` (typed routes catch stale links) |
| Tests | `bun run test` — no regressions; update route strings in tests |
| Lint | `bun run lint` |
| Detector | `node ~/.claude/skills/impeccable/scripts/detect.mjs --json <changed files>` |
| Contrast | text ≥ 4.5:1, large/UI ≥ 3:1, both themes |
| Touch | ≥ 44px targets below 1024px |
| Visual | screenshots per route, light/dark, phone/tablet/desktop |

## 10. Risks

| Risk | Mitigation |
| --- | --- |
| Route renames break bookmarks, Telegram links, OAuth callbacks | `next.config` redirects (307) keep queries; Google link `callbackUrl` updated; server code has no hard-coded dashboard paths (checked) |
| Merging Reminders + Receipts loses an action | Bills keeps every action from both; checklist in §7.3 |
| Large files (`CreditCardsPage`, `SoaPeriodDetailPage`) regress on refactor | Split by component, keep mutations and invalidations unchanged |
| Remote DB used during QA | QA only against local Docker Postgres with fixture data |
| Calendar crowds phone | Week strip on phone; list stays primary |

## 11. Implementation notes (2026-11-08)

- **Hydration fix:** `TrpcHydrate` now seeds queries that a layout component created (empty) before the page's boundary rendered; previously SSR rendered those without data and the client hydrated with it.
- **`cn` fix:** `tailwind-merge` is extended with the custom `text-2xs` / `text-13` sizes; without it, `text-13` silently removed text colors such as `text-primary-foreground`.
- **Visual QA:** `apps/web/scripts/seed-ui-fixtures.ts` seeds synthetic data for `dev@localhost` into the docker-compose Postgres only. Run the dev server with `DATABASE_URL` pointed at `localhost:5434` and messaging/AI env vars blanked.
- **Review:** the impeccable finish-review subagent isn't available in this harness; the finish review ran in-thread.
