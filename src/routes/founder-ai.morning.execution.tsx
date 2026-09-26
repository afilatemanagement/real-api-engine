import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/founder-ai/morning/execution")({
  beforeLoad: () => { throw redirect({ to: "/ai-ceo/morning/execution" }); },
});
