# Design system — greenfield rebuild

Status: **canonical for the new application** (see [rebuild README](./README.md))  
Source: <https://atomiq-pi.vercel.app/> plus three app screenshots supplied by the product owner  
Target: **new Kame Finance app** — implement tokens and components from day one (not a incremental patch on legacy amber SaaS)

**Current production UI** still follows [product/design-system.md](../product/design-system.md) (DM Sans / Sora, soft shadows). Use **this** document when building the replacement.

Implementation phases in §5 originally described migrating `apps/web`; for a greenfield build, treat Phases 1–3 as foundation, Phase 4 as screen build order, and skip “dual token coexistence” unless you temporarily share components with the old app.

---

## 1. Purpose

Replace the current amber-SaaS visual language (soft multi-layer shadows, DM Sans + Sora, `--radius: 0.75rem`)
with the AtomIQ "playful depth" language, without a big-bang rewrite. The work lands as:

1. A documented, auditable design system derived from the real AtomIQ CSS (not eyeballed from screenshots).
2. A token + utility layer in `globals.css` / `tailwind.config.ts` that coexists with the current tokens.
3. Additive component variants so screens migrate one at a time.

## 2. Decisions locked

| Decision | Choice | Rationale |
| --- | --- | --- |
| Rollout | Document + token layer now, migrate components incrementally | Avoids breaking every screen at once |
| Typeface | Nunito (UI/body) + Baloo 2 (display) | Open substitutes for AtomIQ's licensed `SunghyunSans`; rounded terminals, weights to 800/900 |
| Themes | Light **and** dark | `.cursor/rules/13-ui-ux-design.mdc` makes dark mode non-negotiable |
| Third-party assets | Do not copy | AtomIQ's mascot, prop illustrations, and font are their IP — we copy the *system*, not the files |

## 3. Source of truth

AtomIQ is a Vite app shipping two hand-written stylesheets — no Tailwind, no CSS-in-JS — so the system is
recoverable exactly rather than inferred.

| File | Size | Contains |
| --- | --- | --- |
| `/assets/index-BnDgjE20.css` | 5.8 KB | `:root` tokens, five `@font-face` declarations, nav, global reveal animation, base resets |
| `/assets/routes-BNK3m1k6.css` | 41 KB | Every section component, 22 `@keyframes`, the six accent families, all responsive rules |

Declared `:root`:

```css
:root {
  --brand: #ff9600;
  --brand-dark: #e08600;
  --ink: #4b4b4b;
  --muted: #777;
  --card-border: #e5e5e5;
  --card-hover: #fff4e5;
}
```

Everything below cites the rule it came from. Frequency counts are from the full stylesheet.

---

## 4. The system

### 4.1 Aesthetic thesis

A **physical, pressable surface**. Every interactive element is a slab sitting a few pixels above the page:
2px solid border, hard (blur-free) offset shadow underneath, and a press state that drops the element onto its
own shadow. No blur, no gradients on controls, no glassmorphism.

```css
/* the one pattern the whole system derives from */
.explore-card { border: 2px solid #e5e5e5; border-radius: 24px; box-shadow: 0 4px #e5e5e5; }

.nav-cta {
  background: #ff9600;
  box-shadow: 0 4px 0 #e08600;
  border-radius: 999px;
  text-transform: uppercase;
  font-weight: 800;
  letter-spacing: .06em;
  transition: transform .1s cubic-bezier(.23,1,.32,1),
              box-shadow .1s cubic-bezier(.23,1,.32,1),
              filter .15s;
}
.nav-cta:hover  { filter: brightness(1.05); }
.nav-cta:active { transform: translateY(4px); box-shadow: 0 0 0 #e08600; }
```

The `translateY` distance always equals the shadow offset — that is what sells the physicality. Confirmed
across five independent rules: `.challenge-btn:active`, `.explore-core__cta:active`, `.shrodi-modal__cta:active`
(all `4px`), `.final-footer__top-btn:active` (`3px`), `.intro-arrow:active` (`1px`).

### 4.2 Color primitives

| Hex | HSL | Role in source | Proposed token |
| --- | --- | --- | --- |
| `#ff9600` | `35 100% 50%` | `--brand`, CTA fills | `--ai-orange-500` |
| `#e08600` | `36 100% 44%` | `--brand-dark`, nav CTA depth | `--ai-orange-600` |
| `#ff8a1a` | `29 100% 55%` | Hero highlight, active dot, feature accent | `--ai-orange-450` |
| `#b96a00` | `34 100% 36%` | Depth under brand buttons | `--ai-orange-700` |
| `#ffcf6b` | `41 100% 71%` | Badge on dark surfaces | `--ai-orange-300` |
| `#fff4e5` | `35 100% 95%` | `--card-hover`, warm wash | `--ai-cream-100` |
| `#fff7ec` | `35 100% 96%` | Section wash | `--ai-cream-50` |
| `#f3ede4` | `36 38% 92%` | Warm neutral divider | `--ai-sand-200` |
| `#111111` | `0 0% 7%` | All headings | `--ai-ink-900` |
| `#4b4b4b` | `0 0% 29%` | `--ink`, body copy | `--ai-ink-700` |
| `#777777` | `0 0% 47%` | `--muted`, secondary copy | `--ai-ink-500` |
| `#52525b` | `240 5% 34%` | Eyebrow label text | `--ai-ink-600` |
| `#e5e5e5` | `0 0% 90%` | `--card-border` **and** the default depth color | `--ai-line-200` |
| `#f0f0f0` | `0 0% 94%` | Floating-chip border | `--ai-line-100` |
| `#f1f1f1` | `0 0% 95%` | Progress track | `--ai-line-50` |
| `#fbfbfb` | `0 0% 98%` | Raised panel fill | `--ai-surface-50` |
| `#171226` | `255 36% 11%` | Dark section canvas | `--ai-night-900` |
| `#232326` | `240 4% 14%` | Dark chip surface | `--ai-night-800` |
| `#3a3a3f` | `240 4% 24%` | Dark chip border | `--ai-night-700` |

`#e5e5e5` doing double duty as both border and shadow is the single most load-bearing value in the system —
59 occurrences, more than any other color.

### 4.3 Accent families

Six triplets, declared as local custom properties on modifier classes:

```css
.intro-feature--orange { --feature-accent:#ff8a1a; --feature-bg:#fff4e5; --feature-accent-soft:#f3d9b5 }
.intro-feature--blue   { --feature-accent:#3b9be9; --feature-bg:#eef6fe; --feature-accent-soft:#c4e0f7 }
.intro-feature--green  { --feature-accent:#22c55e; --feature-bg:#ecfdf3; --feature-accent-soft:#bbe9cd }
.intro-feature--purple { --feature-accent:#8b5cf6; --feature-bg:#f3eefd; --feature-accent-soft:#d9cbf9 }
.intro-feature--pink   { --feature-accent:#ec4899; --feature-bg:#fdeef5; --feature-accent-soft:#f6c6dd }
.intro-feature--red    { --feature-accent:#e85d5d; --feature-bg:#fdeeee; --feature-accent-soft:#f6c9c9 }
```

Usage contract: `--feature-bg` is the fill, `--feature-accent` is the 2px border and icon color,
`--feature-accent-soft` is the depth shadow. Consumed as
`box-shadow: 0 4px 0 var(--feature-accent-soft)`.

HSL for the token layer:

| Family | accent | bg | soft |
| --- | --- | --- | --- |
| orange | `29 100% 55%` | `35 100% 95%` | `35 72% 83%` |
| blue | `207 80% 57%` | `210 89% 96%` | `207 76% 87%` |
| green | `142 71% 45%` | `145 81% 96%` | `143 51% 82%` |
| purple | `258 90% 66%` | `260 79% 96%` | `258 79% 89%` |
| pink | `330 81% 60%` | `332 79% 96%` | `331 73% 87%` |
| red | `0 75% 64%` | `0 79% 96%` | `0 71% 88%` |

These map cleanly onto our existing `--chart-1..8` slots and onto category coloring for credit-card issuers.

### 4.4 Semantic token map

Light values come straight from the source. **Dark values are derived from the site's own dark section**
(`.challenge`, background `#171226`) rather than invented — it is the one place AtomIQ shows how the
depth system behaves on a dark canvas.

| Token | Light | Dark | Dark evidence |
| --- | --- | --- | --- |
| `--background` | `35 100% 99%` | `255 36% 11%` | `.challenge{background:#171226}` |
| `--card` | `0 0% 100%` | `240 4% 14%` | `.challenge-eyebrow{background:#232326}` |
| `--foreground` | `0 0% 7%` | `0 0% 100%` | `.challenge{color:#fff}` |
| `--muted-foreground` | `0 0% 47%` | `0 0% 75%` | `.challenge-sub{color:#ffffffbf}` |
| `--border` | `0 0% 90%` | `240 4% 24%` | `.challenge-eyebrow{border:2px solid #3a3a3f}` |
| `--primary` | `35 100% 50%` | `41 100% 71%` | `.challenge-mascot__badge{background:#ffcf6b}` |
| `--depth-neutral` | `0 0% 90%` | `0 0% 0%` | `.challenge-eyebrow{box-shadow:0 3px #000}` |
| `--shadow-press` | `34 100% 36%` | `28 90% 26%` | derived (keeps the same L delta from `--primary`) |

Critical dark-mode rule: **hard shadows must stay opaque**. On dark surfaces AtomIQ switches the depth color
to pure black (`0 3px #000`) rather than lightening it. Semi-transparent depth (`#00000059`) is used only for
white cards floating on the dark canvas (`.challenge-card{box-shadow:0 8px #00000059}`).

### 4.5 Depth scale

| Token | Value | Used by |
| --- | --- | --- |
| `depth-xs` | `0 1px 0` | `.intro-arrow` pressed state |
| `depth-sm` | `0 3px 0` | Eyebrow chips, icon buttons, nav toggle (8 uses) |
| `depth-md` | `0 4px 0` | **Default.** Buttons, cards, FAQ items, feature cards (7 + 3 brand uses) |
| `depth-lg` | `0 5px 0` – `0 6px 0` | Raised panels, `.explore-core` |
| `depth-xl` | `0 8px 0` | Quiz card, correct/wrong result states |
| `depth-2xl` | `0 12px 0` | Hero-level slabs |
| `depth-none` | `0 0 0` | Pressed state |

Two blurred shadows also exist, reserved for **floating** (not pressable) chrome:
`0 2px 12px #0000000f` on `.hero-badge` / `.hero-counter`, and `0 14px 30px #8b5cf624` layered *under* a hard
shadow on the open FAQ item.

State semantics:

| State | Treatment |
| --- | --- |
| Default | Border + depth at rest |
| Hover | `filter: brightness(1.05)` — depth unchanged, no lift |
| Active | `translateY(<depth>)` + `depth-none`, over `.1s` |
| Selected | Border and depth swap to the accent color (`.faq-item--open{border-color:#8b5cf6;box-shadow:0 4px #8b5cf6,0 14px 30px #8b5cf624}`) |
| Correct / wrong | Depth only swaps color (`0 8px #22c55e` / `0 8px #ef4444`) — geometry never moves |

### 4.6 Typography

AtomIQ self-hosts `SunghyunSans` at weights 400/500/600/700/800 with the fallback stack
`ui-rounded, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`.

We substitute **Nunito** (UI/body, must load through 800) and **Baloo 2** (display). Keep the existing
`--font-sans` / `--font-display` variable names so `tailwind.config.ts` needs no font changes.

Weight distribution in the source is extreme and deliberate: **800 appears 44 times, 700 three times, 600 seven
times.** There is effectively no 400/500 in UI chrome — the system is all-bold.

| Role | Size | Weight | Tracking | Leading | Source |
| --- | --- | --- | --- | --- | --- |
| Hero | `clamp(2.4rem, 6vw, 3.6rem)` | 800 | `-.02em` | 1.05 | `.hero-title` |
| Section title (lg) | `clamp(2rem, 4.5vw, 2.9rem)` | 800 | `-.02em` | 1.08 | `.explore-title`, `.challenge-title` |
| Section title (md) | `clamp(1.9rem, 4vw, 2.6rem)` | 800 | `-.02em` | 1.1 | `.faq-title` |
| Section title (sm) | `clamp(1.65rem, 3vw, 2.3rem)` | 800 | `-.02em` | 1.1 | `.intro-title` |
| Statement | `clamp(1.4rem, 3vw, 1.9rem)` | 800 | `-.01em` | 1.3 | `.challenge-card__statement` |
| Card title | `1.08rem` – `1.25rem` | 800 | — | — | `.explore-card__title`, `.intro-feature__title` |
| Body | `0.92rem` – `0.98rem` | 400 | — | 1.55 – 1.6 | `.explore-card__text`, `.challenge-explain` |
| Lead | `0.95rem` | 400 | — | 1.5 | `.hero-sub` |
| Button label | `0.82rem` – `0.95rem` | 800 | `.06em` | — | `.challenge-btn`, `.explore-core__cta` |
| Eyebrow | `0.72rem` | 800 | `.16em` | 1 | `.intro-eyebrow`, `.explore-eyebrow` |
| Chip | `0.85rem` | 600 | — | — | `.hero-badge`, `.hero-counter` |

Two label treatments that define the voice:

- **Button label** — `text-transform: uppercase; font-weight: 800; letter-spacing: .06em`
- **Eyebrow** — `text-transform: uppercase; font-weight: 800; letter-spacing: .16em; line-height: 1`, wrapped in
  a pill with `padding: 9px 16px`, 2px border, and `depth-sm`

Highlight treatment for hero emphasis words:

```css
.hero-highlight { color:#fff; background:#ff8a1a; border-radius:14px; padding:0 14px 4px;
                  display:inline-block; transform:rotate(-1deg) }
```

The rotation alternates by section (`-1deg` hero and final, `+1deg` explore) and the accent changes with the
section family — a cheap, high-personality device worth keeping.

### 4.7 Radius

Frequency-ranked from the source:

| Token | Value | Count | Applies to |
| --- | --- | --- | --- |
| `pill` | `999px` | 28 | Buttons, chips, eyebrows, badges, progress tracks, nav |
| `circle` | `50%` | 13 | Avatars, icon dots, FAQ icon, mascot rings |
| `card` | `24px` | 7 | Standard cards, nav dropdown |
| `card-lg` | `28px` | 4 | Elevated/primary cards |
| `panel` | `20px` | 3 | FAQ items, feature cards |
| `control` | `14px` | 5 | Inputs, nav toggle, highlight pill |
| `chip` | `12px` | 2 | Logo tile, small tags |
| `hero` | `36px` | 1 | `.explore-core` centerpiece |

Everything pressable is either `pill` or `control`. Nothing in the system uses a radius below `12px` except
the `3px` progress-bar inner and `4px`/`8px` incidentals.

### 4.8 Spacing & layout

4px base unit. Observed rhythm:

- **Gaps**: `8px` (13 uses, dominant) › `12px` › `16px` › `20px` › `24px` › `28px` › `32px` › `48px`
- **Control padding**: `9px 16px` (eyebrow/chip, 6 uses), `7px 14px`/`8px 16px` (small chip), `12px 26px` (CTA),
  `15px 18px` (large CTA), `10px 22px` (nav CTA)
- **Card padding**: `22px 20px` (standard), `18px 20px` (compact), `28px 28px 24px` (elevated), `30px 24px 26px` (hero panel)
- **Section padding**: `96px 20px` desktop, `64px 16px 80px` mobile
- **Content widths**: `max-width: 1080px` inner, `min(720px, 100%)` nav, `440px` hero lead, `48ch` section lead

Breakpoints are max-width and irregular — they are per-component, not a global scale:

| Query | Count | Purpose |
| --- | --- | --- |
| `(width<=900px)` | 4 | Grid collapse |
| `(width<=420px)` | 6 | Small-phone type/padding |
| `(width<=720px)` | 2 | Nav switches to hamburger |
| `560 / 620 / 700 / 800 / 960` | 1 each | Per-section reflow |
| `(hover:hover) and (pointer:fine)` | 1 | Hover-only affordances |
| `(prefers-reduced-motion:reduce)` | 12 | Motion opt-out at every component |

**We keep Tailwind's standard breakpoints** and treat AtomIQ's as evidence of intent (collapse grids ~900px,
tighten type ~420px), not as values to copy.

### 4.9 Motion

Two easing curves carry the whole system:

```css
--ease-pop:    cubic-bezier(.23, 1, .32, 1);      /* presses, reveals, CTAs */
--ease-spring: cubic-bezier(.2, .9, .28, 1.25);   /* accordions, overshoot */
```

Durations: press `.1s` · color/hover `.15s` · accordion `.22s`–`.38s` · reveal `.7s` · ambient float `7s`.

22 named keyframes, grouped by purpose:

| Group | Keyframes | Notes |
| --- | --- | --- |
| Entrance | `reveal-up`, `intro-feature-in`, `nav-menu-in`, `prop-blast`, `mascot-pop`, `rays-in` | `reveal-up` is the global one |
| Ambient | `hero-float`, `explore-float`, `mascot-idle`, `mascot-breathe`, `ring-spin`, `shrodi-modal-float` | Infinite, 3s–7s, ±5–10px |
| Feedback | `press-pop`, `counter-pop`, `counter-pulse`, `final-counter-pop`, `final-counter-shimmer` | Fire on interaction/value change |
| Character | `mascot-cheer`, `mascot-gasp` | Emotion-driven, one-shot |
| Progress | `intro-progress`, `team-leader-glow`, `shrodi-modal-fade`, `shrodi-modal-pop` | — |

The global reveal is worth porting verbatim:

```css
.reveal .reveal-child { opacity: 0; translate: 0 28px; }
.reveal.is-visible .reveal-child {
  opacity: 1;
  translate: 0;
  animation: .7s cubic-bezier(.2,.9,.28,1.1) backwards reveal-up;
  animation-delay: calc(var(--i, 0) * .11s);
  will-change: opacity, translate;
}
@media (prefers-reduced-motion: reduce) {
  .reveal .reveal-child, .reveal.is-visible .reveal-child { opacity: 1; animation: none; translate: 0; }
}
```

Every animated component ships its own `prefers-reduced-motion` block — 12 separate ones. We already have a
global reduced-motion override in `globals.css`, so ported utilities inherit it.

### 4.10 Component specs

#### Button — primary

| Property | Default | Hover | Active | Disabled |
| --- | --- | --- | --- | --- |
| Background | `--primary` | `brightness(1.05)` | `--primary` | `--muted` |
| Depth | `0 4px 0 --shadow-press` | unchanged | `0 0 0` | none |
| Transform | none | none | `translateY(4px)` | none |
| Radius | `pill` | — | — | — |
| Label | uppercase, 800, `.06em`, `0.82`–`0.95rem` | — | — | — |
| Padding | `12px 26px` (md), `15px 18px` (lg) | — | — | — |
| Transition | `transform .1s --ease-pop, box-shadow .1s --ease-pop, filter .15s` | | | |

#### Button — secondary / ghost

`.challenge-btn--ghost{color:#4b4b4b;background:#fff;border:2px solid #e5e5e5;box-shadow:0 4px #e5e5e5}` —
same geometry and press behavior, neutral depth.

Semantic button variants keep the pattern and only change the pair:
`--myth` red `#ef4444` / `#b91c1c`, `--fact` blue `#3b9be9` / `#1d6fb8`, `--next` brand `#ff9600` / `#b96a00`.
The depth color is always a darker shade of the fill, never black.

#### Card

| Variant | Fill | Border | Depth | Radius | Padding |
| --- | --- | --- | --- | --- | --- |
| Standard | `#fff` | `2px #e5e5e5` | `0 4px #e5e5e5` | `24px` | `22px 20px` |
| Feature | `--feature-bg` | `2px --feature-accent` | `0 4px --feature-accent-soft` | `20px` | `18px 20px` |
| Elevated | `#fff` | `2px #fff` | `0 8px #00000059` | `28px` | `28px 28px 24px` |
| Panel | `radial-gradient(circle at 50% 22%, #ff8a1a29, #0000 62%), #fbfbfb` | `2px #e5e5e5` | `0 6px #e5e5e5` | `36px` | `30px 24px 26px` |

Icon tile inside a card: `46 × 46px`, `border-radius: 15px`, `margin-bottom: 14px`.

#### Eyebrow / chip

```css
letter-spacing:.16em; text-transform:uppercase; color:#52525b; background:#fff;
border:2px solid #e5e5e5; border-radius:999px; padding:9px 16px; gap:8px;
font-size:.72rem; font-weight:800; line-height:1; box-shadow:0 3px #e5e5e5;
```

Dark variant swaps to `#232326` fill, `#3a3a3f` border, `#e4e4e7` text, `0 3px #000` depth.

Floating chip (`.hero-badge`, `.hero-counter`) is the exception that uses a **blurred** shadow:
`border:2px solid #f0f0f0; box-shadow:0 2px 12px #0000000f; font-weight:600`.

#### Accordion

| State | Border | Depth | Icon |
| --- | --- | --- | --- |
| Closed | `2px #e5e5e5` | `0 4px #e5e5e5` | `32px` circle, `#f1eafd` fill, `#8b5cf6` glyph |
| Open | `2px #8b5cf6` | `0 4px #8b5cf6, 0 14px 30px #8b5cf624` | rotated, `.32s --ease-spring` |

Content height animates via `transition: grid-template-rows .38s --ease-pop` — worth copying, it avoids
`max-height` guessing. Question row: `padding:18px 20px; font-size:1rem; font-weight:800; gap:16px`.

#### Progress

Track `background:#f1f1f1; border-radius:999px; height:4px; width:min(220px,70%); overflow:hidden`.
Fill animates `transform: scaleX(0 → 1)`. Step dots: `10px` circles, `#e5e5e5` inactive,
`#ff8a1a` + `scale(1.25)` active, `gap: 6px`.

#### Result / verdict badge

`padding:8px 16px; border-radius:999px; font-size:.85rem; font-weight:800; letter-spacing:.04em`
— correct `#15803d` on `#dcfce7`, wrong `#b91c1c` on `#fee2e2`.

### 4.11 Mobile app patterns

From the supplied screenshots. These are the patterns to reproduce, not pixel measurements — the web CSS
supplies the exact geometry and the app is visibly the same system.

| Pattern | Spec |
| --- | --- |
| Tab bar | Floating white pill, full-width minus gutters, 5 icon slots, active item marked by a small orange triangle below the icon, hard depth beneath the bar |
| Greeting header | Warm cream card, 2px border, mascot avatar left, uppercase micro-label above the name, XP/streak/notification chips right-aligned |
| Stat chip | Dark pill with icon + number (`⚡ 0`), also appears as a small orange-bordered counter |
| Lesson path | Vertically snaking dashed connector between circular nodes; states are locked (grey, flat), active (orange, raised, `START` pill above), complete |
| Content card grid | 2-column, image top with bookmark toggle, uppercase category kicker in accent color, 800-weight title clamped to 2 lines, muted source line |
| Filter row | Horizontally scrolling pill row; active pill is solid orange, rest are white with 2px border |
| Quiz option | 2-column grid of white cards with icon + label; selected gets orange 2px border, orange glyph, and an accent dot |
| Primary CTA | Full-width amber pill, uppercase 800 label, hard depth — the `CHECK` button |
| Search field | Full-width pill, 2px border, leading icon, muted placeholder |
| Section list | Grouped rounded cards with an icon tile left, title + sub, chevron right |

Mapping onto our product: filter pills → credit-card status filters, content card grid → SOA runs,
lesson path → automation run timeline, quiz option grid → mark-paid confirmation choices,
stat chips → due totals.

### 4.12 Assets & IP

| Asset | Origin | Action |
| --- | --- | --- |
| `SunghyunSans` woff2 ×5 | Licensed by AtomIQ | **Do not copy.** Use Nunito + Baloo 2 |
| `/mascot.svg`, `/images/mascot/*.png` | AtomIQ's character "Shrodi" | **Do not copy.** If we want a mascot, commission one around the Kame turtle |
| `/images/*.svg` isometric props | AtomIQ artwork | **Do not copy.** Document the style: isometric, soft 3D, chunky outlines, pastel-on-white |
| `/images/mockup/*.webp`, `/images/team/*.webp` | Product/team photography | Not applicable |

What we *do* take: the light-rays background device
(`conic-gradient` of alternating warm/cool wedges behind the hero, radially masked, faded in at `opacity: .95`),
the orbit-ring motif, and the mascot *state* vocabulary (idle / breathe / cheer / gasp) as an animation spec
for whatever character we use.

### 4.13 Accessibility

Points where the source needs correcting rather than copying:

- **Contrast**: `#777` on `#fff` is 4.48:1 — marginally under AA for body text. Our `--muted-foreground`
  should be `0 0% 45%` (4.8:1) instead of `0 0% 47%`.
- **Focus**: the source relies on `:active` and has no visible `:focus-visible` ring. We keep our existing
  `.focus-ring` utility and add it to every chunky variant.
- **Touch targets**: eyebrow chips at `9px 16px` + `0.72rem` land near 34px tall. Interactive chips need a
  min-height of 44px; decorative ones can stay small.
- **Uppercase labels**: screen readers handle CSS `text-transform` fine, but keep the underlying text in
  sentence case in the DOM.
- **Motion**: preserve the per-component reduced-motion behavior; ambient float and mascot animations must
  fully stop, not just shorten.

---

## 5. Implementation phases

### Phase 0 — Verify the extraction

Run [`arvindrk/extract-design-system`](https://github.com/arvindrk/extract-design-system) against the live
site and diff its `normalized.json` against section 4:

```bash
npx playwright install chromium
npx extract-design-system https://atomiq-pi.vercel.app/ --extract-only
```

This is a cross-check only; its output is not committed. Fallback if we later want DTCG/Figma/shadcn emitters:
[`Manavarya09/design-extract`](https://github.com/Manavarya09/design-extract).

### Phase 1 — Token layer

**`apps/web/src/app/globals.css`** — add inside the existing `:root` and `.dark`, keeping every current
semantic token name so nothing breaks:

```css
:root {
  --primary: 35 100% 50%;
  --primary-deep: 36 100% 44%;
  --accent-bright: 29 100% 55%;
  --shadow-press: 34 100% 36%;
  --depth-neutral: 0 0% 90%;
  --border: 0 0% 90%;
  --muted-foreground: 0 0% 45%;
  --radius: 1.25rem;
  --ease-pop: cubic-bezier(.23, 1, .32, 1);
  --ease-spring: cubic-bezier(.2, .9, .28, 1.25);
}
.dark {
  --primary: 41 100% 71%;
  --shadow-press: 28 90% 26%;
  --depth-neutral: 0 0% 0%;
  --background: 255 36% 11%;
  --card: 240 4% 14%;
  --border: 240 4% 24%;
}
```

Plus the six accent families as `--feature-{name}-{accent|bg|soft}` triplets, and new utilities:
`.press-depth` (the translate + shadow-collapse pair), `.reveal` / `.reveal-child` with the `--i` stagger,
`.highlight-slab` (rotated accent pill), `float-soft`, `pop-in`, `ring-spin`.

Deprecate in the doc but keep in code until migration completes: `shadow-soft-*`, `glow-*`, `gradient-hero`,
`gradient-mesh`, `glass`, `glass-card`.

**`apps/web/tailwind.config.ts`** — extend, never replace:

```ts
boxShadow: {
  "depth-sm":     "0 3px 0 hsl(var(--depth-neutral))",
  depth:          "0 4px 0 hsl(var(--depth-neutral))",
  "depth-lg":     "0 6px 0 hsl(var(--depth-neutral))",
  "depth-xl":     "0 8px 0 hsl(var(--depth-neutral))",
  "depth-brand":  "0 4px 0 hsl(var(--shadow-press))",
  "depth-none":   "0 0 0",
  "float-chip":   "0 2px 12px rgb(0 0 0 / 0.06)",
},
borderRadius: { pill: "999px", card: "24px", "card-lg": "28px", panel: "20px", control: "14px", chip: "12px" },
transitionTimingFunction: { pop: "cubic-bezier(.23,1,.32,1)", spring: "cubic-bezier(.2,.9,.28,1.25)" },
```

Plus keyframes `reveal-up`, `float-soft`, `pop-in`, `press-pop`, `ring-spin`.

**`apps/web/src/lib/fonts.ts`** — swap `DM_Sans`/`Sora` for `Nunito`/`Baloo_2`, keeping the
`--font-sans` / `--font-display` variable names:

```ts
export const fontSans = Nunito({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
export const fontDisplay = Baloo_2({ subsets: ["latin"], variable: "--font-display", display: "swap" });
```

### Phase 2 — Component variants (additive)

Add to the existing `cva` blocks; do not edit current variants.

`apps/web/src/components/ui/button.tsx`:

```ts
chunky: "bg-primary text-primary-foreground rounded-pill uppercase tracking-[0.06em] font-extrabold \
  shadow-depth-brand transition-[transform,box-shadow] duration-100 ease-pop \
  hover:brightness-105 active:translate-y-1 active:shadow-depth-none",
"chunky-outline": "border-2 border-border bg-card text-foreground rounded-pill uppercase \
  tracking-[0.06em] font-extrabold shadow-depth transition-[transform,box-shadow] duration-100 ease-pop \
  active:translate-y-1 active:shadow-depth-none",
```

Same treatment for:

| Component | Addition |
| --- | --- |
| `card.tsx` | `variant="chunky" \| "feature" \| "elevated"` |
| `badge.tsx` | `variant="eyebrow"` (uppercase, `.16em`, `shadow-depth-sm`) and `variant="chip"` |
| `tabs.tsx` | Pill track with solid-orange active pill |
| `input.tsx` | 2px border, `rounded-control`, no inner shadow |
| `skeleton.tsx` | `rounded-panel`, warm shimmer |
| New `ProgressDots.tsx` | The `10px` dot row with active scale |
| New `StatChip.tsx` | Icon + value pill, light and dark surfaces |

### Phase 3 — Preview route

`apps/web/src/app/(dev)/design-system/page.tsx` — every token, depth level, accent family, and component state
rendered side by side in light and dark. This is the review surface before any real screen changes, and the
regression check afterwards.

### Phase 4 — Screen migration

Order chosen by blast radius, lowest first:

1. Auth (`AuthPageShell`, login) — few components, high visual payoff
2. Shared chrome — `DashboardPageHeader`, sidebar, empty/error states
3. Credit cards list + detail — the densest data screens, validates cards/badges/tables
4. Reminders, automations, integrations
5. Settings, receipts, analytics (chart palette moves to the accent families)

### Phase 5 — Doc sync

Per `.cursor/rules/16-docs-sync.mdc`:

- After cutover, merge sections 4.1–4.13 into [`docs/product/design-system.md`](../product/design-system.md) and point product README at the merged doc
- Add the `/design-system` preview route to the **new** app’s inventory doc (and [`application-inventory.md`](../reference/application-inventory.md) if this repo remains the doc home)
- Update the color/typography/shadow examples in `.cursor/rules/13-ui-ux-design.mdc`
- Update `.cursor/skills/frontend-design/SKILL.md` and `.cursor/skills/ui-design/SKILL.md` — both currently
  name DM Sans + Sora and the amber/orange SaaS palette

---

## 6. Verification

| Check | How |
| --- | --- |
| Token parity | Diff `globals.css` values against the section 4.2 table |
| Both themes | Preview route reviewed in light and dark |
| Contrast | `--muted-foreground` and all accent-on-fill pairs ≥ 4.5:1 |
| Press behavior | `translateY` distance equals depth offset on every chunky variant |
| Reduced motion | Ambient animations fully stop with the OS setting on |
| Touch targets | Interactive chips ≥ 44px tall |
| No regressions | Unmigrated screens still render — old utilities untouched |
| Build | `bun run lint`, `bun run type-check`, `bun run build` |

## 7. Risks and open questions

| Item | Note |
| --- | --- |
| Tonal fit | A Duolingo-style language on a finance product is a deliberate bet. The preview route is the checkpoint to confirm it before Phase 4 |
| Dark mode is derived | Only one dark section exists in the source; our dark palette is an extrapolation and needs a real review pass |
| Font match | Nunito is close but not identical to SunghyunSans. Fredoka is the alternate if Nunito reads too soft at 800 |
| Density | AtomIQ is a marketing site with generous spacing; dashboard tables need a tighter variant of the same system |
| Mascot | Open — do we want a Kame character, and if so who makes it? |
| Dual token sets | Old and new utilities coexist during migration; Phase 5 must actually delete the deprecated ones |
