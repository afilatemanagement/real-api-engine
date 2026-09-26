import { createFileRoute } from "@tanstack/react-router";
import { CollaborationWorkspace } from "@/components/ai-ceo/system/SystemPages";

export const Route = createFileRoute("/ai-ceo/collaboration")({
  head: () => ({
    meta: [
      { title: "Collaboration — Founder AI" },
      { name: "description", content: "Comments and mentions across projects and research." },
      { property: "og:title", content: "Collaboration — Founder AI" },
      { property: "og:description", content: "Comments and mentions across projects and research." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CollaborationWorkspace,
});
