import { createFileRoute } from "@tanstack/react-router";
import { WorkPlanBuilder } from "@/components/ai-ceo/morning/Orchestration";

export const Route = createFileRoute("/ai-ceo/morning/plan")({
  head: () => ({
    meta: [
      { title: "Work Plan Builder — Morning AI" },
      { name: "description", content: "Build the daily work plan: tasks, dependencies, agents, approvals and verification." },
      { property: "og:title", content: "Work Plan Builder — Morning AI" },
      { property: "og:description", content: "Build the daily work plan: tasks, dependencies, agents, approvals and verification." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkPlanBuilder,
});
