import { createFileRoute } from "@tanstack/react-router";
import { SecurityCenter } from "@/components/ai-ceo/system/SystemPages";

export const Route = createFileRoute("/ai-ceo/security")({
  head: () => ({
    meta: [
      { title: "Security & Permissions — Founder AI" },
      { name: "description", content: "AI permissions, roles and security events." },
      { property: "og:title", content: "Security & Permissions — Founder AI" },
      { property: "og:description", content: "AI permissions, roles and security events." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SecurityCenter,
});
