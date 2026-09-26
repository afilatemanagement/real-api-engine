import { createFileRoute } from "@tanstack/react-router";
import { TaskCenter } from "@/components/ai-ceo/ops/TaskCenter";

export const Route = createFileRoute("/ai-ceo/tasks/")({
  head: () => ({
    meta: [
      { title: "Task Center — Founder AI" },
      { name: "description", content: "Assign, approve and track operational tasks for operations agents." },
      { property: "og:title", content: "Task Center — Founder AI" },
      { property: "og:description", content: "Assign, approve and track operational tasks for operations agents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TaskCenter,
});
