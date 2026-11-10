# Kame Finance Design System

The normative design system is **[`apps/web/DESIGN.md`](../../apps/web/DESIGN.md)** ("Kalendaryo"). Product truth lives in [`apps/web/PRODUCT.md`](../../apps/web/PRODUCT.md). The redesign plan and its task list are in [`docs/workflow/plans/2026-11-08-ui-ux-redesign.md`](../workflow/plans/2026-11-08-ui-ux-redesign.md).

## In one paragraph

The interface is the kitchen wall calendar where bills get circled and crossed off. White paper, black print ink, **calendar red** for due / overdue / Sundays, **ballpen blue** for everything the user does, and bank colors only on card chips. One typeface, **Archivo**, in two widths: condensed heavy numerals for dates and amounts, normal width for UI. Flat ruled surfaces, 6px controls, 8px panels, one overlay shadow.

## Where things live

| Piece | Path |
| --- | --- |
| Tokens (light + dark) | `apps/web/src/app/globals.css` |
| Tailwind theme | `apps/web/tailwind.config.ts` |
| Font | `apps/web/src/lib/fonts.ts` (Archivo, `wdth` axis) |
| Primitives | `apps/web/src/components/ui/*` |
| Calendar marks, date numerals, month grid | `apps/web/src/components/calendar/*`, `apps/web/src/lib/calendar/month-grid.ts` |
| Amount, card chip, ledger, status tags, segmented control | `apps/web/src/components/shared/*` |
| Bill status vocabulary | `apps/web/src/lib/due/bill-state.ts` |
| Skeleton kit | `apps/web/src/components/shared/skeletons/index.tsx` |
| Brand mark (turtle with a month-grid shell) | `apps/web/src/components/brand/BrandMark.tsx`, `apps/web/src/app/icon.svg` |

## Rules that matter most

1. Light and dark on every screen; use tokens (`bg-background`, `text-foreground`, `bg-card`, `text-due`, `bg-success-wash`…), never raw palette classes.
2. Red marks money that is due; green marks paid; ochre marks SOA missing. Never decorate with them.
3. Dates and amounts use `font-numeral` / `<Amount>` / `<DateNumeral>`.
4. No gradients, glow, glass, colored side borders, or hero-metric stat strips.
5. Minimal UI copy (`.cursor/rules/21-minimal-ui-copy.mdc`).
