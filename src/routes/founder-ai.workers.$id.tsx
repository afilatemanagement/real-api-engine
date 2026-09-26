import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/founder-ai/workers/$id")({
  beforeLoad: ({ params }) => { throw redirect({ to: "/ai-ceo/workers/$id", params: { id: params.id } }); },
});
