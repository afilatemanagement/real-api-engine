import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/owner")({
  head: () => ({ meta: [
    { title: "Owner AI CEO Access — Software Vala" },
    { name: "description", content: "Owner access redirect for the Software Vala AI CEO command center." },
    { property: "og:title", content: "Owner AI CEO Access — Software Vala" },
    { property: "og:description", content: "Owner access redirect for the Software Vala AI CEO command center." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  beforeLoad: () => {
    throw redirect({ to: "/ai-ceo" });
  },
});
