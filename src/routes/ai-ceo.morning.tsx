import { createFileRoute } from "@tanstack/react-router";
import { MorningCenter } from "@/components/ai-ceo/morning/MorningCenter";

export const Route = createFileRoute("/ai-ceo/morning")({
  head: () => ({
    meta: [
      { title: "Morning AI Command Center — Founder AI" },
      { name: "description", content: "Daily operating picture: overnight summary, priorities, workforce, escalations and progress." },
      { property: "og:title", content: "Morning AI Command Center — Founder AI" },
      { property: "og:description", content: "Daily operating picture: overnight summary, priorities, workforce, escalations and progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MorningCenter,
});
