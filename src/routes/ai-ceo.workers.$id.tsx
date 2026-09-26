import { createFileRoute } from "@tanstack/react-router";
import { WorkerDetail } from "@/components/ai-ceo/workers/Workers";

export const Route = createFileRoute("/ai-ceo/workers/$id")({
  head: () => ({
    meta: [
      { title: "Worker Agent Detail — Founder AI" },
      { name: "description", content: "Worker agent work, queue, performance, failures and permissions." },
      { property: "og:title", content: "Worker Agent Detail — Founder AI" },
      { property: "og:description", content: "Worker agent work, queue, performance, failures and permissions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
function Page() { const { id } = Route.useParams(); return <WorkerDetail id={id} />; }
