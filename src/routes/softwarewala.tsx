import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/softwarewala")({
  head: () => ({ meta: [
    { title: "Software Vala Executive Intelligence" },
    { name: "description", content: "Software Vala executive intelligence and AI CEO access." },
    { property: "og:title", content: "Software Vala Executive Intelligence" },
    { property: "og:description", content: "Software Vala executive intelligence and AI CEO access." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  beforeLoad: () => {
    throw redirect({ to: "/ai-ceo" });
  },
});
