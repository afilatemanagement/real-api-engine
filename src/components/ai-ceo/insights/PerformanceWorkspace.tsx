import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { HelpCircle, Minus, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { KpiGridSkeleton } from "@/components/feedback/Skeletons";
import { useCEOData } from "@/hooks/useCEOData";
import { dataSourceStatus } from "@/components/ai-ceo/DataSourceStatus";
import { Unavailable } from "@/components/ai-ceo/governance/shared";
import { KindChip, kpiViews, trendLabel, type KpiView } from "./shared";

export const TrendIcon = ({ t }: { t: string }) => (t === "up" ? <TrendingUp className="h-3.5 w-3.5 text-accent-emerald" aria-hidden /> : t === "down" ? <TrendingDown className="h-3.5 w-3.5 text-destructive" aria-hidden /> : <Minus className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />);

export function PerformanceWorkspace() {
  const { data, isPersisted, isLoading } = useCEOData();
  const [group, setGroup] = useState("all");
  const [why, setWhy] = useState<KpiView | null>(null);
  const kpis = kpiViews(data.productivityMetrics, data.rolePerformance).filter((k) => group === "all" || k.group === group);

  return (
    <PageShell>
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="h-3.5 w-3.5" /> Founder AI · Understand</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Performance Intelligence</h1>
          <p className="mt-1 text-sm text-muted-foreground">Understand operational performance, trends, drivers, and business outcomes.</p>
          <p className="mt-2 text-[11px] text-muted-foreground">{dataSourceStatus(isPersisted, "performance metrics")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger className="h-9 w-[170px]" aria-label="Business area"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All areas</SelectItem><SelectItem value="Productivity">Productivity</SelectItem><SelectItem value="Team performance">Team performance</SelectItem></SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}><RefreshCw className="h-4 w-4" /> Refresh</Button>
        </div>
      </section>

      <section aria-label="Executive KPIs">
        <h2 className="mb-2 text-sm font-semibold">Executive KPIs</h2>
        {isLoading ? <KpiGridSkeleton /> : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {kpis.map((k) => (
              <Link key={k.id} to="/ai-ceo/performance/$kpi" params={{ kpi: k.id }} className="bento-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="flex items-center justify-between text-xs text-muted-foreground"><span className="truncate">{k.owner ? `${k.owner} · ` : ""}{k.label}</span><TrendIcon t={k.trend} /></div>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{k.value}{k.owner && <span className="ml-1 text-xs font-normal text-muted-foreground">score</span>}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {k.change ? `Change ${k.change}` : ""}{k.target ? `Target ${k.target}` : ""} · {trendLabel(k.trend)} · {isPersisted ? "live" : "seed"}
                </p>
              </Link>
            ))}
            {["Revenue", "Retention", "System availability"].map((l) => (
              <div key={l} className="bento-card p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="mt-2 text-sm text-muted-foreground">Live data connection required</p></div>
            ))}
          </div>
        )}
      </section>

      <section aria-label="Performance trends">
        <h2 className="mb-2 text-sm font-semibold">Performance Trends</h2>
        <ul className="bento-card divide-y divide-border">
          {data.rolePerformance.map((r) => (
            <li key={r.role} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <TrendIcon t={r.trend} />
              <span className="min-w-0 flex-1"><b>{r.role}</b> <span className="text-muted-foreground">· {r.metric}</span></span>
              <KindChip kind="Observed" />
              <span className="tabular-nums">{r.change}</span>
              <span className="w-20 text-xs text-muted-foreground">{trendLabel(r.trend)}</span>
              <Button size="sm" variant="ghost" onClick={() => setWhy(kpiViews([], [r])[0] ?? null)}><HelpCircle className="h-4 w-4" /> Why did this change?</Button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Corrective actions">
        <h2 className="mb-2 text-sm font-semibold">Corrective actions</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {data.correctiveActions.map((c) => (
            <div key={c.team + c.issue} className="bento-card p-4 text-sm">
              <p className="text-xs text-muted-foreground">{c.team} · {c.priority} priority</p>
              <p className="mt-1 font-medium">{c.issue}</p>
              <p className="text-muted-foreground">{c.action}</p>
              <Button size="sm" variant="ghost" className="mt-2" asChild><Link to="/ai-ceo/decision-engine">Open Decision</Link></Button>
            </div>
          ))}
        </div>
      </section>

      <Sheet open={!!why} onOpenChange={(o) => !o && setWhy(null)}>
        <SheetContent className="overflow-y-auto">
          {why && (
            <>
              <SheetHeader><SheetTitle>Why did {why.owner} · {why.label} change?</SheetTitle><SheetDescription>Explanation is based on the data available now.</SheetDescription></SheetHeader>
              <dl className="mt-6 space-y-4 text-sm">
                <div><dt className="text-muted-foreground">Observed change</dt><dd>{why.change} · {trendLabel(why.trend)}</dd></div>
                <div><dt className="text-muted-foreground">Potential drivers</dt><dd><Unavailable>Driver analysis will appear when connected.</Unavailable></dd></div>
                <div><dt className="text-muted-foreground">Unknowns</dt><dd>Seasonality, team size changes and data gaps are not yet accounted for.</dd></div>
                <div><dt className="text-muted-foreground">Recommended investigation</dt><dd>Open the KPI and review related decisions and risks.</dd></div>
              </dl>
              <Button className="mt-6" asChild><Link to="/ai-ceo/performance/$kpi" params={{ kpi: why.id }}>Open KPI</Link></Button>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}
