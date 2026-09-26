import { createFileRoute } from "@tanstack/react-router";
import { AutomationCenter } from "@/components/ai-ceo/ops/Automations";

export const Route = createFileRoute("/ai-ceo/automations/")({
  head: () => ({
    meta: [
      { title: "Automation Center — Founder AI" },
      { name: "description", content: "Governed operational automations with approval gates and verification." },
      { property: "og:title", content: "Automation Center — Founder AI" },
      { property: "og:description", content: "Governed operational automations with approval gates and verification." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AutomationCenter,
});
