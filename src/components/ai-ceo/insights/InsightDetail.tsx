import { Link } from "@tanstack/react-router";
import { Eye, FileText, Share2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { useCEOData } from "@/hooks/useCEOData";
import { dataSourceStatus } from "@/components/ai-ceo/DataSourceStatus";
import { BackLink, DetailSection, EvidencePanel, SeverityBadge, Unavailable } from "@/components/ai-ceo/governance/shared";
import { useSessionMap } from "@/components/ai-ceo/governance/state";
import { Confidence, ForecastChart, KindChip, insightView } from "./shared";
import { INSIGHT_STATE_KEY, type InsightState } from "./InsightsFeed";

export function InsightDetail({ id }: { id: string }) {
  const { data, isPersisted, isLoading } = useCEOData();
  const [state, setState] = useSessionMap<InsightState | "">(INSIGHT_STATE_KEY);
  const p = data.predictions.find((x) => x.id === id);
  if (!p) return <PageShell><BackLink to="/ai-ceo/predictions" label="Predictive Insights" /><div className="bento-card p-10 text-center text-sm text-muted-foreground">{isLoading ? "Loading insight…" : "This insight isn't available."}</div></PageShell>;
  const v = insightView(p);
  const s = state[p.id];
  const source = dataSourceStatus(isPersisted, "prediction record");

  return (
    <PageShell>
      <BackLink to="/ai-ceo/predictions" label="Predictive Insights" />
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2"><SeverityBadge level={v.severity} /><KindChip kind="Prediction" /><span className="text-xs text-muted-foreground">{v.kind} · {v.signalType} · {p.timeline} · Status: {s === "dismissed" ? "dismissed" : s === "watch" ? "watching" : "open"}</span></div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{p.title}</h1>
        <Confidence value={p.confidence} freshness={isPersisted ? "live" : "seed snapshot"} />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" asChild><Link to="/ai-ceo/decision-engine">Add to Decision</Link></Button>
          <Button size="sm" variant="outline" onClick={() => setState(p.id, s === "watch" ? "" : "watch")}><Eye className="h-4 w-4" /> {s === "watch" ? "Unwatch" : "Watch"}</Button>
          <Button size="sm" variant="ghost" onClick={() => toast.info("Assignment connects with team data in a later phase.")}><UserPlus className="h-4 w-4" /> Assign</Button>
          <Button size="sm" variant="ghost" asChild><Link to="/ai-ceo/reports"><FileText className="h-4 w-4" /> Open Report</Link></Button>
          <Button size="sm" variant="ghost" onClick={() => { void navigator.clipboard?.writeText(window.location.href); toast.success("Link copied"); }}><Share2 className="h-4 w-4" /> Share</Button>
          <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setState(p.id, s === "dismissed" ? "" : "dismissed")}>{s === "dismissed" ? "Restore" : "Dismiss"}</Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailSection title="Executive summary" className="lg:col-span-2">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div><dt className="text-xs uppercase tracking-wider">What was detected?</dt><dd className="text-foreground">{p.detail}</dd></div>
            <div><dt className="text-xs uppercase tracking-wider">What could happen?</dt><dd>{v.kind === "Opportunity" ? "Upside if acted on within the horizon." : "Operational impact if unaddressed."} Horizon: {p.timeline}.</dd></div>
          </dl>
        </DetailSection>
        <DetailSection title="Signal"><p><KindChip kind="Observed" /> <span className="ml-1">{v.signalType} · direction {v.direction.toLowerCase()}</span></p><p className="mt-2 text-xs">Current vs previous value, baseline and deviation appear when the metric series is connected.</p></DetailSection>
        <DetailSection title="Forecast">
          <ForecastChart data={[]} height={160} emptyText="Forecast range appears when the historical series is connected." />
        </DetailSection>
        <DetailSection title="Evidence"><EvidencePanel items={[{ source, title: v.signalType, summary: p.detail, freshness: isPersisted ? "Live" : "Seed snapshot" }]} /></DetailSection>
        <DetailSection title="Drivers"><Unavailable>Contributing factors will appear when driver analysis is connected.</Unavailable></DetailSection>
        <DetailSection title="Possible outcomes">
          <p className="mb-2"><KindChip kind="Scenario" /> <span className="ml-1 text-xs">Scenario analysis is separate from the prediction.</span></p>
          <Button size="sm" variant="outline" asChild><Link to="/ai-ceo/predictions/scenarios">Explore scenarios</Link></Button>
        </DetailSection>
        <DetailSection title="Recommended response">
          <p>Review in the Decision Engine; any action goes through Founder approval. Nothing runs automatically.</p>
          <div className="mt-3 flex gap-2"><Button size="sm" asChild><Link to="/ai-ceo/decision-engine">Open Decision Engine</Link></Button><Button size="sm" variant="ghost" asChild><Link to="/ai-ceo/approvals">Approvals</Link></Button></div>
        </DetailSection>
      </div>
    </PageShell>
  );
}
