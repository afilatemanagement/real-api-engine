import { createFileRoute } from "@tanstack/react-router";
import { TaskDetail } from "@/components/ai-ceo/ops/TaskCenter";

export const Route = createFileRoute("/ai-ceo/tasks/$taskId")({
  head: () => ({
    meta: [
      { title: "Task Detail — Founder AI" },
      { name: "description", content: "Operational task status, dependencies and Founder controls." },
      { property: "og:title", content: "Task Detail — Founder AI" },
      { property: "og:description", content: "Operational task status, dependencies and Founder controls." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: function Page() { const { taskId } = Route.useParams(); return <TaskDetail taskId={taskId} />; },
});
