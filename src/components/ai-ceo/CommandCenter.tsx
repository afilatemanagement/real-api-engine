import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity, AlertTriangle, BarChart3, Brain, CheckSquare, ClipboardList, DollarSign, FileText, Gauge,
  LayoutDashboard, ListTodo, MessageSquare, Microscope, PanelRightClose, PanelRightOpen, Package,
  RefreshCw, Server, ShoppingCart, Sparkles, Target, UserPlus, Users,
} from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CardSkeleton, KpiGridSkeleton } from "@/components/feedback/Skeletons";
import { useCEOData } from "@/hooks/useCEOData";
import { useIsMobile } from "@/hooks/use-mobile";
import { dataSourceStatus } from "@/components/ai-ceo/DataSourceStatus";
import type { AIObservation } from "@/lib/ceo-types";
import { cn } from "@/lib/utils";

const PANEL_KEY = "sv:founder:context-panel";

/**
 * Pulse metrics. Only values present in the validated operational-data contract are shown;
 * everything else renders an explicit LIVE_DATA_REQUIRED state — never a fabricated number.
 */
interface PulseMetric { key: string; label: string; icon: LucideIcon; value: string | null; unit?: string; module: string; insight: string }

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
const sevOf = (o: AIObservation): Severity => (o.severity === "critical" ? "CRITICAL" : o.severity === "warning" ? "HIGH" : o.category === "attention" ? "MEDIUM" : "LOW");
const sevCls: Record<Severity, string> = {
  CRITICAL: "border-destructive/40 bg-destructive/15 text-destructive",
  HIGH: "border-accent-amber/40 bg-accent-amber/15 text-accent-amber",
  MEDIUM: "border-primary/40 bg-primary/15 text-primary-glow",
  LOW: "border-border bg-muted/40 text-muted-foreground",
};

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground sm:text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CommandCenter() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data, isPersisted, isLoading } = useCEOData();
  const [metric, setMetric] = useState<PulseMetric | null>(null);
  const [attention, setAttention] = useState<AIObservation | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [narrow, setNarrow] = useState(false);
  const source = dataSourceStatus(isPersisted, "AIRA operational data");

  useEffect(() => {
    try { setPanelOpen(sessionStorage.getItem(PANEL_KEY) !== "0"); } catch { /* ignore */ }
    const mq = window.matchMedia("(max-width: 1279px)");
    setNarrow(mq.matches);
    if (mq.matches) setPanelOpen(false);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const togglePanel = (next: boolean) => {
    setPanelOpen(next);
    try { sessionStorage.setItem(PANEL_KEY, next ? "1" : "0"); } catch { /* ignore */ }
  };

  const m = data.metrics;
  const pulse: PulseMetric[] = [
    { key: "revenue", label: "Revenue", icon: DollarSign, value: null, module: "/ai-ceo/performance", insight: "Connect the finance source to see revenue trends." },
    { key: "sales", label: "Sales", icon: ShoppingCart, value: null, module: "/ai-ceo/performance", insight: "Connect the sales source to see pipeline movement." },
    { key: "customers", label: "Active users", icon: Users, value: m.activeUsers.toLocaleString(), module: "/ai-ceo/live-monitor", insight: "Users active across the ecosystem today." },
    { key: "orders", label: "Transactions today", icon: Package, value: m.transactionsToday.toLocaleString(), module: "/ai-ceo/live-monitor", insight: "Completed transactions recorded today." },
    { key: "leads", label: "Leads", icon: UserPlus, value: null, module: "/ai-ceo/performance", insight: "Connect the CRM source to see lead flow." },
    { key: "product", label: "Deploys this week", icon: BarChart3, value: String(m.deploymentFrequency), module: "/ai-ceo/performance", insight: "Product release cadence this week." },
    { key: "ops", label: "Operational activity", icon: Gauge, value: m.systemActivityRate.toLocaleString(), unit: "/day", module: "/ai-ceo/live-monitor", insight: `${m.errorVelocity} errors per hour observed.` },
    { key: "system", label: "System health", icon: Server, value: `${m.apiLatency}`, unit: "ms", module: "/ai-ceo/risk", insight: "Average API latency across services." },
  ];

  const order: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  const items = data.observations.filter((o) => !dismissed.includes(o.id)).sort((a, b) => order.indexOf(sevOf(a)) - order.indexOf(sevOf(b)));
  const pendingDecisions = data.decisions.filter((d) => d.aiDecision === "delay" || d.aiDecision === "escalate");
  const topRisks = data.riskCategories.filter((r) => r.level === "high" || r.level === "critical");

  const pendingTask = (label: string) => {
    toast.info(`${label} is ready to create`, { description: "Tasks save once the task source is connected. Opening Tasks." });
    void navigate({ to: "/ai-ceo/tasks" });
  };

  const quick: { label: string; icon: LucideIcon; tip: string; run: () => void }[] = [
    { label: "Analyze Business", icon: Brain, tip: "Open the Decision Engine", run: () => navigate({ to: "/ai-ceo/decision-engine" }) },
    { label: "Analyze Sales", icon: BarChart3, tip: "Open Performance Intelligence", run: () => navigate({ to: "/ai-ceo/performance" }) },
    { label: "Analyze Product", icon: Target, tip: "Open Predictive Insights", run: () => navigate({ to: "/ai-ceo/predictions" }) },
    { label: "Research", icon: Microscope, tip: "Open Research", run: () => navigate({ to: "/ai-ceo/research" }) },
    { label: "Create Report", icon: FileText, tip: "Open AI Reports", run: () => navigate({ to: "/ai-ceo/reports" }) },
    { label: "Ask Founder AI", icon: MessageSquare, tip: "Open the AI Decision Brief below", run: () => document.getElementById("decision-brief")?.scrollIntoView({ behavior: "smooth" }) },
    { label: "Create Task", icon: ListTodo, tip: "Open Tasks", run: () => pendingTask("New task") },
    { label: "Review Decisions", icon: CheckSquare, tip: "Open Approval Suggestions", run: () => navigate({ to: "/ai-ceo/approvals" }) },
  ];

  const contextPanel = (
    <div className="space-y-5 text-sm">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Company context</p>
        <p className="mt-1">Software Vala · {source}</p>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Current priorities</p>
        <ul className="mt-1 space-y-1">{data.preventiveSuggestions.slice(0, 3).map((p) => <li key={p} className="text-muted-foreground">• {p}</li>)}</ul>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active risks</p>
        <ul className="mt-1 space-y-1">{topRisks.map((r) => <li key={r.id}><Link to="/ai-ceo/risk" className="hover:text-primary-glow">{r.category} <span className="text-muted-foreground">· {r.level}</span></Link></li>)}</ul>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pending decisions</p>
        <ul className="mt-1 space-y-1">{pendingDecisions.slice(0, 4).map((d) => <li key={d.id}><Link to="/ai-ceo/decision-engine" className="hover:text-primary-glow">{d.action}</Link></li>)}</ul>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recent AI activity</p>
        <ul className="mt-1 space-y-1">{data.activityEvents.slice(0, 4).map((e) => <li key={e.id} className="text-muted-foreground">{e.actor} {e.action} {e.target}</li>)}</ul>
      </div>
    </div>
  );

  return (
    <PageShell>
      {/* Header */}
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground"><LayoutDashboard className="h-3.5 w-3.5" /> Founder AI</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Founder Command Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your operational intelligence at a glance.</p>
          <Badge variant="outline" className={cn("mt-3", isPersisted ? "border-accent-emerald/40 text-accent-emerald" : "border-accent-amber/40 text-accent-amber")}>{source}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</span>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}><RefreshCw className="h-4 w-4" /> Refresh</Button>
          <Button variant="outline" size="sm" asChild><Link to="/ai-ceo/activity"><Activity className="h-4 w-4" /> View Activity</Link></Button>
          <Button variant="outline" size="sm" className="hidden xl:inline-flex" onClick={() => togglePanel(!panelOpen)} aria-expanded={panelOpen}>
            {panelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />} Context
          </Button>
          <Button variant="outline" size="sm" className="xl:hidden" onClick={() => togglePanel(true)}><PanelRightOpen className="h-4 w-4" /> Context</Button>
        </div>
      </section>

      <div className={cn("grid gap-6", panelOpen && "xl:grid-cols-[minmax(0,1fr)_320px]")}>
        <div className="min-w-0 space-y-8">
          {/* Company Pulse */}
          <section aria-labelledby="pulse">
            <SectionTitle title="Company Pulse" subtitle="What changed across the business." />
            {isLoading ? <KpiGridSkeleton /> : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {pulse.map((p) => (
                  <button key={p.key} onClick={() => setMetric(p)}
                    className="bento-card group p-4 text-left transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><p.icon className="h-3.5 w-3.5" />{p.label}</span>
                      <span className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">View details →</span>
                    </div>
                    {p.value ? (
                      <p className="mt-2 text-2xl font-semibold tabular-nums">{p.value}<span className="ml-1 text-sm font-normal text-muted-foreground">{p.unit}</span></p>
                    ) : (
                      <p className="mt-2 text-sm font-medium text-muted-foreground">Live data connection required</p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">{p.value ? (isPersisted ? "Live · today" : "Realistic seed · today") : "Awaiting data"}</p>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Attention Center */}
          <section aria-labelledby="attention">
            <SectionTitle title="Attention Center" subtitle="Items requiring Founder attention." action={<Badge variant="outline">{items.length} open</Badge>} />
            {isLoading ? <div className="grid gap-3 md:grid-cols-2"><CardSkeleton /><CardSkeleton /></div> : items.length === 0 ? (
              <div className="bento-card p-8 text-center text-sm text-muted-foreground">Nothing needs your attention right now.</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((o) => {
                  const sev = sevOf(o);
                  return (
                    <article key={o.id} className="bento-card flex flex-col gap-3 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider", sevCls[sev])}>{sev}</span>
                        <span className="text-[11px] text-muted-foreground">{o.timestamp}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{o.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{o.detail}</p>
                      </div>
                      <div className="mt-auto flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setAttention(o)}>View</Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate({ to: "/ai-ceo/decision-engine" })}>Create Decision</Button>
                        <Button size="sm" variant="ghost" onClick={() => pendingTask(o.title)}>Create Task</Button>
                        <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground" onClick={() => setDismissed((d) => [...d, o.id])} aria-label={`Dismiss ${o.title}`}>Dismiss</Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Today */}
          <section aria-labelledby="today">
            <SectionTitle title="Today's Operations" subtitle="What is happening now." />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {[
                { label: "Priorities", value: data.correctiveActions.filter((c) => c.priority === "high").length, to: "/ai-ceo/performance", icon: Target },
                { label: "Pending Decisions", value: pendingDecisions.length, to: "/ai-ceo/decision-engine", icon: Brain },
                { label: "Pending Approvals", value: data.decisions.length, to: "/ai-ceo/approvals", icon: CheckSquare },
                { label: "Active Tasks", value: null, to: "/ai-ceo/tasks", icon: ClipboardList },
                { label: "Important Events", value: data.activityEvents.length, to: "/ai-ceo/activity", icon: Activity },
              ].map((t) => (
                <Link key={t.label} to={t.to} className="bento-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <t.icon className="h-4 w-4 text-primary-glow" />
                  <p className="mt-2 text-xl font-semibold tabular-nums">{t.value ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{t.label}{t.value === null && " · awaiting data"}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Recommendations */}
          <section aria-labelledby="recs">
            <SectionTitle title="AI Recommendations" subtitle="What you should decide." />
            <div className="grid gap-3 lg:grid-cols-3">
              {data.decisions.slice(0, 3).map((d) => (
                <article key={d.id} className="bento-card flex flex-col gap-2 p-4">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> {d.type}</span>
                    <span>{d.confidence}% confidence</span>
                  </div>
                  <h3 className="font-medium">{d.action}</h3>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{d.reasoning}</p>
                  <p className="text-xs text-muted-foreground">Evidence: {d.historicalOutcome}</p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="secondary" onClick={() => navigate({ to: "/ai-ceo/decision-engine" })}>Review</Button>
                    <Button size="sm" variant="ghost" onClick={() => navigate({ to: "/ai-ceo/approvals" })}>Create Decision</Button>
                    <Button size="sm" variant="ghost" onClick={() => pendingTask(d.action)}>Create Task</Button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Quick actions */}
          <section aria-labelledby="quick">
            <SectionTitle title="Quick Actions" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {quick.map((q) => (
                <Tooltip key={q.label}>
                  <TooltipTrigger asChild>
                    <button onClick={q.run} className="bento-card flex items-center gap-2.5 p-3 text-left text-sm font-medium transition-colors hover:border-primary/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <q.icon className="h-4 w-4 shrink-0 text-primary-glow" /> <span className="truncate">{q.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{q.tip}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </section>
        </div>

        {panelOpen && !narrow && (
          <aside className="bento-card hidden h-fit p-5 xl:sticky xl:top-20 xl:block" aria-label="Context panel">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Context</h2>
              <Button size="icon" variant="ghost" onClick={() => togglePanel(false)} aria-label="Collapse context panel"><PanelRightClose className="h-4 w-4" /></Button>
            </div>
            {isLoading ? <CardSkeleton /> : contextPanel}
          </aside>
        )}
      </div>

      {/* Mobile / tablet context sheet */}
      <Sheet open={panelOpen && narrow} onOpenChange={togglePanel}>
        <SheetContent side={isMobile ? "bottom" : "right"} className="max-h-[85vh] overflow-y-auto">
          <SheetHeader><SheetTitle>Context</SheetTitle><SheetDescription>Priorities, risks and decisions in view.</SheetDescription></SheetHeader>
          <div className="mt-4">{contextPanel}</div>
        </SheetContent>
      </Sheet>

      {/* Metric detail */}
      <Sheet open={!!metric} onOpenChange={(o) => !o && setMetric(null)}>
        <SheetContent className="overflow-y-auto">
          {metric && (
            <>
              <SheetHeader><SheetTitle>{metric.label}</SheetTitle><SheetDescription>{metric.insight}</SheetDescription></SheetHeader>
              <dl className="mt-6 space-y-3 text-sm">
                <div><dt className="text-muted-foreground">Current period</dt><dd className="font-medium">{metric.value ? `${metric.value}${metric.unit ?? ""}` : "Awaiting data"}</dd></div>
                <div><dt className="text-muted-foreground">Previous period & trend</dt><dd>Historical comparison appears once the live source is connected.</dd></div>
                <div><dt className="text-muted-foreground">Data source</dt><dd>{metric.value ? source : "Not connected"}</dd></div>
                <div><dt className="text-muted-foreground">Recommended next action</dt><dd>Review the related module for context.</dd></div>
              </dl>
              <Button className="mt-6" asChild><Link to={metric.module}>Analyze</Link></Button>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Attention drawer */}
      <Sheet open={!!attention} onOpenChange={(o) => !o && setAttention(null)}>
        <SheetContent className="overflow-y-auto">
          {attention && (
            <>
              <SheetHeader>
                <span className={cn("w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold", sevCls[sevOf(attention)])}>{sevOf(attention)}</span>
                <SheetTitle>{attention.title}</SheetTitle>
                <SheetDescription>{attention.detail}</SheetDescription>
              </SheetHeader>
              <dl className="mt-6 space-y-3 text-sm">
                <div><dt className="text-muted-foreground">Affected area</dt><dd className="capitalize">{attention.category}</dd></div>
                <div><dt className="text-muted-foreground">Observed</dt><dd>{attention.timestamp}</dd></div>
                <div><dt className="text-muted-foreground">Evidence</dt><dd>Evidence source will appear here when connected.</dd></div>
                <div><dt className="text-muted-foreground">Source</dt><dd>{source}</dd></div>
                <div><dt className="text-muted-foreground">Audit trail</dt><dd>Audit entries appear once decisions are recorded.</dd></div>
              </dl>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button onClick={() => navigate({ to: "/ai-ceo/decision-engine" })}><AlertTriangle className="h-4 w-4" /> Create Decision</Button>
                <Button variant="outline" onClick={() => pendingTask(attention.title)}>Create Task</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}
