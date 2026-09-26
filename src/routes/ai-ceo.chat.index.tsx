import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { createThread } from "@/components/ai-ceo/chat/store";

export const Route = createFileRoute("/ai-ceo/chat/")({
  validateSearch: (s: Record<string, unknown>): { context?: string } =>
    typeof s.context === "string" && s.context ? { context: s.context.slice(0, 120) } : {},
  head: () => ({
    meta: [
      { title: "Ask Founder AI — Software Vala" },
      { name: "description", content: "Ask questions about operations, risks, decisions and performance, answered from on-record data with sources." },
      { property: "og:title", content: "Ask Founder AI — Software Vala" },
      { property: "og:description", content: "Operational Q&A grounded in Founder AI records, with citations." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewChat,
});

function NewChat() {
  const { context } = Route.useSearch();
  const navigate = useNavigate();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const t = createThread(context);
    void navigate({ to: "/ai-ceo/chat/$threadId", params: { threadId: t.id }, replace: true });
  }, [context, navigate]);
  return <p className="p-10 text-center text-sm text-muted-foreground" role="status">Starting a new conversation…</p>;
}
