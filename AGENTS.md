<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules

- All AI CEO PostgreSQL access goes through the external Prisma-backed AIRA API
  over HTTP (`src/lib/aira-api.server.ts`, env `AIRA_API_URL` / `AIRA_API_TOKEN`);
  Prisma cannot run in this app's edge server runtime, so `prisma/schema.prisma`
  is reference documentation only.
- When the AIRA API is unconfigured or unreachable, CEO screens render from the
  realistic seed dataset in `src/lib/ceo-seed.ts` and report `persisted: false`;
  never introduce mock APIs or fabricated figures elsewhere.
- AI generation runs server-side through the Lovable AI Gateway Responses
  endpoint in `src/routes/api/ceo-brief.ts`, streamed to the client.
