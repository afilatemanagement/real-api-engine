# End-to-end smoke tests

Playwright smoke tests for the AI CEO module.

```bash
bun run test:e2e                 # starts the dev server if needed
E2E_BASE_URL=https://... bun run test:e2e   # run against a deployed URL
```

Coverage:

- `ai-ceo-routes.spec.ts` — every `/ai-ceo` subroute returns 200, renders its
  `h1` and the shared shell, hydrates without console/page errors; `/`, `/owner`
  and `/softwarewala` redirect into the module; sidebar navigation reaches all
  ten sections client-side.
- `ai-ceo-persistence.spec.ts` — dashboard state loads (persisted rows from the
  external Prisma API, or seed fallback), the `Last:` refresh timestamp hydrates
  from the server instead of the `—` placeholder, the same data set reloads after
  a browser refresh, and the "Send to Boss" write path plus the approvals queue
  resolve without errors.
