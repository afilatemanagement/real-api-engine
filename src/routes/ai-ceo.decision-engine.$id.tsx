import { createFileRoute } from "@tanstack/react-router";
import { DecisionDetail } from "@/components/ai-ceo/governance/DecisionDetail";

export const Route = createFileRoute("/ai-ceo/decision-engine/$id")({
  head: () => ({
    meta: [
      { title: "AI Decision Engine detail — Software Vala" },
      { name: "description", content: "Evidence, context, risk and audit trail for a single Founder AI record." },
      { property: "og:title", content: "AI Decision Engine detail — Software Vala" },
      { property: "og:description", content: "Evidence, context, risk and audit trail for a single Founder AI record." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DetailPage,
});

function DetailPage() {
  const { id } = Route.useParams();
  return <DecisionDetail id={id} />;
}
