import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeDetail } from "@/components/ai-ceo/knowledge/KnowledgeDetail";

export const Route = createFileRoute("/ai-ceo/company-brain/$id")({
  head: () => ({
    meta: [
      { title: "Knowledge item — Software Vala" },
      { name: "description", content: "Content, sources, metadata and related knowledge in Company Brain." },
      { property: "og:title", content: "Knowledge item — Software Vala" },
      { property: "og:description", content: "Content, sources, metadata and related knowledge in Company Brain." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return <KnowledgeDetail id={id} />;
}
