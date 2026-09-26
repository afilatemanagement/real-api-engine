import { createFileRoute } from "@tanstack/react-router";
import { ListTodo } from "lucide-react";
import { ModuleShell } from "@/components/ai-ceo/ModuleShell";

// UI shell only — data source: TASKS_API_REQUIRED (future phase).
export const Route = createFileRoute("/ai-ceo/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Founder AI" },
      { name: "description", content: "Operational tasks created from decisions, attention items and recommendations." },
      { property: "og:title", content: "Tasks — Founder AI" },
      { property: "og:description", content: "Operational tasks created from decisions, attention items and recommendations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModuleShell title="Tasks" subtitle="Operational tasks created from decisions, attention items and recommendations." icon={ListTodo} />,
});
