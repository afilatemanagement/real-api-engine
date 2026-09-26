import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Software Vala AI CEO" },
    { name: "description", content: "Open the Software Vala AI CEO executive command center." },
    { property: "og:title", content: "Software Vala AI CEO" },
    { property: "og:description", content: "Open the Software Vala AI CEO executive command center." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  beforeLoad: () => {
    throw redirect({ to: "/ai-ceo" });
  },
});
