import { createFileRoute } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { ModuleShell } from "@/components/ai-ceo/ModuleShell";

// UI shell only — data source: AGENTS_API_REQUIRED (future phase).
export const Route = createFileRoute("/ai-ceo/agents")({
  head: () => ({
    meta: [
      { title: "Agents — Founder AI" },
      { name: "description", content: "Operational AI agents that observe and report — execution stays governed." },
      { property: "og:title", content: "Agents — Founder AI" },
      { property: "og:description", content: "Operational AI agents that observe and report — execution stays governed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModuleShell title="Agents" subtitle="Operational AI agents that observe and report — execution stays governed." icon={Bot} />,
});
