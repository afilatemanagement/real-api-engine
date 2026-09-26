import { createFileRoute } from "@tanstack/react-router";
import { WorkflowDetail } from "@/components/ai-ceo/ops/Automations";

export const Route = createFileRoute("/ai-ceo/automations/$automationId")({
  head: () => ({
    meta: [
      { title: "Workflow Detail — Founder AI" },
      { name: "description", content: "Workflow steps, approval gate and execution history." },
      { property: "og:title", content: "Workflow Detail — Founder AI" },
      { property: "og:description", content: "Workflow steps, approval gate and execution history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: function Page() { const { automationId } = Route.useParams(); return <WorkflowDetail id={automationId} />; },
});
