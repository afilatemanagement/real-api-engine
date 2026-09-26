import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/founder-ai/morning/plan")({
  beforeLoad: () => { throw redirect({ to: "/ai-ceo/morning/plan" }); },
});
