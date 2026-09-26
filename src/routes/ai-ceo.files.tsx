import { createFileRoute } from "@tanstack/react-router";
import { FilesWorkspace } from "@/components/ai-ceo/system/SystemPages";

export const Route = createFileRoute("/ai-ceo/files")({
  head: () => ({
    meta: [
      { title: "Artifacts & Files — Founder AI" },
      { name: "description", content: "Files attached across projects and research." },
      { property: "og:title", content: "Artifacts & Files — Founder AI" },
      { property: "og:description", content: "Files attached across projects and research." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FilesWorkspace,
});
