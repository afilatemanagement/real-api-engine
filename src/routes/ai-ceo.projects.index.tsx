import { createFileRoute } from "@tanstack/react-router";
import { ProjectsList } from "@/components/ai-ceo/work/Projects";

export const Route = createFileRoute("/ai-ceo/projects/")({
  head: () => ({
    meta: [
      { title: "Operational Projects — Founder AI" },
      { name: "description", content: "Coordinated operational initiatives with milestones, tasks, risks and decisions." },
      { property: "og:title", content: "Operational Projects — Founder AI" },
      { property: "og:description", content: "Coordinated operational initiatives with milestones, tasks, risks and decisions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProjectsList,
});
