import { createFileRoute } from "@tanstack/react-router";
import { ReportDetail } from "@/components/ai-ceo/knowledge/ReportDetail";

export const Route = createFileRoute("/ai-ceo/reports/$id")({
  head: () => ({
    meta: [
      { title: "Report — Software Vala" },
      { name: "description", content: "Executive report viewer with sections and supporting evidence." },
      { property: "og:title", content: "Report — Software Vala" },
      { property: "og:description", content: "Executive report viewer with sections and supporting evidence." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return <ReportDetail id={id} />;
}
