# Complete AI CEO end-to-end integration

## Goal
Keep full parity with the source repository while removing remaining mock-style behavior. Every CEO screen will read through the real AIRA API when configured and use one deterministic, realistic seed dataset only when that API is unavailable.

## What will change
- Expand the shared CEO data contract to cover dashboard metrics, observations, activity, decisions, risks, compliance, performance, predictions, reports, learning history, and read-only settings.
- Move every remaining hardcoded page array into the single realistic seed dataset; remove all mock/fake labels and random metrics.
- Expand the server data layer so one validated AIRA response powers every CEO screen, with safe timeouts and clear live-versus-seed status.
- Keep AI Decision Brief on the real Lovable AI service and feed it the current CEO dataset rather than fabricated figures.
- Wire report downloads to produce an actual report file from the displayed data; keep settings explicitly read-only as required by the source brief.
- Ensure suggestion submission and approval decisions only claim persistence when the real API confirms the write; seed mode remains an honestly labeled temporary fallback.
- Add complete route-specific page metadata for all CEO pages and redirects.
- Restore source test scripts and ignore generated test artifacts.

## Technical details
- Preserve TanStack Start, the existing Software Vala shell, routes, visual tokens, responsiveness, and animations.
- Keep PostgreSQL/Prisma access behind `AIRA_API_URL` and `AIRA_API_TOKEN`; Prisma remains on the external AIRA service because this app runs in an edge environment.
- Validate external API payloads before rendering and never expose the service token to the browser.
- Extend the Prisma reference schema and API endpoint documentation so the external service contract covers every screen.
- Add end-to-end checks for every route, live/seed indicators, report download, suggestion workflow, and AI streaming.
- Run dependency/security checks and record any upstream-only dependency advisory that cannot be fixed locally.

## Verification
- Compare all repository files after implementation.
- Exercise every CEO route at desktop and mobile sizes.
- Verify no console/runtime errors, broken navigation, or nonfunctional actions.
- Verify the current preview build and the central AI brief flow.
