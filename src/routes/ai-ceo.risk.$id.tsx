import { createFileRoute } from "@tanstack/react-router";
import { RiskDetail } from "@/components/ai-ceo/governance/RiskDetail";

export const Route = createFileRoute("/ai-ceo/risk/$id")({
  head: () => ({
    meta: [
      { title: "Risk & Compliance detail — Software Vala" },
      { name: "description", content: "Evidence, context, risk and audit trail for a single Founder AI record." },
      { property: "og:title", content: "Risk & Compliance detail — Software Vala" },
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
  return <RiskDetail id={id} />;
}
