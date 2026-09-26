import { createFileRoute } from "@tanstack/react-router";
import { UsageCenter } from "@/components/ai-ceo/system/SystemPages";

export const Route = createFileRoute("/ai-ceo/usage")({
  head: () => ({
    meta: [
      { title: "Usage & AI Cost — Founder AI" },
      { name: "description", content: "AI resource consumption and cost visibility." },
      { property: "og:title", content: "Usage & AI Cost — Founder AI" },
      { property: "og:description", content: "AI resource consumption and cost visibility." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UsageCenter,
});
