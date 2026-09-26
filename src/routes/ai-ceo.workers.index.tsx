import { createFileRoute } from "@tanstack/react-router";
import { WorkerDirectory } from "@/components/ai-ceo/workers/Workers";

export const Route = createFileRoute("/ai-ceo/workers/")({
  head: () => ({
    meta: [
      { title: "Worker Agents — Founder AI" },
      { name: "description", content: "Operational worker agents: directory, capability matrix, work queue, performance and failures." },
      { property: "og:title", content: "Worker Agents — Founder AI" },
      { property: "og:description", content: "Operational worker agents: directory, capability matrix, work queue, performance and failures." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkerDirectory,
});
