import { createFileRoute } from "@tanstack/react-router";
import { ApprovalDetail } from "@/components/ai-ceo/governance/ApprovalDetail";

export const Route = createFileRoute("/ai-ceo/approvals/$id")({
  head: () => ({
    meta: [
      { title: "Approval Suggestions detail — Software Vala" },
      { name: "description", content: "Evidence, context, risk and audit trail for a single Founder AI record." },
      { property: "og:title", content: "Approval Suggestions detail — Software Vala" },
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
  return <ApprovalDetail id={id} />;
}
