import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/founder-ai/workers/")({
  beforeLoad: () => { throw redirect({ to: "/ai-ceo/workers" }); },
});
