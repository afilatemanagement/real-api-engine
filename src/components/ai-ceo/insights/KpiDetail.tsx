import { Link } from "@tanstack/react-router";

import { PageShell } from "@/components/layout/PageShell";
import { useCEOData } from "@/hooks/useCEOData";
import { dataSourceStatus } from "@/components/ai-ceo/DataSourceStatus";
import { BackLink, DetailSection, Unavailable } from "@/components/ai-ceo/governance/shared";
import { ForecastChart, KindChip, kpiViews, trendLabel } from "./shared";
import { TrendIcon } from "./PerformanceWorkspace";

export function KpiDetail({ id }: { id: string }) {
  const { data, isPersisted, isLoading } = useCEOData();
  const k = kpiViews(data.productivityMetrics, data.rolePerformance).find((x) => x.id === id);
  if (!k) return <PageShell><BackLink to="/ai-ceo/performance" label="Performance Intelligence" /><div className="bento-card p-10 text-center text-sm text-muted-foreground">{isLoading ? "Loading KPI…" : "This KPI isn't available."}</div></PageShell>;

  return (
    <PageShell>
      <BackLink to="/ai-ceo/performance" label="Performance Intelligence" />
      <header>
        <div className="flex items-center gap-2"><KindChip kind="Observed" /><span className="text-xs text-muted-foreground">{k.group}{k.owner ? ` · ${k.owner}` : ""} · {dataSourceStatus(isPersisted, "KPI")}</span></div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{k.owner ? `${k.owner} · ` : ""}{k.label}</h1>
        <p className="mt-2 flex items-center gap-2 text-3xl font-semibold tabular-nums">{k.value}<TrendIcon t={k.trend} /><span className="text-sm font-normal text-muted-foreground">{trendLabel(k.trend)}{k.change ? ` · ${k.change}` : ""}</span></p>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        <DetailSection title="Definition"><p>{k.owner ? `Composite ${k.label.toLowerCase()} score for ${k.owner}.` : `${k.label} across operations.`}</p></DetailSection>
        <DetailSection title="Target & variance"><p>{k.target ? `Target ${k.target} · current ${k.value}` : "No target set."}</p></DetailSection>
        <DetailSection title="Historical trend" className="lg:col-span-2"><ForecastChart data={[]} /></DetailSection>
        <DetailSection title="Drivers & segments"><Unavailable>Drivers and segments will appear when connected.</Unavailable></DetailSection>
        <DetailSection title="Related">
          <ul className="space-y-1.5">
            <li><Link className="text-primary-glow hover:underline" to="/ai-ceo/chat" search={{ context: `KPI: ${k.label}` }}>Explain this KPI</Link></li>
            <li><Link className="text-primary-glow hover:underline" to="/ai-ceo/predictions">Related insights</Link></li>
            <li><Link className="text-primary-glow hover:underline" to="/ai-ceo/decision-engine">Related decisions</Link></li>
            <li><Link className="text-primary-glow hover:underline" to="/ai-ceo/risk">Related risks</Link></li>
            <li><Link className="text-primary-glow hover:underline" to="/ai-ceo/reports">Related reports</Link></li>
          </ul>
        </DetailSection>
      </div>
    </PageShell>
  );
}
