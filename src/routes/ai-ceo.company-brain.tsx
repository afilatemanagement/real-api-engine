import { createFileRoute } from "@tanstack/react-router";
import { Library } from "lucide-react";
import { ModuleShell } from "@/components/ai-ceo/ModuleShell";

// UI shell only — data source: COMPANY-BRAIN_API_REQUIRED (future phase).
export const Route = createFileRoute("/ai-ceo/company-brain")({
  head: () => ({
    meta: [
      { title: "Company Brain — Founder AI" },
      { name: "description", content: "Company knowledge, policies and operating context in one place." },
      { property: "og:title", content: "Company Brain — Founder AI" },
      { property: "og:description", content: "Company knowledge, policies and operating context in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModuleShell title="Company Brain" subtitle="Company knowledge, policies and operating context in one place." icon={Library} />,
});
