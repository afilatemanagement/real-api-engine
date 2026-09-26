import { createFileRoute } from "@tanstack/react-router";
import { SystemStatus } from "@/components/ai-ceo/system/SystemPages";

export const Route = createFileRoute("/ai-ceo/status")({
  head: () => ({
    meta: [
      { title: "System Status — Founder AI" },
      { name: "description", content: "Availability of Founder AI data, AI, agents and automations." },
      { property: "og:title", content: "System Status — Founder AI" },
      { property: "og:description", content: "Availability of Founder AI data, AI, agents and automations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SystemStatus,
});
