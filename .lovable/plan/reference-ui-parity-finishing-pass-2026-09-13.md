# Reference UI parity finishing pass

## Goal
Match the AI CEO module’s visual system to `creator-s-launchpad` while preserving every existing route, data source, action, and business rule.

## Changes
- Align the shared shell with the reference: fixed desktop sidebar, mobile drawer, compact top bar, persistent all-module navigation, and unmistakable active-route treatment.
- Refine every screen banner to the same dimensions, typography, icon treatment, spacing, status styling, and responsive behavior.
- Normalize headings, body text, links, buttons, badges, cards, nested surfaces, shadows, borders, and spacing through shared design tokens and components.
- Apply one consistent density system across all ten AI CEO screens, including mobile-safe rows, scrollable controls, and tablet grid breakpoints.
- Standardize loading, empty, and error presentations, including working retry actions where data requests can fail.
- Remove remaining flat or visually inconsistent widgets so all cards use the same reference-quality depth without changing their content or actions.

## Validation
- Verify all ten `/ai-ceo` routes at desktop, tablet, and mobile widths.
- Test every sidebar link, active highlighting, collapse/drawer behavior, and keyboard-accessible controls.
- Exercise loading, empty, and failed-request states where available.
- Run the existing route and persistence smoke tests and confirm no browser console errors or layout overflow.

## Technical notes
- Frontend/design-system files only, except minimal state exposure needed to render retry/error feedback.
- No new modules, routes, authentication, data models, seed records, or API behavior.
- Existing Software Vala logo and current AI CEO business logic remain unchanged.
