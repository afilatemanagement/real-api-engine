import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, Lock, RefreshCw, Sunrise } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DetailSection, SeverityBadge, Unavailable, type Severity } from "@/components/ai-ceo/governance/shared";
import { useCEOData } from "@/hooks/useCEOData";
import { AGENTS, agentById, agentForText } from "@/components/ai-ceo/ops/catalog";
import { useOps } from "@/components/ai-ceo/ops/store";
import { AssignTaskDialog, Pill, PreviewNotice, agentStatus, fmt } from "@/components/ai-ceo/ops/ui";
import { cn } from "@/lib/utils";

/**
 * Morning AI Agent command center (UI only). Every item is derived from the validated
 * operational record + session preview state. Nothing is executed; unsupported fields
 * (owners, deadlines, meetings) are shown as unavailable rather than invented.
 */
type Level = "Critical" | "High" | "Medium" | "Normal" | "Low";
const LEVELS: Level[] = ["Critical", "High", "Medium", "Normal", "Low"];
const toSev = (l: Level): Severity => (l === "Critical" ? "CRITICAL" : l === "High" ? "HIGH" : l === "Medium" ? "MEDIUM" : "LOW");
interface Priority {
  id: string; objective: string; reason: string; level: Level; agentId: string; risk: Severity;
  evidence: string; confidence?: number; link: { to: string; id: string };
}
const KEY = "sv:founder:morning-preview";
interface MState { levels: Record<string, Level>; escalated: string[]; resolved: string[] }
function useMorning() {
  const [s, setS] = useState<MState>({ levels: {}, escalated: [], resolved: [] });
  useEffect(() => { try { setS({ levels: {}, escalated: [], resolved: [], ...JSON.parse(sessionStorage.getItem(KEY) ?? "{}") }); } catch { /* ignore */ } }, []);
  const set = (fn: (x: MState) => MState) => setS((x) => { const n = fn(x); try { sessionStorage.setItem(KEY, JSON.stringify(n)); } catch { /* ignore */ } return n; });
  return [s, set] as const;
}
const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
const Stat = ({ k, v, tone }: { k: string; v: number | string; tone?: string | undefined }) => (
  <div className="bento-card p-3"><p className={cn("text-xl font-semibold tabular-nums", tone)}>{v}</p><p className="text-[11px] text-muted-foreground">{k}</p></div>
);

export function MorningCenter() {
  const { data, isPersisted, isLoading } = useCEOData();
  const [ops, updateOps] = useOps();
  const [m, setM] = useMorning();
  const [refreshing, setRefreshing] = useState(false);
  const [evidence, setEvidence] = useState<Priority | null>(null);
  const [assign, setAssign] = useState<Priority | null>(null);
  const allowed = true; // Founder role — permission model from Security & Permissions.

  const base = useMemo<Priority[]>(() => [
    ...data.decisions.filter((d) => d.aiDecision === "escalate" || d.aiDecision === "delay").map((d) => ({
      id: `d-${d.id}`, objective: `Decide: ${d.action}`, reason: d.reasoning, level: (d.aiDecision === "escalate" ? "Critical" : "High") as Level,
      agentId: agentForText(`${d.action} ${d.type}`).id, risk: (d.aiDecision === "escalate" ? "CRITICAL" : "HIGH") as Severity,
      evidence: d.historicalOutcome, confidence: d.confidence, link: { to: "/ai-ceo/decision-engine/$id", id: d.id },
    })),
    ...data.riskCategories.filter((r) => r.level !== "low").map((r) => ({
      id: `r-${r.id}`, objective: `Reduce ${r.category} exposure`, reason: `${r.issues} open issues, score ${r.score}, trend ${r.trend}.`,
      level: (r.level === "critical" ? "Critical" : r.level === "high" ? "High" : "Medium") as Level, agentId: agentForText(r.category).id,
      risk: r.level.toUpperCase() as Severity, evidence: `Risk register: ${r.category}`, link: { to: "/ai-ceo/risk/$id", id: r.id },
    })),
    ...data.correctiveActions.map((c, i) => ({
      id: `c-${i}`, objective: c.action, reason: `${c.team}: ${c.issue}`, level: (c.priority === "high" ? "High" : "Normal") as Level,
      agentId: agentForText(`${c.team} ${c.issue}`).id, risk: (c.priority === "high" ? "HIGH" : "MEDIUM") as Severity,
      evidence: `Corrective action for ${c.team}`, link: { to: "/ai-ceo/performance", id: "" },
    })),
  ], [data]);
  const priorities = base.filter((p) => !m.resolved.includes(p.id)).map((p) => ({ ...p, level: m.levels[p.id] ?? p.level }));

  const overnight = data.observations;
  const critical = overnight.filter((o) => o.severity === "critical");
  const pendingDecisions = data.decisions.filter((d) => d.aiDecision !== "approve");
  const risks = data.riskCategories.filter((r) => r.level === "high" || r.level === "critical");
  const statuses = AGENTS.map((a) => ({ a, st: agentStatus(a, ops.tasks, ops.paused, ops.killSwitch), tasks: ops.tasks.filter((t) => t.agentId === a.id && t.status !== "Completed" && t.status !== "Cancelled") }));
  const count = (s: string) => statuses.filter((x) => x.st === s).length;
  const failedRuns = ops.runs.filter((r) => r.status === "Failed" || r.status === "Stopped");
  const escalations = [
    ...ops.tasks.filter((t) => t.status === "Blocked").map((t) => ({ id: `t-${t.id}`, kind: "Blocked task", title: t.title, agentId: t.agentId })),
    ...failedRuns.map((r) => ({ id: `f-${r.id}`, kind: "Failed agent", title: `${agentById(r.agentId)?.name ?? r.agentId} run ${r.status.toLowerCase()}`, agentId: r.agentId })),
    ...ops.tasks.filter((t) => t.status === "Waiting Approval").map((t) => ({ id: `a-${t.id}`, kind: "Approval required", title: t.title, agentId: t.agentId })),
    ...ops.tasks.filter((t) => t.dependsOn.length && t.status === "Queued").map((t) => ({ id: `p-${t.id}`, kind: "Dependency issue", title: t.title, agentId: t.agentId })),
    ...data.decisions.filter((d) => d.aiDecision === "escalate").map((d) => ({ id: `h-${d.id}`, kind: "Human intervention required", title: d.action, agentId: agentForText(d.action).id })),
  ].filter((e) => !m.resolved.includes(e.id));
  const prog = {
    Planned: ops.tasks.filter((t) => t.status === "Queued").length,
    "In Progress": ops.tasks.filter((t) => t.status === "In Progress" || t.status === "Waiting Approval").length,
    Completed: ops.tasks.filter((t) => t.status === "Completed").length,
    Blocked: ops.tasks.filter((t) => t.status === "Blocked").length,
    Failed: ops.runs.filter((r) => r.status === "Failed").length,
    Verified: ops.runs.filter((r) => r.status === "Completed").length,
  };
  const total = Object.values(prog).reduce((a, b) => a + b, 0);

  const refresh = () => { setRefreshing(true); setTimeout(() => { setRefreshing(false); toast.success(isPersisted ? "Operating picture refreshed" : "Refreshed from seed record — live data not connected"); }, 700); };
  const reprioritize = (p: Priority) => { const next = LEVELS[(LEVELS.indexOf(p.level) + 1) % LEVELS.length]!; setM((x) => ({ ...x, levels: { ...x.levels, [p.id]: next } })); toast(`Priority set to ${next} (this tab only)`); };
  const escalate = (id: string) => { setM((x) => ({ ...x, escalated: [...new Set([...x.escalated, id])], levels: { ...x.levels, [id]: "Critical" } })); toast("Escalated to Founder (preview)"); };
  const resolve = (id: string) => { setM((x) => ({ ...x, resolved: [...x.resolved, id] })); toast.success("Marked resolved (preview)"); };

  if (!allowed) return <PageShell><Unavailable><Lock className="mr-1 inline h-4 w-4" />You need Founder permission to view the Morning Command Center.</Unavailable></PageShell>;

  return (
    <PageShell>
      <section className="bento-card relative overflow-hidden p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Sunrise className="h-3.5 w-3.5 text-accent-amber" /> Morning AI Agent · Daily operating picture</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{greeting()}, Founder</h1>
            <p className="mt-1 text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", dateStyle: "long" } as Intl.DateTimeFormatOptions)} · {critical.length} critical changes · {priorities.filter((p) => p.level === "Critical").length} critical priorities · {escalations.length} escalations</p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>{refreshing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />}Refresh</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <span className={cn("rounded-md border px-2 py-0.5", isPersisted ? "border-accent-emerald/40 text-accent-emerald" : "border-accent-amber/40 text-accent-amber")}>{isLoading ? "Loading operational record…" : isPersisted ? "Live operational record" : "Partial data: seed record, live connection not configured"}</span>
          <span className="rounded-md border border-border px-2 py-0.5 text-muted-foreground">Calendar / meetings: not connected</span>
        </div>
      </section>
      <PreviewNotice>Prototype preview: the Morning AI Agent does not run. Priorities, allocation and escalations are derived from the operational record; changes stay in this browser tab.</PreviewNotice>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat k="Critical changes" v={critical.length} tone={critical.length ? "text-destructive" : undefined} />
        <Stat k="Pending decisions" v={pendingDecisions.length} />
        <Stat k="Pending approvals" v={ops.tasks.filter((t) => t.status === "Waiting Approval").length} />
        <Stat k="High / critical risks" v={risks.length} />
        <Stat k="Escalations" v={escalations.length} />
        <Stat k="System activity" v={`${data.metrics.systemActivityRate}%`} />
      </div>

      <Tabs defaultValue="brief">
        <TabsList className="flex h-auto flex-wrap">
          {["brief", "priorities", "workforce", "plan", "escalations", "progress"].map((t) => <TabsTrigger key={t} value={t} className="capitalize">{t === "brief" ? "Morning brief" : t}</TabsTrigger>)}
        </TabsList>

        <TabsContent value="brief" className="grid gap-4 lg:grid-cols-3">
          <DetailSection title="Overnight">
            {overnight.length === 0 ? <Unavailable>No overnight events on record.</Unavailable> : <ul className="space-y-2">{overnight.map((o) => <li key={o.id} className="text-sm"><div className="flex items-center gap-2"><SeverityBadge level={o.severity === "critical" ? "CRITICAL" : o.severity === "warning" ? "HIGH" : "LOW"} /><span className="font-medium">{o.title}</span></div><p className="mt-0.5 text-xs text-muted-foreground">{o.detail} · {o.timestamp}</p></li>)}</ul>}
            <p className="mt-3 text-xs text-muted-foreground">Completed work: {prog.Completed} · Unresolved: {prog.Planned + prog["In Progress"] + prog.Blocked}</p>
          </DetailSection>
          <DetailSection title="Today">
            <ul className="space-y-2 text-sm">{priorities.slice(0, 5).map((p) => <li key={p.id} className="flex items-start gap-2"><SeverityBadge level={toSev(p.level)} /><span>{p.objective}</span></li>)}</ul>
            <p className="mt-3 text-xs text-muted-foreground">Deadlines and meetings: unavailable until tasks/calendar are connected.</p>
            <p className="mt-1 text-xs text-muted-foreground">Operational targets: {data.productivityMetrics.map((x) => `${x.metric} ${x.value} → ${x.target}`).join(" · ") || "—"}</p>
          </DetailSection>
          <DetailSection title="AI assessment">
            {data.predictions.slice(0, 3).map((p) => <div key={p.id} className="mb-3 text-sm"><p className="font-medium">{p.title}</p><p className="text-xs text-muted-foreground">{p.detail}</p><p className="mt-1 text-[11px]">Confidence {p.confidence}% · Prediction, not observation · <Link to="/ai-ceo/predictions/$id" params={{ id: p.id }} className="text-primary-glow">Evidence</Link></p></div>)}
            {data.preventiveSuggestions.slice(0, 2).map((s) => <p key={s} className="text-xs text-muted-foreground">Recommended attention: {s}</p>)}
          </DetailSection>
          <DetailSection title="Expected bottlenecks" className="lg:col-span-3">
            {data.correctiveActions.length === 0 ? <Unavailable>No bottlenecks identified.</Unavailable> : <div className="grid gap-2 sm:grid-cols-2">{data.correctiveActions.map((c) => <p key={c.team + c.issue} className="rounded-lg border border-border p-2 text-sm"><span className="font-medium">{c.team}</span> — {c.issue}</p>)}</div>}
          </DetailSection>
        </TabsContent>

        <TabsContent value="priorities" className="space-y-4">
          {priorities.length === 0 ? <Unavailable>No priorities today.</Unavailable> : LEVELS.map((lvl) => {
            const items = priorities.filter((p) => p.level === lvl);
            if (!items.length) return null;
            return <div key={lvl}><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{lvl} · {items.length}</h3>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map((p) => {
                const agent = agentById(p.agentId)!; const task = ops.tasks.find((t) => t.title === p.objective);
                const pct = task ? ({ Queued: 10, "In Progress": 50, "Waiting Approval": 70, Blocked: 30, Completed: 100, Cancelled: 0 } as const)[task.status] : 0;
                return <article key={p.id} className="bento-card space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2"><SeverityBadge level={p.risk} />{m.escalated.includes(p.id) && <Pill value="Escalated" />}<Pill value={task?.status ?? "Unassigned"} /></div>
                  <p className="text-sm font-medium">{p.objective}</p>
                  <p className="text-xs text-muted-foreground">{p.reason}</p>
                  <dl className="grid grid-cols-2 gap-1 text-[11px]"><dt className="text-muted-foreground">Owner</dt><dd>{agent.owner}</dd><dt className="text-muted-foreground">Agent</dt><dd>{agent.name}</dd><dt className="text-muted-foreground">Deadline</dt><dd>—</dd><dt className="text-muted-foreground">Dependencies</dt><dd>{task?.dependsOn.length ?? 0}</dd></dl>
                  <Progress value={pct} className="h-1.5" />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {p.link.id ? <Button asChild size="sm" variant="ghost"><Link to={p.link.to as "/ai-ceo/risk/$id"} params={{ id: p.link.id }}>Open</Link></Button> : <Button asChild size="sm" variant="ghost"><Link to="/ai-ceo/performance">Open</Link></Button>}
                    <Button size="sm" variant="ghost" onClick={() => setAssign(p)}>Assign</Button>
                    <Button size="sm" variant="ghost" onClick={() => reprioritize(p)}>Reprioritize</Button>
                    <Button size="sm" variant="ghost" onClick={() => escalate(p.id)}>Escalate</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEvidence(p)}>Evidence</Button>
                    <Button asChild size="sm" variant="ghost"><Link to="/ai-ceo/decision-engine">Create decision</Link></Button>
                  </div>
                </article>;
              })}</div></div>;
          })}
        </TabsContent>

        <TabsContent value="workforce" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            <Stat k="Total agents" v={AGENTS.length} /><Stat k="Active" v={AGENTS.length - count("Offline") - count("Paused")} /><Stat k="Working" v={count("Working")} /><Stat k="Idle / not deployed" v={count("Offline")} />
            <Stat k="Waiting" v={count("Waiting")} /><Stat k="Paused" v={count("Paused")} /><Stat k="Failed" v={new Set(failedRuns.map((r) => r.agentId)).size} /><Stat k="Needs attention" v={count("Needs Approval")} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{statuses.map(({ a, st, tasks }) => {
            const last = ops.events.find((e) => e.agentId === a.id);
            return <Link key={a.id} to="/ai-ceo/agents/$agentId" params={{ agentId: a.id }} className="bento-card block space-y-2 p-4 transition hover:border-primary/40">
              <div className="flex items-center justify-between"><p className="text-sm font-medium">{a.name}</p><Pill value={st} /></div>
              <p className="text-[11px] text-muted-foreground">{a.category}</p>
              <p className="text-xs">Current task: {tasks[0]?.title ?? "—"}</p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><span>Workload {tasks.length}/5</span><Progress value={Math.min(100, tasks.length * 20)} className="h-1.5 flex-1" /></div>
              <p className="text-[11px] text-muted-foreground">Success: {ops.runs.some((r) => r.agentId === a.id) ? `${ops.runs.filter((r) => r.agentId === a.id && r.status === "Completed").length}/${ops.runs.filter((r) => r.agentId === a.id).length} runs` : "awaiting data"} · Latest: {last ? fmt(last.at) : "—"}</p>
            </Link>;
          })}</div>
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">{["Situation", "Priorities", "Recommended work", "Agent allocation", "Expected outcome"].map((s, i) => <span key={s} className="inline-flex items-center gap-2"><span className="rounded-md border border-border px-2 py-1 text-foreground">{s}</span>{i < 4 && <ArrowRight className="h-3 w-3" />}</span>)}</div>
          <p className="text-sm text-muted-foreground">Situation: {critical.length} critical observations, {risks.length} elevated risks, {pendingDecisions.length} decisions awaiting action.</p>
          <div className="grid gap-3 md:grid-cols-2">{priorities.slice(0, 6).map((p) => {
            const a = agentById(p.agentId)!; const needs = p.risk === "HIGH" || p.risk === "CRITICAL" || a.risk === "HIGH" || a.risk === "CRITICAL";
            return <article key={p.id} className="bento-card space-y-2 p-4 text-sm">
              <p className="font-medium">{p.objective}</p>
              <dl className="grid grid-cols-[110px_1fr] gap-1 text-xs"><dt className="text-muted-foreground">Reason</dt><dd>{p.reason}</dd><dt className="text-muted-foreground">Evidence</dt><dd>{p.evidence}</dd><dt className="text-muted-foreground">Confidence</dt><dd>{p.confidence != null ? `${p.confidence}%` : "—"}</dd><dt className="text-muted-foreground">Risk</dt><dd><SeverityBadge level={p.risk} /></dd><dt className="text-muted-foreground">Expected impact</dt><dd>— (not estimated)</dd><dt className="text-muted-foreground">Allocation</dt><dd>{a.name}</dd><dt className="text-muted-foreground">Approval</dt><dd>{needs ? "Founder approval required" : "Not required"}</dd></dl>
              <Button size="sm" variant="outline" onClick={() => setAssign(p)}>Allocate to {a.name}</Button>
            </article>;
          })}</div>
          <DetailSection title="End-of-day objectives"><ul className="list-disc space-y-1 pl-5 text-sm">{priorities.filter((p) => p.level === "Critical" || p.level === "High").slice(0, 5).map((p) => <li key={p.id}>{p.objective}</li>)}</ul></DetailSection>
        </TabsContent>

        <TabsContent value="escalations" className="space-y-2">
          {escalations.length === 0 ? <Unavailable><CheckCircle2 className="mr-1 inline h-4 w-4" />No open escalations.</Unavailable> : escalations.map((e) => <div key={e.id} className="bento-card flex flex-wrap items-center justify-between gap-2 p-3">
            <div><p className="inline-flex items-center gap-2 text-xs text-accent-amber"><AlertTriangle className="h-3.5 w-3.5" />{e.kind}</p><p className="text-sm font-medium">{e.title}</p><p className="text-[11px] text-muted-foreground">{agentById(e.agentId)?.name}</p></div>
            <div className="flex flex-wrap gap-1">
              <Button asChild size="sm" variant="ghost"><Link to="/ai-ceo/activity">Inspect</Link></Button>
              <Button size="sm" variant="ghost" onClick={() => resolve(e.id)}>Resolve</Button>
              <Button size="sm" variant="ghost" onClick={() => escalate(e.id)}>Escalate</Button>
              <Button size="sm" variant="ghost" onClick={() => setAssign({ id: e.id, objective: e.title, reason: e.kind, level: "High", agentId: e.agentId, risk: "HIGH", evidence: e.kind, link: { to: "", id: "" } })}>Assign</Button>
              <Button size="sm" variant="ghost" onClick={() => { updateOps((x) => ({ ...x, paused: [...new Set([...x.paused, e.agentId])] }), { kind: "Control", text: `Agent paused from Morning escalations`, agentId: e.agentId }); toast("Agent paused (preview)"); }}>Pause</Button>
            </div>
          </div>)}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">{Object.entries(prog).map(([k, v]) => <Stat key={k} k={k} v={v} tone={k === "Failed" || k === "Blocked" ? (v ? "text-destructive" : undefined) : undefined} />)}</div>
          {total === 0 ? <Unavailable>No work planned in this session yet. Assign priorities to start the day.</Unavailable> : <div className="flex h-3 overflow-hidden rounded-full bg-muted">{Object.entries(prog).map(([k, v], i) => v ? <div key={k} title={`${k}: ${v}`} style={{ width: `${(v / total) * 100}%` }} className={["bg-muted-foreground/40", "bg-primary", "bg-accent-emerald", "bg-accent-amber", "bg-destructive", "bg-accent-emerald/60"][i]} /> : null)}</div>}
          <DetailSection title="Timeline">
            {ops.events.length === 0 ? <Unavailable>No activity recorded today.</Unavailable> : <ol className="space-y-2 border-l border-border pl-4">{ops.events.slice(0, 15).map((e) => <li key={e.id} className="text-sm"><span className="text-[11px] text-muted-foreground">{fmt(e.at)} · {e.kind}</span><p>{e.text}</p></li>)}</ol>}
          </DetailSection>
        </TabsContent>
      </Tabs>

      <Dialog open={!!evidence} onOpenChange={(o) => !o && setEvidence(null)}>
        <DialogContent><DialogHeader><DialogTitle>{evidence?.objective}</DialogTitle><DialogDescription>Evidence from the operational record</DialogDescription></DialogHeader>
          <p className="text-sm">{evidence?.reason}</p><p className="text-sm text-muted-foreground">{evidence?.evidence}</p>
          <p className="text-xs text-muted-foreground">Confidence: {evidence?.confidence != null ? `${evidence.confidence}%` : "not provided"} · Source: {isPersisted ? "live record" : "seed record"}</p>
        </DialogContent>
      </Dialog>
      {assign && <AssignTaskDialog open onOpenChange={(o) => !o && setAssign(null)} agentId={assign.agentId} preset={{ title: assign.objective, description: assign.reason, source: "Morning AI", priority: assign.risk }} />}
    </PageShell>
  );
}
