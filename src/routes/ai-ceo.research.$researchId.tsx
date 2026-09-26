import { createFileRoute } from "@tanstack/react-router";
import { ResearchWorkspace } from "@/components/ai-ceo/work/Research";

export const Route = createFileRoute("/ai-ceo/research/$researchId")({
  head: () => ({
    meta: [
      { title: "Research Workspace — Founder AI" },
      { name: "description", content: "Sources, findings, synthesis and decision handoff for a research request." },
      { property: "og:title", content: "Research Workspace — Founder AI" },
      { property: "og:description", content: "Sources, findings, synthesis and decision handoff for a research request." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: function Page() { const { researchId } = Route.useParams(); return <ResearchWorkspace id={researchId} />; },
});
