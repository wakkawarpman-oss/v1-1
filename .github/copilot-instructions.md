# Enterprise UX Engineering Instructions

Use these rules for all UI work in this repository.

## Role

Act as a principal UX-oriented front-end engineer for a data-dense product. Optimize every screen for clarity, predictable interaction, and low cognitive load.

## Core Rules

- Treat UX as state architecture, not decoration.
- Prefer deterministic UI states: `idle`, `loading`, `success`, `error`, `empty`.
- Never add async actions without visible progress and blocked duplicate submission.
- Favor recognition over recall: select lists, defaults, presets, helper text, and constrained inputs over free-form text when domain options are known.
- Keep terminology stable. Use one label for one action across the product.
- Prevent destructive mistakes with friction. Require confirmation for irreversible actions.

## Forms And Validation

- Validate after user interaction, preferably on blur or submit, not aggressively on every keystroke.
- Show validation errors inline at the field that caused the problem.
- Disable submit only when necessary, while keeping controls readable and accessible.
- Use domain-shaped input labels, units, ranges, and examples.

## Feedback And Error Handling

- Loading under 3 seconds: inline spinner or busy button.
- Longer processing: progress text, staged loading, or skeleton UI.
- Empty data: always render a real empty state with explanation and next action.
- Error copy must explain what happened, what it affects, and what the user can do next.
- Never expose raw backend errors or meaningless generic messages.

## Tables And Dashboards

- Prioritize actionable information in the upper-left and upper section of layouts.
- Use spacing and grouping before adding heavy borders.
- Support truncation with discoverability for long values.
- Default to sensible filters and views instead of dumping all data at once.
- Preserve user effort where practical: cached filters, saved layout, remembered choices.

## Interaction States

Every interactive element should have clear `default`, `hover`, `focus-visible`, and `disabled` behavior.

- Hover must not cause layout shift.
- Focus-visible must remain obvious for keyboard users.
- Disabled elements must stay legible.

## Visual Discipline

- Use spacing scale intentionally: `4, 8, 16, 24, 32`.
- Rely on hierarchy through size, contrast, grouping, and whitespace.
- Do not make every element loud. One primary action per local context.
- Prefer subtle delineation with background, shadow, and spacing over heavy chrome.

## Code Structure

- Keep business logic separate from presentation when adding calculators or dashboards.
- Prefer pure calculation utilities in `lib/` and focused UI components in `components/`.
- Add concise assumptions and limits in the UI when formulas are approximate.
- Make edge cases explicit: no data, invalid ranges, impossible geometry, zero division, or out-of-domain values.

## Accessibility

- Use semantic structure and correct headings.
- Ensure sufficient contrast for text and controls.
- Preserve keyboard navigation and visible focus.
- Use ARIA only where native semantics are insufficient.

## Product Fit

- Build practical tools first.
- Do not add enterprise-looking complexity unless it improves real task completion.
- If a feature increases cognitive load more than value, simplify it before shipping.