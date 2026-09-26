import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/softwarewala")({
  beforeLoad: () => {
    throw redirect({ to: "/ai-ceo" });
  },
});
