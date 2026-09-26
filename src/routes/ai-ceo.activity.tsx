import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { ModuleShell } from "@/components/ai-ceo/ModuleShell";

// UI shell only — data source: ACTIVITY_API_REQUIRED (future phase).
export const Route = createFileRoute("/ai-ceo/activity")({
  head: () => ({
    meta: [
      { title: "Activity — Founder AI" },
      { name: "description", content: "Important operational events across the company." },
      { property: "og:title", content: "Activity — Founder AI" },
      { property: "og:description", content: "Important operational events across the company." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModuleShell title="Activity" subtitle="Important operational events across the company." icon={Activity} />,
});
