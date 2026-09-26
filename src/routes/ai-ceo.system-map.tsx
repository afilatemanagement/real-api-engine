import { createFileRoute } from "@tanstack/react-router";
import { SystemMap } from "@/components/ai-ceo/system/SystemMap";

export const Route = createFileRoute("/ai-ceo/system-map")({
  head: () => ({
    meta: [
      { title: "System Map & Lifecycles — Founder AI" },
      { name: "description", content: "Product boundaries, governance separation, orchestration stages and agent/task lifecycle states." },
      { property: "og:title", content: "System Map & Lifecycles — Founder AI" },
      { property: "og:description", content: "Product boundaries, governance separation, orchestration stages and agent/task lifecycle states." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SystemMap,
});
