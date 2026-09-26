import { createFileRoute } from "@tanstack/react-router";
import { ResearchCenter } from "@/components/ai-ceo/work/Research";

export const Route = createFileRoute("/ai-ceo/research/")({
  head: () => ({
    meta: [
      { title: "Research Center — Founder AI" },
      { name: "description", content: "Operational research requests, evidence, findings and decisions." },
      { property: "og:title", content: "Research Center — Founder AI" },
      { property: "og:description", content: "Operational research requests, evidence, findings and decisions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResearchCenter,
});
