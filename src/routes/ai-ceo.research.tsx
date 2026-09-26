import { createFileRoute } from "@tanstack/react-router";
import { Microscope } from "lucide-react";
import { ModuleShell } from "@/components/ai-ceo/ModuleShell";

// UI shell only — data source: RESEARCH_API_REQUIRED (future phase).
export const Route = createFileRoute("/ai-ceo/research")({
  head: () => ({
    meta: [
      { title: "Research — Founder AI" },
      { name: "description", content: "Market, customer and competitor research requests and findings." },
      { property: "og:title", content: "Research — Founder AI" },
      { property: "og:description", content: "Market, customer and competitor research requests and findings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModuleShell title="Research" subtitle="Market, customer and competitor research requests and findings." icon={Microscope} />,
});
