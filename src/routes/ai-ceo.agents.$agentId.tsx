import { createFileRoute } from "@tanstack/react-router";
import { notFound } from "@tanstack/react-router";
import { AgentDetail } from "@/components/ai-ceo/ops/AgentDetail";
import { agentById } from "@/components/ai-ceo/ops/catalog";

export const Route = createFileRoute("/ai-ceo/agents/$agentId")({
  head: () => ({
    meta: [
      { title: "Agent Detail — Founder AI" },
      { name: "description", content: "Capabilities, permissions and governed runs for an operations agent." },
      { property: "og:title", content: "Agent Detail — Founder AI" },
      { property: "og:description", content: "Capabilities, permissions and governed runs for an operations agent." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ params }) => { const a = agentById(params.agentId); if (!a) throw notFound(); return { id: a.id }; },
  notFoundComponent: () => <p className="p-8 text-sm">Agent not found.</p>,
  component: function Page() { const { id } = Route.useLoaderData(); return <AgentDetail agent={agentById(id)!} />; },
});
