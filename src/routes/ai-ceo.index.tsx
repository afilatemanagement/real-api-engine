import { createFileRoute } from "@tanstack/react-router";
import { CommandCenter } from "@/components/ai-ceo/CommandCenter";
import AICEODashboardMain from "@/components/ai-ceo/sections/AICEODashboardMain";

export const Route = createFileRoute("/ai-ceo/")({
  head: () => ({
    meta: [
      { title: "Founder Command Center — Software Vala" },
      { name: "description", content: "Executive AI overview: ecosystem metrics, AI observations, live activity and suggestions." },
      { property: "og:title", content: "Founder Command Center — Software Vala" },
      { property: "og:description", content: "Executive AI overview: ecosystem metrics, AI observations, live activity and suggestions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (<><CommandCenter /><AICEODashboardMain /></>),
});
