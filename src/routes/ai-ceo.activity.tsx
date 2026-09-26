import { createFileRoute } from "@tanstack/react-router";
import { ExecutionActivity } from "@/components/ai-ceo/ops/ExecutionActivity";

export const Route = createFileRoute("/ai-ceo/activity")({
  head: () => ({
    meta: [
      { title: "Execution Activity — Founder AI" },
      { name: "description", content: "Escalations, monitoring, execution history and the operational activity timeline." },
      { property: "og:title", content: "Execution Activity — Founder AI" },
      { property: "og:description", content: "Escalations, monitoring, execution history and the operational activity timeline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { agent?: string } => (typeof s["agent"] === "string" ? { agent: s["agent"] } : {}),
  component: function Page() { const { agent } = Route.useSearch(); return <ExecutionActivity {...(agent ? { agent } : {})} />; },
});
