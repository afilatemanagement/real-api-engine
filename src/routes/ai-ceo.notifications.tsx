import { createFileRoute } from "@tanstack/react-router";
import { NotificationCenter } from "@/components/ai-ceo/system/NotificationViews";

export const Route = createFileRoute("/ai-ceo/notifications")({
  head: () => ({
    meta: [
      { title: "Notification Center — Founder AI" },
      { name: "description", content: "Alerts, approvals and updates derived from your operations." },
      { property: "og:title", content: "Notification Center — Founder AI" },
      { property: "og:description", content: "Alerts, approvals and updates derived from your operations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationCenter,
});
