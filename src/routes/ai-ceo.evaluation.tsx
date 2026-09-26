import { createFileRoute } from "@tanstack/react-router";
import { EvaluationCenter } from "@/components/ai-ceo/system/SystemPages";

export const Route = createFileRoute("/ai-ceo/evaluation")({
  head: () => ({
    meta: [
      { title: "AI Evaluation — Founder AI" },
      { name: "description", content: "Operational AI quality: recommendation accuracy, overrides and reliability." },
      { property: "og:title", content: "AI Evaluation — Founder AI" },
      { property: "og:description", content: "Operational AI quality: recommendation accuracy, overrides and reliability." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EvaluationCenter,
});
