# SentinelDesk design system

Read this before building a page. Tokens live in `app/globals.css`; components in
`components/ui` (shadcn) and `components/sentinel` (ours). Visual references with
screenshots: `../docs/ui-references.md`.

**Direction:** PagerDuty-clean layout (quiet neutrals, dense lists, one detail
panel) with Linear-style triage intelligence (AI suggestions you accept or
override). Gemini's four colors carry meaning, never decoration.

## Stack

| Need | Use |
|---|---|
| Components | shadcn/ui (Radix), already in `components/ui`. Add more with `pnpm dlx shadcn@latest add <name>` |
| Icons | `lucide-react` only. No emoji or text glyphs as icons |
| Charts | shadcn `chart` (Recharts). Wrap in `ChartContainer`, colors from `--chart-*` or status tokens |
| Fonts | Google Sans Flex (UI), Google Sans Code (ticket IDs, numbers, latency) |
| Theme | `next-themes`, light default plus dark. Every token has both |
| Data | `lib/types.ts` mirrors `shared/contracts.py` and `pipeline.run()`. `lib/mock.ts` has fixtures |

## Color

Neutrals do the layout work. Color appears only where it means something.

| Meaning | Gemini hue | Tokens (Tailwind) | Use for |
|---|---|---|---|
| Critical | red | `bg-critical-tint text-critical-fg`, `bg-critical` | High priority, escalate, invalid citation |
| Caution | yellow | `bg-warning-tint text-warning-fg`, `bg-warning` | Medium priority, low confidence, uncited sentence |
| Safe | green | `bg-success-tint text-success-fg`, `bg-success` | Low priority, auto-draft ready, supported sentence |
| Action / info | blue | `bg-primary`, `bg-info-tint text-info-fg` | Primary buttons, links, focus, selection |
| AI generated | gradient | `gemini-edge`, `gemini-text`, `<GeminiMark />` | Only content Gemini produced |

- Page background `bg-canvas`, panels `bg-card` with `border`. No shadows except popovers.
- Text: `text-foreground`, secondary `text-muted-foreground`. Never lighter than that for text.
- Status always pairs color with an icon or label. `PriorityBadge` does this for you.
- Badge variants: `critical`, `warning`, `success`, `info`, plus shadcn's own.
- Charts: priority series use `var(--critical)`, `var(--warning)`, `var(--success)`.
  Other series use `--chart-1..5` (blue, green, yellow, red, slate).
- Raw `--gemini-*` hues are for charts and the gradient. Never use them for text.

## Type and spacing

- Base UI text 14px (`text-sm`); dense metadata 13px (`text-[0.8125rem]`); labels 12px (`text-xs`).
- Headings: page `text-xl font-semibold`, panel `text-sm font-medium`. No oversized hero type.
- Ticket IDs, percentages, milliseconds: `font-mono`. Numbers are tabular by default.
- Spacing scale: 1, 1.5, 2, 3, 4, 6, 8 (Tailwind units). Panel padding `p-4`, row height 36–40px.
- Radius: `rounded-md` for controls and badges, `rounded-lg` for panels.

## Layout

- Console pages: list on the left, detail panel on the right (PagerDuty). Detail panel order:
  status, triage fields, Gemini draft or incident brief, precedents, latency.
- Put the next action in the first viewport. Use `min-w-0` on flex and grid children that hold text.
- Below 768px, stack the detail panel under the list; never scroll the page sideways.

## Motion

- Hover and press: 100–150ms, colors or opacity only (`transition-colors duration-150`).
- Panels, popovers, tabs: 200ms with `ease-standard`. Entrances under 300ms.
- No staggered entrances, hover lifts, bouncing or perpetual motion.
- Only one thing animates continuously: a Gemini surface while a request is in flight
  (`data-generating="true"` on `gemini-edge`). It stops when the response lands.
- Loading uses `Skeleton` in the shape of the final content, not spinners.
- `prefers-reduced-motion` is handled globally; never remove state feedback to honor it.

## States (every data panel needs all of them)

| State | Pattern |
|---|---|
| Loading | `Skeleton` matching the final layout; Gemini surface shows the edge sweep |
| Empty | shadcn `Empty` with one sentence and one action |
| Error | `Alert variant="destructive"` with what failed and a retry |
| Mock data | If `sources[stage] !== "real"`, show a small `outline` badge "Mock" on that panel |

## Accessibility

- Every input has a label. Icon-only buttons need `aria-label`.
- Visible `focus-visible` ring on every control (shadcn default, keep it).
- Contrast: text 4.5:1, UI boundaries 3:1, on the surface where it appears.
- Escalation and errors announce via `role="status"` or `role="alert"`.

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
| `ConfidenceMeter` | Bar, percent and High/Medium/Low band |
| `GeminiMark`, `AISurface` | Marks and frames Gemini output; `generating` animates the edge |

Coming next: `AISuggestion` (Linear-style accept or override), `GroundedReply` (per-sentence
support with citation chips), `PrecedentList` (used vs found), `LatencyBreakdown`,
`OutageBanner`, charts (`VolumeChart`, `CalibrationChart`, `RiskDial`) and a live
style guide at `/design`.

Build a new custom component only when shadcn has nothing that fits, and add it to this table.

## TODO

- [ ] Replace the sparkle in `GeminiMark` with our own mark. Lucide's `Sparkle` with the
  gradient reads too close to Google's Gemini logo, and we should not borrow it.
