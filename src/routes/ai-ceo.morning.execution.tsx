import { createFileRoute } from "@tanstack/react-router";
import { LiveExecution } from "@/components/ai-ceo/morning/Orchestration";

export const Route = createFileRoute("/ai-ceo/morning/execution")({
  head: () => ({
    meta: [
      { title: "Live Execution — Morning AI" },
      { name: "description", content: "Live orchestration: worker execution, handoffs, communication, exceptions and daily close." },
      { property: "og:title", content: "Live Execution — Morning AI" },
      { property: "og:description", content: "Live orchestration: worker execution, handoffs, communication, exceptions and daily close." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LiveExecution,
});
