import { createFileRoute } from "@tanstack/react-router";
import { HelpCenter } from "@/components/ai-ceo/system/SystemPages";

export const Route = createFileRoute("/ai-ceo/help")({
  head: () => ({
    meta: [
      { title: "Help & Shortcuts — Founder AI" },
      { name: "description", content: "Keyboard shortcuts and how Founder AI works." },
      { property: "og:title", content: "Help & Shortcuts — Founder AI" },
      { property: "og:description", content: "Keyboard shortcuts and how Founder AI works." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HelpCenter,
});
