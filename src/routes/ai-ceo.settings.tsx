import { createFileRoute } from "@tanstack/react-router";
import AICEOSettings from "@/components/ai-ceo/sections/AICEOSettings";
import { SettingsCenter } from "@/components/ai-ceo/system/SettingsCenter";
import { PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/ai-ceo/settings")({
  head: () => ({
    meta: [
      { title: "AI CEO Settings — Software Vala" },
      { name: "description", content: "Read-only AI CEO configuration, permissions and operating boundaries." },
      { property: "og:title", content: "AI CEO Settings — Software Vala" },
      { property: "og:description", content: "Read-only AI CEO configuration, permissions and operating boundaries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (<><PageShell><SettingsCenter /></PageShell><AICEOSettings /></>),
});
