import { createFileRoute } from "@tanstack/react-router";
import { CompanyBrain } from "@/components/ai-ceo/knowledge/CompanyBrain";

export const Route = createFileRoute("/ai-ceo/company-brain/")({
  head: () => ({
    meta: [
      { title: "Company Brain — Founder AI" },
      { name: "description", content: "Company knowledge, policies and operating context in one place." },
      { property: "og:title", content: "Company Brain — Founder AI" },
      { property: "og:description", content: "Company knowledge, policies and operating context in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompanyBrain,
});
