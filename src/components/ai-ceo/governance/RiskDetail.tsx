import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { useCEOData } from "@/hooks/useCEOData";
import { dataSourceStatus } from "@/components/ai-ceo/DataSourceStatus";
import { AuditTimeline, BackLink, DetailSection, EvidencePanel, SeverityBadge, Unavailable, riskSeverity } from "./shared";

export function RiskDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const { data, isPersisted, isLoading } = useCEOData();
  const r = data.riskCategories.find((x) => x.id === id);
  if (!r) return <PageShell><BackLink to="/ai-ceo/risk" label="Risk & Compliance" /><div className="bento-card p-10 text-center text-sm text-muted-foreground">{isLoading ? "Loading risk…" : "This risk isn't available."}</div></PageShell>;
  const toTask = () => { toast.info("Task ready to create", { description: "Tasks save once the task source is connected." }); void navigate({ to: "/ai-ceo/tasks" }); };

  return (
    <PageShell>
      <BackLink to="/ai-ceo/risk" label="Risk & Compliance" />
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2"><SeverityBadge level={riskSeverity(r)} /><span className="text-xs text-muted-foreground">Status: open · Owner: unassigned</span></div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{r.category}</h1>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={toTask}>Create Task</Button>
          <Button size="sm" variant="ghost" asChild><Link to="/ai-ceo/chat" search={{ context: `Risk: ${r.category}` }}>Ask Founder AI</Link></Button>
          <Button size="sm" variant="outline" asChild><Link to="/ai-ceo/decision-engine">Create Decision</Link></Button>
          <Button size="sm" variant="ghost" onClick={() => toast.info("Owner assignment connects with team data in a later phase.")}>Assign Owner</Button>
        </div>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <DetailSection title="Description"><p>{r.issues} open issues in {r.category.toLowerCase()} · risk score {r.score}/100 · trend {r.trend}.</p></DetailSection>
        <DetailSection title="Evidence"><EvidencePanel items={[{ source: dataSourceStatus(isPersisted, "risk register"), title: `${r.category} score`, summary: `Score ${r.score}, ${r.issues} open issues`, freshness: isPersisted ? "Live" : "Seed snapshot" }]} /></DetailSection>
        <DetailSection title="Impact & probability"><Unavailable>Impact and probability estimates appear when risk modelling is connected.</Unavailable></DetailSection>
        <DetailSection title="Mitigation">
          <ul className="space-y-1">{data.preventiveSuggestions.slice(0, 3).map((p) => <li key={p}>• {p}</li>)}</ul>
          <p className="mt-2 text-xs">Owner, deadline and progress appear once mitigation tracking is connected.</p>
        </DetailSection>
        <DetailSection title="Dependencies"><Unavailable>Dependencies will appear when connected.</Unavailable></DetailSection>
        <DetailSection title="Timeline & audit">
          <AuditTimeline entries={[{ actor: "Founder AI", kind: "AI", action: `Detected — ${r.level} severity`, at: "On record" }]} />
        </DetailSection>
      </div>
    </PageShell>
  );
}
