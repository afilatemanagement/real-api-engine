import { createFileRoute } from "@tanstack/react-router";

import { ChatWorkspace } from "@/components/ai-ceo/chat/ChatWorkspace";

export const Route = createFileRoute("/ai-ceo/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Conversation — Ask Founder AI" },
      { name: "description", content: "A Founder AI conversation with cited operational sources." },
      { property: "og:title", content: "Conversation — Ask Founder AI" },
      { property: "og:description", content: "A Founder AI conversation with cited operational sources." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  return <ChatWorkspace key={threadId} threadId={threadId} />;
}
