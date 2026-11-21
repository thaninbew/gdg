# Advisory anti-default review

Review clusters, not isolated motifs. A familiar font, gradient, card, dark
theme, centered region, or symmetrical layout may be exactly right. Flag a
result when several choices appear without a product, content, or task reason.

The list is time-sensitive. Use it to trigger rendered review, never to classify
authorship or replace judgment.

## Current clusters

- Generic centered slogan, badge, oversized heading, and interchangeable cards.
- A fashionable font, purple gradient, glow, glass, or permanent dark mode
  selected before the product is understood.
- Identical icon-topped cards, stat tiles, or numbered steps used as filler.
- Uppercase micro-labels repeated until every section has the same visual voice.
- Borders, pills, shadows, and containers around content that needs no boundary.
- Emoji or mixed icon styles used to decorate labels.
- Low-contrast secondary text justified as sophistication.
- A generic dashboard shell that does not reflect the product's real objects or
  the user's primary task.
- A polished happy path with missing loading, empty, error, focus, disabled, or
  narrow-screen behavior.
- Decorative novelty that makes scanning, reading, or navigation slower.
- Interface narration: dates without a time-sensitive task, prose that restates
  nearby counts, default-sort explanations, or helper copy that only describes
  an obvious control.
- Performative state: a "live" label, pulse, progress value, freshness dot, or
  activity sentence with no stale, disconnected, delayed, or actionable state.
- One-off pills, counters, icon buttons, avatars, cards, or progress treatments
  that duplicate native or library primitives and introduce inconsistent states.
- Repeated rows whose actions, timestamps, badges, or text starts drift with
  label length because each item was composed independently.
- Custom easing, staggered entrances, hover lifts, or perpetual motion applied
  to ordinary controls only to make the interface appear premium.
- Several affected elements animate independently when one persistent surface
  or focal relationship should carry the transition.
- Presentation chosen from a familiar visual cliché rather than the task
  contract, such as making every detail view a drawer or decorating every
  overlay with blur.

## Review questions

For each visible region, ask:

1. What user task or content distinction requires this region?
2. Why is this hierarchy, layout, type, color, or treatment appropriate here?
3. Would removing a container, label, effect, or repeated sentence improve the
   task without losing meaning?
4. Are repeated objects truly the same kind, and are different kinds visibly
   distinguishable for a reason?
5. Does the first phone viewport expose the next useful action without a
   decorative preamble or clipped navigation?
6. Does each status, timestamp, count, and explanation change an inference or
   action, or is it only proving that the interface noticed the prompt?
7. Is each nontrivial component native, reused, or library-backed? If custom,
   what domain-specific behavior requires it?

## Frequent implementation defects

- A grid or flex child without `min-width: 0` lets wide content force page-level
  horizontal scrolling.
- Scrollable navigation shows clipped destinations without a clear overflow
  affordance or alternate mobile control.
- `all: unset`, clipping, masks, or overflow prevent focus outlines from
  painting even when the CSS contains a focus rule.
- Muted tokens pass on the page background but fail on elevated surfaces.
- Error or loading states leave stale counts, status labels, or actions visible.
- Reduced-motion rules remove state feedback instead of only removing motion.
- Broad `transition: all` rules animate unintended layout or paint changes on
  repeated controls.
- A transition's start and end look plausible while its midpoint breaks object
  continuity, crosses paths, distorts content, or splits attention.
- Token-compliant spacing still looks uneven because optical balance was never
  checked in the rendered composition.

Measure these in the rendered page. Source inspection alone does not clear them.

## Better response

Do not replace one house cliché with another. Keep conventional controls when
they work, remove unearned decoration, derive the composition from real content,
and give the product one restrained signature only when its semantics support
one.
