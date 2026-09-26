import { createFileRoute } from "@tanstack/react-router";
import { AgentDirectory } from "@/components/ai-ceo/ops/AgentDirectory";

export const Route = createFileRoute("/ai-ceo/agents/")({
  head: () => ({
    meta: [
      { title: "Operations Agents — Founder AI" },
      { name: "description", content: "Operations agents coordinated by Founder AI for authorized operational work." },
      { property: "og:title", content: "Operations Agents — Founder AI" },
      { property: "og:description", content: "Operations agents coordinated by Founder AI for authorized operational work." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AgentDirectory,
});
