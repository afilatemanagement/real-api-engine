# Prisma reference schema (read-only)

`schema.prisma` in this folder is **documentation only**. It is never generated,
migrated, or imported by this app, and no Prisma client is installed here —
Prisma cannot run in this app's edge server runtime.

## Why it exists

All PostgreSQL access for the AI CEO module lives behind an external HTTP API
that you host. This schema records the models that API is expected to back, so
the app's TypeScript types and your database stay in sync.

| Reference model            | App type (`src/lib/ceo-types.ts`) | Table                       |
| -------------------------- | --------------------------------- | --------------------------- |
| `CeoSuggestion`            | `CEOSuggestion`                   | `ceo_suggestions`           |
| `AiInsight`                | `AiInsightRecord`                 | `ai_insights`               |
| `CeoDashboardState`        | `CEOState.lastRefresh`            | `ceo_dashboard_state`       |
| `EcosystemMetricSnapshot`  | `EcosystemMetrics`                | `ecosystem_metric_snapshots`|
| `AiObservation`            | `AIObservation`                   | `ai_observations`           |
| `ActivityEvent`            | `ActivityEvent`                   | `activity_events`           |

## Configuration

The app reaches the API through two server-side env vars:

- `AIRA_API_URL` — base URL, e.g. `https://api.softwarevala.com`
- `AIRA_API_TOKEN` — service token sent as `Authorization: Bearer …`

`DATABASE_URL` belongs on the external API host, not in this project. When
`AIRA_API_URL` is unset the module renders from seed data
(`src/lib/ceo-seed.ts`) and reports `persisted: false`.

## Endpoints

Consumed by `src/lib/ceo-insights.functions.ts`:

```text
GET   /ai-ceo/state            -> { suggestions, lastRefresh }
POST  /ai-ceo/refresh          <- { lastRefresh }  -> { lastRefresh }
GET   /ai-insights/boss-queue  -> { suggestions }
POST  /ai-insights             <- ai_insights row (snake_case)
PATCH /ai-insights/:id         <- { status, is_acknowledged }
```

## Keeping it current

When you change a CEO data shape, update `src/lib/ceo-types.ts`, this schema,
and the external API together. Run `prisma format` / `prisma validate` in the
API repo — not here.
