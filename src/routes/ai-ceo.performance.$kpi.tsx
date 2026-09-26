import { createFileRoute } from "@tanstack/react-router";
import { KpiDetail } from "@/components/ai-ceo/insights/KpiDetail";

export const Route = createFileRoute("/ai-ceo/performance/$kpi")({
  head: () => ({
    meta: [
      { title: "KPI drill-down — Software Vala" },
      { name: "description", content: "Definition, target, trend, drivers and related records for one KPI." },
      { property: "og:title", content: "KPI drill-down — Software Vala" },
      { property: "og:description", content: "Definition, target, trend, drivers and related records for one KPI." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { kpi } = Route.useParams();
  return <KpiDetail id={kpi} />;
}
