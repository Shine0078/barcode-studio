# Accessibility

Accessibility is treated as a requirement, not a polish pass. This document
records the decisions and how to keep them when changing the app.

## Semantics

- **Landmarks**: `<header>`, `<main id="main">`, `<footer>`, and a
  `Skip to generator` link (`#main`) that is visible on focus.
- **Grouped controls**: the format picker, appearance and print setup are
  `fieldset`/`legend` groups. The format picker is a `radiogroup` of real radio
  inputs.
- **Every input has a label.** Controls use `htmlFor`/`id` pairs or, for
  checkboxes, wrap their label text.
- **Buttons are buttons.** No clickable `div`s; actions are `<button type="button">`
  so they do not submit forms accidentally. The template form uses a real
  `<form>` with a submit button, so Enter works.

## Keyboard

- The whole workflow is reachable with Tab/Shift+Tab and activated with
  Enter/Space.
- The template form can be completed and submitted without the mouse.
- Textareas/inputs use native editing keys; no custom key handling hijacks
  typing.
- Print setup number inputs clamp on change, so keyboard stepping stays in
  range.

## Focus

- A single visible focus style is defined globally with `:focus-visible`
  (3 px accent outline, 2 px offset), so focus is obvious but does not appear on
  mouse clicks.
- The format picker renders its own focus ring on the label because the radio
  input is visually hidden.
- Error **Fix** buttons move focus to the offending line and select it, so the
  user lands exactly where the problem is.

## Announcements

- Validation summaries and the print-review gate use `role="status"` so screen
  readers announce them without stealing focus.
- Inline template errors use `role="alert"`.
- Layout warnings (labels that do not fit, print truncation) are announced too.
- Transient confirmations (e.g. "Copied") appear in a `role="status"` toast.

## Visual design

- Body text is `#0f172a` on `#f1f5f9`/`#ffffff`: contrast well above WCAG AA.
- The accent (`#4338ca`) on the accent-soft background used for the selected
  format is > 4.5:1; checked states also carry a border, so state is never
  conveyed by colour alone.
- Errors pair red text with a light red surface and a bold "Line n" prefix.
- The document has `<html lang="en">`, a descriptive `<title>` and a meta
  description.
- Layout is responsive from narrow phone widths up to desktop; the two-column
  layout collapses to one column below 900 px, and the template row list
  reflows below 480 px.

## Images and icons

- Barcodes are inline SVG with a `<figure>`/`<figcaption>`; each card has an
  `aria-label` naming the format and value.
- The decorative favicon is the only image and is not needed for understanding.
- The page thumbnail in print setup is `role="img"` with a label describing the
  paper size and grid.

## Checklist for changes

1. Does every new control have a label?
2. Is it reachable and operable by keyboard?
3. Does it announce errors/changes (`role="status"`/`role="alert"`)?
4. Do colours still meet AA, and is state conveyed by more than colour?
5. Does the layout still work at 360 px wide and at 200% zoom?
