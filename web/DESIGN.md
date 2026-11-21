# SentinelDesk design system

The one source of truth for how SentinelDesk looks and behaves. Read it before building a page.

- Live reference: `/design` (tokens and components), `/references` (four rough explorations)
- Tokens: `app/globals.css` · Components: `components/ui` (shadcn) and `components/sentinel` (ours)
- AI agents: use the `sentinel-ui` skill in `/.claude/skills/sentinel-ui` (Codex: `/.agents/skills`)

## Direction

**Calm, sparse and evidence-first.** The overall look comes from reference D (Copilot Canvas),
the charts from C (Ops Observatory) and the font from A (Command Center).

1. **Less text.** If a number, badge or icon can say it, don't write a sentence. See "Copy" below.
2. **Whitespace over borders.** Group with spacing first, a 1px border second, never a shadow.
3. **Color means something.** Neutrals do the layout; color appears only for status and AI output.
4. **Show the evidence.** Every AI claim links to the past ticket it came from.

## Brand

**Logo: the architect desk lamp.** The lamp is solid ink; its light is the AI gradient. Read it
as "a desk that sheds light on every answer".

| Use | Asset |
|---|---|
| In the app | `<Logo />` (tile, inverts with the theme), `<Logo variant="mark" />` (lamp only, `currentColor`), `<Wordmark />` (tile + "SentinelDesk") from `components/sentinel/logo` |
| Favicon | `app/icon.svg` (dark tile; Next.js serves it automatically) |
| Slides, docs, Devpost | `public/brand/logo-light.svg` (white tile), `logo-dark.svg` (black tile), `mark.svg` |

- Tile background is only black or white. Never put the gradient on the tile or the lamp body.
- The beam is the only gradient in the logo; don't recolor, rotate or animate it.
- Minimum size 16px. Keep clear space of a quarter of the tile width around it.
- The logo is the brand. `AIMark` (gradient tile with a pen) only marks AI-generated content.

## Stack

**Next.js (App Router) + shadcn/ui + Tailwind CSS v4.** Not plain CSS.

| Need | Use |
|---|---|
| Styling | Tailwind utilities in JSX. Plain CSS only for tokens and the `ai-surface` utility in `globals.css`. No CSS modules, no `style={}` except truly dynamic values |
| Components | shadcn/ui (Radix) in `components/ui`. Add more with `pnpm dlx shadcn@latest add <name>`. You own the code; edit variants there instead of wrapping |
| Icons | `lucide-react` only. No emoji, no text glyphs as icons |
| Charts | shadcn `chart` (Recharts) inside `ChartContainer`. Patterns: `app/references/c/charts.tsx` |
| Fonts | Manrope (UI), Google Sans Code (ticket IDs, numbers, latency) |
| Theme | `next-themes`, light and dark. Every token has both values |
| Data | `lib/types.ts` mirrors `shared/contracts.py` and `pipeline.run()`. Fixtures in `lib/mock.ts` |

## Copy

Clutter is the main risk for this product: tickets, drafts and evidence are already a lot of text.

- Labels are 1–3 words. Buttons are a verb plus an object: "Approve and send", "Page on-call".
- No helper paragraphs, no "This panel shows…" sentences, no restating what a badge already says.
- Numbers over words for counts and time: `1.6 s`, `3 precedents`, not sentences.
- Confidence shows as a tier, not a raw score: Confident (≥0.85), Likely (≥0.70), Ambiguous
  (<0.70, ask a clarifying question). `ConfidenceMeter` does this; `showValue` only on eval views.
- Escalation reasons: one short line each, at most three visible; the rest behind "More".
- Long content (ticket body, past answers, incident brief) is truncated to 2–3 lines with an expand.
- Secondary detail goes in a hover card, tooltip or tab, not on the page by default.
- One empty-state sentence and one action. No marketing copy anywhere.

## Color ("Dusk")

| Meaning | Tokens (Tailwind) | Use for |
|---|---|---|
| Critical (red) | `bg-critical-tint text-critical-fg`, `bg-critical` | High priority, escalate, invalid citation |
| Caution (amber) | `bg-warning-tint text-warning-fg`, `bg-warning` | Medium priority, low confidence, unsupported sentence |
| Safe (green) | `bg-success-tint text-success-fg`, `bg-success` | Low priority, auto-draft ready, supported sentence |
| Action / info (blue) | `bg-primary`, `bg-info-tint text-info-fg` | Primary buttons, links, focus, selection |
| AI (gradient) | `ai-surface`, `<AIMark />`, `bg-(image:--ai-gradient)` | Only content the model generated |

- AI gradient runs coral → rose → violet → blue (`--ai-coral|rose|violet|blue`). It appears only as
  the 3px strip and soft glow of `ai-surface` and in `AIMark`. Never on text, buttons or status.
- Page background `bg-canvas`; panels `bg-card` with `border`. Popovers are the only shadows.
- Text: `text-foreground`; secondary `text-muted-foreground`. Never lighter for text.
- Status always pairs color with an icon or label (`PriorityBadge` does this).
- Badge variants: `critical`, `warning`, `success`, `info`, plus shadcn's own.
- All text pairs pass WCAG AA (4.5:1) in both themes. Check new pairs with `pnpm check:contrast`.

## Type and spacing

- Base 14px (`text-sm`); dense metadata 13px (`text-[0.8125rem]`); labels 12px (`text-xs`).
- AI reply text may go to 15px (`text-[0.9375rem] leading-relaxed`) for readability.
- Headings: page `text-xl font-semibold`, panel `text-sm font-semibold`. No hero-size type.
- IDs, percentages, milliseconds: `font-mono`. Numbers are tabular by default.
- Spacing scale: 1, 1.5, 2, 3, 4, 5, 6, 8. Panel padding `p-4`/`p-5`, list rows 36–40px.
- Radius: `rounded-md` controls and badges, `rounded-lg` panels, `rounded-xl` AI surfaces.

## Layout

Planned pages (see `web/README.md` for scope) and the reference each should start from:

| Page | Start from |
|---|---|
| Triage inbox `/tickets` | A's queue layout, B's keyboard triage and suggestion chips |
| Ticket detail `/tickets/[id]` | D's canvas: ticket, grounded reply or clarifying question, evidence rail |
| Operations dashboard `/dashboard` | C's charts and KPI tiles; chart selections open the inbox filtered |

- The AI reply (or clarifying question, or escalation reason) and its evidence are the visual center.
- Put the next action (approve, escalate) in the first viewport; on phones, a fixed bottom bar.
- `min-w-0` on flex and grid children that hold text. Never scroll the page sideways.
- Below 768px, stack panels in reading order: status, ticket, AI reply, evidence.

## Charts (from reference C)

- `ChartContainer` + Recharts, colors from tokens: priority series `var(--prio-high|medium|low)`,
  other series `var(--chart-1..5)`.
- Thin lines (1.5px), low-opacity area fills (high 0.34, medium 0.18, low 0.10), dashed muted
  gridlines, no chart borders, compact legend, `ChartTooltipContent` tooltips.
- Annotate the moment that matters (an outage burst) with one `ReferenceArea` and a 2-word label.
- Time range with a `ToggleGroup` (1h / 24h / 7d). KPI tiles: one number, one sparkline, no prose.
- Disable Recharts' entrance animation (`isAnimationActive={false}`); charts should not bounce.

## Motion

- Hover and press: 100–150ms, colors or opacity only (`transition-colors duration-150`).
- Panels, popovers, tabs: 200ms with `ease-standard`. Entrances under 300ms.
- No staggered entrances, hover lifts, bouncing or perpetual motion.
- The only continuous animation: an `ai-surface` with `data-generating="true"` while a model
  request is in flight. It stops when the response lands.
- Loading uses `Skeleton` shaped like the final content, not spinners.
- `prefers-reduced-motion` is handled globally; keep state feedback when honoring it.

## States (every data panel needs all four)

| State | Pattern |
|---|---|
| Loading | `Skeleton` matching the final layout; AI surface shows the strip sweep |
| Empty | shadcn `Empty`: one sentence, one action |
| Error | `Alert variant="destructive"`: what failed, plus Retry |
| Mock data | If `sources[stage] !== "real"`, a small `outline` badge "Mock" on that panel |

## Accessibility

- Every input has a label; icon-only buttons have `aria-label`.
- Keep shadcn's `focus-visible` ring on every control.
- Escalations and errors announce via `role="status"` or `role="alert"`.
- Check keyboard order, focus and 390px width in the browser before calling a page done.

## Components

shadcn (`components/ui`): button, badge, card, tabs, tooltip, popover, hover-card, table,
progress, separator, skeleton, textarea, input, label, select, slider, switch, scroll-area,
dropdown-menu, chart, sonner, toggle-group, kbd, empty, alert, sheet, sidebar.

Ours (`components/sentinel`):

| Component | Purpose |
|---|---|
| `PriorityBadge` | Priority with color and signal icon |
| `TicketId` | Monospace ticket ID |
| `EscalationStatus` | Auto-draft ready vs escalate, with reasons |
| `ConfidenceMeter` | Bar and Confident/Likely/Ambiguous tier (raw % only with `showValue`) |
| `Logo`, `Wordmark` | Brand mark (see Brand) |
| `AIMark`, `AISurface` | Marks AI output and frames it; `generating` animates the strip |

Build a custom component only when shadcn has nothing that fits, and add it to this table.

## References (`/references`)

Four quick explorations built in parallel. **They are not finished or fully scoped**: each has its
own palette, invented copy and placeholder data, and some patterns there break the rules above
(too much text in places). Use them for patterns, then rebuild on these tokens and components.

| Ref | Borrow | Key file |
|---|---|---|
| D · Copilot Canvas | Overall look, AI gradient, grounded reply with sentence support and citation cards | `app/references/d/canvas.tsx` |
| C · Ops Observatory | Volume chart, calibration, risk dial, KPI sparklines, latency by stage | `app/references/c/charts.tsx` |
| A · Command Center | Queue + detail + AI panel layout, Manrope | `app/references/a/command-center.tsx` |
| B · Triage Inbox | Keyboard triage (J/K, A, E), accept or override suggestions | `app/references/b/detail.tsx` |

## TODO

- [ ] Promote C's charts into `components/charts` on the global tokens.
- [ ] Promote D's grounded reply (sentence support + citation chips) into `components/sentinel`.
- [ ] Delete a reference once its patterns live in shared components.
