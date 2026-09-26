import { createFileRoute } from "@tanstack/react-router";
import { LearningDetail } from "@/components/ai-ceo/knowledge/LearningViews";

export const Route = createFileRoute("/ai-ceo/learning/$id")({
  head: () => ({
    meta: [
      { title: "Learning record — Software Vala" },
      { name: "description", content: "Observation, suggestion, Founder decision and outcome for one learning record." },
      { property: "og:title", content: "Learning record — Software Vala" },
      { property: "og:description", content: "Observation, suggestion, Founder decision and outcome for one learning record." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return <LearningDetail id={id} />;
}
