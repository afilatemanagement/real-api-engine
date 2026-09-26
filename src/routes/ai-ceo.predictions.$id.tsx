import { createFileRoute } from "@tanstack/react-router";
import { InsightDetail } from "@/components/ai-ceo/insights/InsightDetail";

export const Route = createFileRoute("/ai-ceo/predictions/$id")({
  head: () => ({
    meta: [
      { title: "Insight detail — Software Vala" },
      { name: "description", content: "Signal, forecast, evidence and recommended response for one predictive insight." },
      { property: "og:title", content: "Insight detail — Software Vala" },
      { property: "og:description", content: "Signal, forecast, evidence and recommended response for one predictive insight." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return <InsightDetail id={id} />;
}
