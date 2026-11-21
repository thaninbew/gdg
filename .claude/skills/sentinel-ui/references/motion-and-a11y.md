# Motion and accessibility

## Motion

Before implementing a nontrivial transition, privately define:

- the user action that triggers it;
- the object or surface that persists across both states;
- what is created, removed, or changed;
- the one focal relationship the eye should follow.

Let that focal relationship lead. Move or reshape a persistent surface when it
represents the same object in both states. Use an entrance or exit only for a
surface that genuinely appears or disappears. Keep unrelated content still. If
there is no useful relationship to communicate, use an immediate state change
or a restrained fade rather than inventing spatial motion.

- Use the product's semantic motion tokens and maintained primitives before raw
  values. Do not hand-build measurement, timelines, or one-off easing when the
  system already expresses the relationship.
- Keep hover feedback near 100 to 150ms, state transitions near 200 to 300ms,
  and entrances under 500ms unless the product requires another rhythm.
- Prefer `transform` and `opacity`. Paint-only color, background, border, and
  shadow transitions are acceptable for brief interaction feedback.
- Name the properties that transition. Avoid `transition: all` on repeated or
  reusable controls when a standard scoped utility such as `transition-colors`,
  `transition-opacity`, or `transition-transform` expresses the state.
- Do not animate layout properties when a transform can express the change.
- Use motion to explain state or spatial continuity, not to decorate every
  component. Do not make users wait for an animation before the next input is
  accepted.
- Prefer one leading transition. Several simultaneous movements that compete
  for attention usually mean the relationship was not modeled clearly.

## Presentation contract

- Decide whether the user must complete or dismiss the new surface before
  returning to the parent task. That determines modal versus nonmodal behavior;
  explicit product direction overrides an inferred pattern.
- Use the design system's dialog, popover, panel, or navigation primitive and
  its overlay, elevation, focus, dismissal, and responsive behavior. An overlay
  communicates that the parent is inactive; it is not a canvas for decorative
  effects that the system does not specify.
- A surface should enter from a plausible origin or scale in place. Similar
  surfaces use the same pattern so users do not relearn the interaction.

## Rendered motion review

- Inspect the start, midpoint, and end at real speed. At the midpoint, the focal
  object should still read as the same object moving or changing state.
- Exercise rapid successive input. A transition that cannot be interrupted or
  retargeted without jumping is not suitable for a frequent control.
- Remove motion when the midpoint shows unrelated elements moving, attention
  splitting across several effects, or no additional context over an instant
  change.

Honor reduced motion while preserving the resting, hover, focus, and active
distinctions:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Accessibility

- Use native semantic HTML before ARIA.
- Associate every input with a visible or programmatic label.
- Keep a logical keyboard order. Enter and Space activate native controls;
  Escape closes overlays; modal focus stays inside and returns to the trigger.
- Do not autofocus a text field in a phone modal unless immediate typing is the
  primary task; the software keyboard can hide context and the main action.
- Give every control a visible `:focus-visible` treatment distinct from hover.
  Verify the computed outline or inset ring while focused and check that no
  ancestor clips it.
- Keep normal text at 4.5:1 contrast and large text, UI boundaries, and focus
  indicators at 3:1 against the surfaces where they actually appear.
- Use at least 24 CSS px pointer targets and 44 CSS px touch targets where the
  interface is touch-first.
- Pair color with a label, icon, shape, or position for status meaning.
- Announce asynchronous errors and important state changes through an
  appropriate live region.
- Provide a skip link when repeated navigation precedes the main content.

Accessibility is a rendered page property, not a component-library claim. Test
keyboard behavior, focus paint, zoom/reflow, narrow widths, and meaningful
states in the browser.
