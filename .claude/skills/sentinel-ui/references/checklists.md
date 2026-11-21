# Rendered UI gates

Use only the checks relevant to the surface, but every applicable failure blocks
completion.

## Before implementation

- [ ] Primary user, task, content hierarchy, platform, and meaningful states are
  known or conservatively inferred.
- [ ] The page follows `web/DESIGN.md`; no parallel palette, font or component style.
- [ ] Tokens and components come from that system rather than a parallel one.
- [ ] Existing and library components were inventoried before custom work;
  each custom component has a domain-specific reason.
- [ ] The responsive model states what remains visible, moves, collapses, or
  scrolls at narrow widths.
- [ ] Repeated content has explicit key lines; controls with the same role have
  one size rule; spacing uses a small named scale.
- [ ] A greenfield or material redesign has compared structural alternatives;
  an established or narrow edit has preserved the existing structure.

## Rendered behavior

- [ ] The primary task is understandable and reachable without reading the
  generation prompt.
- [ ] Loading, empty, error, success, and surrounding counts/actions agree.
- [ ] Interactive controls have appropriate default, hover, focus-visible,
  active, and disabled behavior.
- [ ] Keyboard order is logical; overlays close with Escape, contain focus, and
  return focus to their trigger.
- [ ] Inputs have labels, status is not color-only, and alerts are announced.
- [ ] Body text meets 4.5:1 contrast; large text, controls, and focus indicators
  meet 3:1. Check the actual foreground and surface pairs used.
- [ ] Touch targets are at least 44 CSS px where the interface is touch-first.
- [ ] Motion honors `prefers-reduced-motion` without removing state feedback.
- [ ] Motion reuses system or library behavior, transitions only named cheap
  properties, and adds no bespoke choreography solely to appear premium.
- [ ] Each nontrivial transition has one legible focal relationship at its
  start, midpoint, and end; unrelated elements stay quiet and frequent input can
  interrupt or retarget it.
- [ ] The chosen modal, nonmodal, inline, or navigational contract matches the
  task and explicit direction while preserving the system primitive's focus,
  dismissal, overlay, and responsive behavior.

## Responsive and visual review

- [ ] At target desktop, tablet, phone, and 320 CSS px reflow widths, the page
  and every required control fit without accidental clipping or page-level
  horizontal overflow.
- [ ] The first viewport exposes the primary content or action before secondary
  explanation or decoration.
- [ ] Preview, debug, and state-switching controls are outside the primary user
  flow unless they are part of the requested product.
- [ ] Hierarchy, alignment, spacing rhythm, typography, density, and content fit
  remain legible at 100 percent zoom and after zoom/reflow.
- [ ] Repeated rows and cards share measurable content, metadata, and action
  edges. Short, long, and wrapped content do not move those key lines.
- [ ] Controls with the same role share height and, when labels vary inside a
  repeated action column, a deliberate width. Exceptions express a real
  hierarchy or breakpoint change.
- [ ] Gaps and padding come from the chosen spacing scale. Near-duplicate values
  have a documented optical reason rather than accumulated nudges.
- [ ] Narrow layouts recompose the hierarchy instead of merely shrinking it;
  action placement and reading order remain intentional.
- [ ] Repeated objects use one treatment; different treatments correspond to
  real semantic differences.
- [ ] Every visible text block has a unique job. Conclusions, actions, labels,
  and helper copy are not duplicated across adjacent regions.
- [ ] Every visible status, timestamp, count, sort explanation, and freshness
  signal changes what the user can infer or do; ornamental narration is gone.
- [ ] Live, progress, urgency, and motion have a meaningful changing state and
  corresponding user consequence; static content does not pretend to be live.
- [ ] Native, existing, or library primitives retain their expected semantics,
  states, keyboard behavior, and focus management.
- [ ] The advisory cluster review in `anti-slop.md` finds no collection of
  unearned defaults.

## Evidence

Record the tested viewports, exercised states, browser observations, repeated
edge and control measurements, automated checks, and remaining caveats. Do not
claim accessible, responsive, aligned, clear, or complete without that evidence.

After a repair, rerun the affected rendered checks. Stop when a full applicable
pass yields no new concrete failure.
