import { createFileRoute } from "@tanstack/react-router";
import { Workflow } from "lucide-react";
import { ModuleShell } from "@/components/ai-ceo/ModuleShell";

// UI shell only — data source: AUTOMATIONS_API_REQUIRED (future phase).
export const Route = createFileRoute("/ai-ceo/automations")({
  head: () => ({
    meta: [
      { title: "Automations — Founder AI" },
      { name: "description", content: "Governed automations that run only after Founder approval." },
      { property: "og:title", content: "Automations — Founder AI" },
      { property: "og:description", content: "Governed automations that run only after Founder approval." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModuleShell title="Automations" subtitle="Governed automations that run only after Founder approval." icon={Workflow} />,
});
