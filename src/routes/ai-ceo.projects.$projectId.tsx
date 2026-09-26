import { createFileRoute } from "@tanstack/react-router";
import { ProjectWorkspace } from "@/components/ai-ceo/work/Projects";

export const Route = createFileRoute("/ai-ceo/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project Workspace — Founder AI" },
      { name: "description", content: "Project goals, work, risks, decisions, files and collaboration." },
      { property: "og:title", content: "Project Workspace — Founder AI" },
      { property: "og:description", content: "Project goals, work, risks, decisions, files and collaboration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: function Page() { const { projectId } = Route.useParams(); return <ProjectWorkspace id={projectId} />; },
});
