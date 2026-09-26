import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppSidebar, useSidebarState } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";

export const Route = createFileRoute("/ai-ceo")({
  head: () => ({
    meta: [
      { title: "AI CEO Command Center — Software Vala" },
      {
        name: "description",
        content:
          "Autonomous AI CEO command center: live action monitoring, decision engine, approvals, risk, performance intelligence and predictive insights.",
      },
      { property: "og:title", content: "AI CEO Command Center — Software Vala" },
      {
        property: "og:description",
        content:
          "Observer and advisor AI CEO: live monitoring, decisions, approvals, risk, performance and predictions.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AICEODashboard,
});

function AICEODashboard() {
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebarState();
  const [streamingOn, setStreamingOn] = useState(true);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <TooltipProvider delayDuration={120}>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar
            onOpenMenu={() => setMobileOpen(true)}
            streamingOn={streamingOn}
            onStreamingToggle={() => setStreamingOn(!streamingOn)}
          />

          <main className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
