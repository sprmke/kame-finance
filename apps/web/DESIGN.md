---
name: Kame Finance
description: The kitchen wall calendar where every card's bill gets circled and crossed off.
colors:
  paper: "#FAFAF8"
  sheet: "#FFFFFF"
  shade: "#F1F0EC"
  rule: "#E3E1DC"
  rule-strong: "#BDB9B1"
  ink: "#151515"
  ink-soft: "#5F5C57"
  ballpen: "#2541B2"
  ballpen-deep: "#1D3594"
  ballpen-wash: "#ECEFFB"
  calendar-red: "#D2291F"
  calendar-red-wash: "#FCEBEA"
  paid-green: "#1D7A4C"
  paid-green-wash: "#E8F4EE"
  ochre: "#965A00"
  ochre-wash: "#FBF1E0"
  night-paper: "#121211"
  night-sheet: "#1A1A18"
  night-shade: "#23231F"
  night-rule: "#31302C"
  night-ink: "#EDECE8"
  night-ink-soft: "#A29F98"
  night-ballpen: "#93A3FF"
  night-red: "#FF6B5F"
  night-green: "#52C58C"
  night-ochre: "#F0B14A"
typography:
  numeral-xl:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 72"
    fontFeature: "'tnum' 1, 'lnum' 1"
  numeral-lg:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.015em"
    fontVariation: "'wdth' 72"
    fontFeature: "'tnum' 1, 'lnum' 1"
  numeral-md:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 750
    lineHeight: 1.1
    fontVariation: "'wdth' 75"
    fontFeature: "'tnum' 1, 'lnum' 1"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.015em"
    fontVariation: "'wdth' 80"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 650
    lineHeight: 1.3
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  tag: "4px"
  control: "6px"
  panel: "8px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
components:
  button-primary:
    backgroundColor: "{colors.ballpen}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.control}"
    height: "40px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.ballpen-deep}"
  button-secondary:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "40px"
  button-danger:
    backgroundColor: "{colors.calendar-red}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.control}"
  panel:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
  tag-due:
    backgroundColor: "{colors.calendar-red-wash}"
    textColor: "{colors.calendar-red}"
    rounded: "{rounded.tag}"
  tag-paid:
    backgroundColor: "{colors.paid-green-wash}"
    textColor: "{colors.paid-green}"
    rounded: "{rounded.tag}"
  tag-missing:
    backgroundColor: "{colors.ochre-wash}"
    textColor: "{colors.ochre}"
    rounded: "{rounded.tag}"
  input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "40px"
---

# Design System: Kame Finance

## Overview

**Creative North Star: "Kalendaryo".** The free wall calendar from the neighborhood bakery or hardware store, hung in the kitchen, with bills circled in blue ballpen and crossed off when paid. Every Filipino household reads it without thinking, and every card's cycle *is* a set of days in a month: statement day, due day, paid day.

Two layers of ink carry meaning:

- **Printed ink** (black + calendar red) is what the bank and the system say: dates, amounts, due and overdue.
- **Ballpen blue** is what *you* do: primary actions, selection, focus, the circle and the check you put on a date.

Product UI (Operate mode). Familiar affordances, dense where the task is dense, calm everywhere else. The calendar grammar lives in numerals, ruled cells, and marks; it never replaces a standard control.

Anti-references: KPI-card fintech dashboards (icon tile + big number + gradient bar), dark neon crypto dashboards, glassmorphism, cream "paper" with serif display, gradient text, glow.

## Colors

Strategy: **Restrained** — neutral paper and ink, one action color (ballpen), semantic red/green/ochre for state only. Bank colors appear only on card chips and swatches.

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| `--background` paper | `#FAFAF8` | `#121211` | page |
| `--card` sheet | `#FFFFFF` | `#1A1A18` | panels, rows, dialogs |
| `--muted` shade | `#F1F0EC` | `#23231F` | rails, table heads, inactive fills |
| `--border` rule | `#E3E1DC` | `#31302C` | hairlines |
| `--input` rule-strong | `#BDB9B1` | `#4A4842` | control borders |
| `--foreground` ink | `#151515` | `#EDECE8` | text |
| `--muted-foreground` ink-soft | `#5F5C57` | `#A29F98` | secondary text (≥ 6:1 on paper) |
| `--primary` ballpen | `#2541B2` | `#93A3FF` | primary buttons, links, selection, focus ring, user marks |
| `--accent` ballpen-wash | `#ECEFFB` | `#1E2340` | hover/selected wash |
| `--due` / `--destructive` calendar red | `#D2291F` | `#FF6B5F` | due soon, overdue, Sundays, delete |
| `--success` paid green | `#1D7A4C` | `#52C58C` | paid |
| `--warning` ochre | `#965A00` | `#F0B14A` | SOA missing, attention |

Rules:

- Red never decorates. It marks a date that costs money (due soon, overdue) or a destructive action.
- Status tags use the wash as fill and the full color as text; solid fills are for buttons only.
- Charts use `--chart-1…8` (ballpen, gold, teal, violet, rose, sky, olive, clay). Red and green stay out of category palettes so they keep their state meaning.

## Typography

One family: **Archivo** (variable, `wght` 100–900, `wdth` 62–125), loaded with `next/font` and the `wdth` axis.

- **UI** at normal width: body 14px/1.45, labels 12px/600, titles 16px/650.
- **Numerals** (`font-numeral`): width 72–75, weight 750–800, tabular lining figures. Used for dates, day numbers, amounts, counts — the calendar's printed numbers. Never for labels or prose.
- **Headlines** (page titles, month names): width 80, weight 800, tight tracking. Month names in the month header are uppercase; nothing else is.
- Fixed rem scale: 11 (micro labels only) / 12 / 13 / 14 / 16 / 18 / 22 / 28 / 36 / 48, plus 60 for the landing headline only. No fluid type.
- Amounts always `tabular-nums`; currency sign `₱` set at the same size, lighter weight.

## Layout

- Shell: left rail 240px at ≥ 1024px; below that, a 56px top bar plus a bottom tab bar (64px + safe area).
- Content max width 1200px; gutters 16px (phone) / 24px (tablet) / 32px (desktop).
- Vertical rhythm: 24px between sections, 12px inside groups, more space above a heading than below it.
- Lists before grids: bills, statements, and cards are ruled rows that wrap into stacked rows on phone. Grids only for calendar months and receipt images.
- Calendar month grid: 7 square-ish columns, Sunday first and printed red; weeks ruled with hairlines; today is a filled ink square.
- Touch targets ≥ 44px below 1024px.

## Elevation & Depth

Flat paper. Surfaces separate by tone (paper → sheet → shade) and 1px rules, never by shadow. One shadow exists, `shadow-overlay` (`0 16px 40px -12px rgb(0 0 0 / 0.22), 0 2px 6px rgb(0 0 0 / 0.06)`), for dialogs, sheets, menus, popovers, and toasts. Scrims are ink at 40% (light) / 60% (dark), no blur.

## Shapes

- Radii: 4px tags and day marks' square variants, 6px controls, 8px panels and dialogs, full circle only for avatars and ring marks.
- Borders are 1px. Emphasis comes from weight, size, and ink — never from thick colored side borders.
- Marks (`DayMark`): pen circle (slightly irregular ellipse, 1.75px stroke) = due; check stroke = paid; dashed ring = SOA missing; dotted ring = expected; filled square = today.

## Components

- **Button:** primary (ballpen fill), secondary (sheet + rule-strong border), ghost, danger, link. 40px default, 36px small, 44px on touch layouts. Loading keeps the label and shows a spinner in place of the icon. Press = 1px translate, no scale.
- **Tag (status):** 22px tall, 4px radius, wash fill + full-color text + optional mark glyph.
- **Panel:** sheet fill, 1px rule, 8px radius, no shadow. Never nested inside another panel.
- **Ledger:** label/value rows with a dotted leader on wide layouts; values in numerals. Replaces stat-card strips.
- **Row (bill / statement / card):** ruled list item, 16px padding, card chip at left, date numeral + mark, amounts right-aligned, one primary action, the rest in a menu.
- **Tabs:** text tabs with a 2px ink underline on the active tab; segmented control for 2–3 view switches.
- **Inputs:** 40px, 6px radius, rule-strong border, ballpen focus ring (2px, 2px offset).
- **Dialogs:** dialog ≥ 640px; bottom sheet below 640px (`ResponsiveDialog`). Title left-aligned, footer actions right-aligned (stacked full-width on phone).
- **Skeletons:** shade blocks in the exact shape of the final content; a slow 1.6s opacity pulse, off under reduced motion.
- **Motion:** 120–200ms ease-out for state; month change slides the sheet up 8px with fade (180ms); Mark paid draws the check stroke (320ms). Reduced motion: instant.

## Do's and Don'ts

Do:

- Lead every screen with what the user owes next.
- Put the date and the amount in numerals; let them be the biggest things on a row.
- Use ballpen blue only for things the user can do or has done.
- Keep copy to labels, data, and actions.

Don't:

- Don't use gradients, glow, glass, or colored drop shadows.
- Don't build hero-metric strips (icon tile + big number + label) or icon-tile feature cards.
- Don't add tracked uppercase eyebrows over sections; the month name is the only uppercase headline.
- Don't use red or green as category colors.
- Don't nest panels or put a modal where an inline control works.
