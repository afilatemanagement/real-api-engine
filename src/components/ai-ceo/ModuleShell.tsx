import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, PlugZap } from "lucide-react";

import { EmptyState, PageBanner, PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";

/** Intentional UI screen for Operations modules whose data source is connected in a later phase. */
export function ModuleShell({ title, subtitle, icon }: { title: string; subtitle: string; icon: LucideIcon }) {
  return (
    <PageShell>
      <PageBanner eyebrow="Founder AI · Operations" title={title} subtitle={subtitle} icon={icon} status="Awaiting live connection" />
      <EmptyState
        icon={PlugZap}
        title={`${title} will appear here once connected`}
        description="This workspace is ready. Its records appear as soon as the operational data source is connected — nothing here is simulated."
        action={
          <Button asChild variant="outline">
            <Link to="/ai-ceo"><ArrowLeft className="h-4 w-4" /> Back to Command Center</Link>
          </Button>
        }
      />
    </PageShell>
  );
}
