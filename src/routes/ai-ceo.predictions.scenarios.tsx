import { createFileRoute } from "@tanstack/react-router";
import { ScenarioAnalysis } from "@/components/ai-ceo/insights/ScenarioAnalysis";

export const Route = createFileRoute("/ai-ceo/predictions/scenarios")({
  head: () => ({
    meta: [
      { title: "Scenario Analysis — Software Vala" },
      { name: "description", content: "Explore illustrative what-if scenarios for operational planning." },
      { property: "og:title", content: "Scenario Analysis — Software Vala" },
      { property: "og:description", content: "Explore illustrative what-if scenarios for operational planning." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ScenarioAnalysis,
});


