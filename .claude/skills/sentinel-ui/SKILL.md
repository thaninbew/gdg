---
name: sentinel-ui
description: Build or change SentinelDesk frontend pages and components (Next.js + shadcn/ui + Tailwind in web/) following the team design system, then verify the rendered result. Use before writing or editing any page, component, CSS, Tailwind classes, chart or design token in web/.
---

# SentinelDesk UI

Build the interface around the operator's task, follow the design system exactly, then prove the
rendered result works.

## 1. Load the system (always)

- Read `web/DESIGN.md` fully. It is the only visual direction. Do not invent another palette,
  font, gradient or component style, and do not borrow from other design systems.
- Tokens are in `web/app/globals.css`; reuse `web/components/ui` (shadcn) and
  `web/components/sentinel` before writing anything new.
- Data shapes are in `web/lib/types.ts`; build on fixtures from `web/lib/mock.ts` until the API is
  wired.
- `web/AGENTS.md`: this Next.js version has breaking changes. Read the bundled docs in
  `web/node_modules/next/dist/docs/` for any API you are unsure about.
- `/references` pages are rough explorations, not finished designs. Borrow a pattern only after
  checking it against DESIGN.md; rebuild it on global tokens, never copy their local palettes.

## 2. Plan before markup

Privately note: the operator task on this page, the content and action hierarchy, which existing
components cover it, the meaningful states (loading, empty, error, mock, success), and how it
reflows at 390px. Ask a teammate only when a missing choice changes the product.

## 3. Implement from meaning outward

- Semantic HTML and realistic content first, then layout, then Tailwind classes from the tokens.
- Tailwind utilities in JSX. Plain CSS only for new tokens in `globals.css`.
- shadcn components keep their semantics, keyboard behavior and focus handling. Change variants
  in `components/ui/*` rather than wrapping or re-implementing them.
- Custom components only for domain needs shadcn lacks; add each to the table in DESIGN.md.
- Charts: shadcn `ChartContainer` + Recharts with token colors, following DESIGN.md "Charts".
- Icons: `lucide-react` only, with `aria-label` on icon-only buttons. No emoji.
- Copy: follow DESIGN.md "Copy". Cut any sentence a number, badge or icon already says.
- Motion: follow DESIGN.md "Motion" and `references/motion-and-a11y.md`. The only continuous
  animation is an `ai-surface` while a model request is in flight.
- Every data panel gets loading, empty, error and mock states.

## 4. Render, inspect, repair

Run the app (`cd web && pnpm dev`) and look at the page in a browser, in light and dark, at about
1440px and 390px. Exercise the main action and each state. Then run the gates:

```bash
cd web
pnpm lint
pnpm exec tsc --noEmit
pnpm check:contrast   # after any color token change
pnpm build            # before opening a PR; stop `pnpm dev` first (both use .next)
```

Work through `references/checklists.md` and `references/anti-slop.md`. Fix each concrete failure
and re-check the affected state. Do not claim a page is responsive, accessible or complete without
having seen it render.

## References

- `references/motion-and-a11y.md`: motion, focus and accessibility rules
- `references/anti-slop.md`: generic-AI-UI patterns to catch in review
- `references/checklists.md`: pre-build and rendered gates
