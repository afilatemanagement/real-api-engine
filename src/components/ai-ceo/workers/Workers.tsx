import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Minus, Search, ShieldCheck, Users, X } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BackLink, DetailSection, SeverityBadge, Unavailable } from "@/components/ai-ceo/governance/shared";
import { AGENTS, CAPABILITIES, CATEGORIES, PERMISSIONS, agentById, type AgentDef } from "@/components/ai-ceo/ops/catalog";
import { uid, useOps, type OpsTask } from "@/components/ai-ceo/ops/store";
import { AccessPill, AssignTaskDialog, Pill, PreviewNotice, agentStatus, fmt } from "@/components/ai-ceo/ops/ui";
import { cn } from "@/lib/utils";

/**
 * Worker Agent workspace (UI only). Worker = operations agent from the policy catalog.
 * Metrics come only from session preview tasks/runs; with none, they read "awaiting data".
 * Development agents are intentionally not part of this catalog.
 */
const CAPACITY = 5;
const WORKER_TABS = ["All", "Active", "Idle", "Working", "Waiting", "Paused", "Failed", "Needs Attention"] as const;
const QUEUE = ["Queued", "Assigned", "Working", "Waiting", "Blocked", "Completed", "Failed", "Verified"] as const;
type QState = (typeof QUEUE)[number];
const qState = (t: OpsTask): QState => ({ Queued: t.dependsOn.length ? "Queued" : "Assigned", "In Progress": "Working", "Waiting Approval": "Waiting", Blocked: "Blocked", Completed: "Completed", Cancelled: "Failed" } as const)[t.status];
const MATRIX_DOMAINS = ["Research", "Analytics", "Customer Operations", "Sales Operations", "Marketing Operations", "Support Operations", "Finance Operations", "Marketplace Operations", "Knowledge Operations", "Reporting", "Monitoring"];
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "awaiting data");

function useWorkers() {
  const [s, update] = useOps();
  const rows = useMemo(() => AGENTS.map((a) => {
    const st = agentStatus(a, s.tasks, s.paused, s.killSwitch);
    const tasks = s.tasks.filter((t) => t.agentId === a.id);
    const open = tasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled");
    const runs = s.runs.filter((r) => r.agentId === a.id);
    const failed = runs.some((r) => r.status === "Failed" || r.status === "Stopped");
    const tab: (typeof WORKER_TABS)[number][] = ["All"];
    if (st === "Offline") tab.push("Idle"); else if (st !== "Paused") tab.push("Active");
    if (st === "Working") tab.push("Working");
    if (st === "Waiting") tab.push("Waiting");
    if (st === "Paused") tab.push("Paused");
    if (failed) tab.push("Failed");
    if (st === "Needs Approval" || failed || open.some((t) => t.status === "Blocked")) tab.push("Needs Attention");
    const last = s.events.find((e) => e.agentId === a.id);
    return { a, st, tasks, open, runs, failed, tab, last };
  }), [s]);
  return { s, update, rows };
}

function WorkerActions({ a, paused, onAssign, update }: { a: AgentDef; paused: boolean; onAssign: () => void; update: ReturnType<typeof useOps>[1] }) {
  const toggle = () => { update((x) => ({ ...x, paused: paused ? x.paused.filter((p) => p !== a.id) : [...x.paused, a.id] }), { kind: "Control", text: `${a.name} ${paused ? "resumed" : "paused"}`, agentId: a.id }); toast.success(`${a.name} ${paused ? "resumed" : "paused"} (preview)`); };
  const escalate = () => { update((x) => x, { kind: "Escalation", text: `${a.name} escalated to Founder`, agentId: a.id }); toast("Escalated to Founder (preview)"); };
  return <div className="flex flex-wrap gap-1">
    <Button asChild size="sm" variant="ghost"><Link to="/ai-ceo/workers/$id" params={{ id: a.id }}>Open</Link></Button>
    <Button size="sm" variant="ghost" onClick={onAssign}>Assign task</Button>
    <Button asChild size="sm" variant="ghost"><Link to="/ai-ceo/tasks">View work</Link></Button>
    <Button size="sm" variant="ghost" onClick={toggle}>{paused ? "Resume" : "Pause"}</Button>
    <Button asChild size="sm" variant="ghost"><Link to="/ai-ceo/agents/$agentId" params={{ agentId: a.id }}>Inspect</Link></Button>
    <Button size="sm" variant="ghost" onClick={escalate}>Escalate</Button>
  </div>;
}

function TaskCard({ t, s }: { t: OpsTask; s: ReturnType<typeof useOps>[0] }) {
  const verified = s.runs.some((r) => r.taskId === t.id && r.status === "Completed");
  return <div className="rounded-lg border border-border bg-card/50 p-3 text-xs">
    <p className="break-words text-sm font-medium">{t.title}</p>
    <div className="mt-1 flex flex-wrap items-center gap-1"><SeverityBadge level={t.priority} /><Pill value={qState(t)} /></div>
    <dl className="mt-2 grid grid-cols-[80px_1fr] gap-0.5 text-[11px]">
      <dt className="text-muted-foreground">Source</dt><dd className="break-words">{t.source}</dd>
      <dt className="text-muted-foreground">Agent</dt><dd>{agentById(t.agentId)?.name}</dd>
      <dt className="text-muted-foreground">Deadline</dt><dd>{t.due || "—"}</dd>
      <dt className="text-muted-foreground">Depends on</dt><dd>{t.dependsOn.length || "None"}</dd>
      <dt className="text-muted-foreground">Verification</dt><dd>{verified ? "Verified" : "Not verified"}</dd>
    </dl>
  </div>;
}

function WorkQueue({ tasks, s }: { tasks: OpsTask[]; s: ReturnType<typeof useOps>[0] }) {
  const failedRuns = s.runs.filter((r) => (r.status === "Failed" || r.status === "Stopped") && (!r.taskId || tasks.some((t) => t.id === r.taskId)));
  if (!tasks.length && !failedRuns.length) return <Unavailable>No queued work in this session. Assign a task to a worker to populate the queue.</Unavailable>;
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{QUEUE.map((q) => {
    const items = q === "Verified" ? tasks.filter((t) => s.runs.some((r) => r.taskId === t.id && r.status === "Completed")) : tasks.filter((t) => qState(t) === q);
    const extra = q === "Failed" ? failedRuns.length : 0;
    return <div key={q} className="min-w-0 space-y-2 rounded-xl border border-border p-2">
      <p className="text-xs font-semibold text-muted-foreground">{q} · {items.length + extra}</p>
      {items.map((t) => <TaskCard key={t.id} t={t} s={s} />)}
      {q === "Failed" && failedRuns.map((r) => <p key={r.id} className="rounded-lg border border-destructive/40 p-2 text-[11px] text-destructive">{agentById(r.agentId)?.name} run {r.status.toLowerCase()} · {fmt(r.at)}</p>)}
    </div>;
  })}</div>;
}

function Performance({ tasks, runs, events }: { tasks: OpsTask[]; runs: ReturnType<typeof useOps>[0]["runs"]; events: ReturnType<typeof useOps>[0]["events"] }) {
  const done = tasks.filter((t) => t.status === "Completed").length;
  const ok = runs.filter((r) => r.status === "Completed").length;
  const fail = runs.filter((r) => r.status === "Failed" || r.status === "Stopped").length;
  const esc = events.filter((e) => e.kind === "Escalation").length;
  const items: [string, string | number][] = [
    ["Tasks completed", done], ["Success rate", pct(ok, runs.length)], ["Verification rate", pct(ok, done || runs.length)], ["Failure rate", pct(fail, runs.length)],
    ["Avg completion time", "awaiting data"], ["SLA performance", "awaiting data"], ["Human override", events.filter((e) => e.kind === "Control").length], ["Escalations", esc],
  ];
  return <div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{items.map(([k, v]) => <div key={k} className="bento-card p-3"><p className={cn("font-semibold tabular-nums", typeof v === "string" && v.startsWith("awaiting") ? "text-sm text-muted-foreground" : "text-xl")}>{v}</p><p className="text-[11px] text-muted-foreground">{k}</p></div>)}</div>
    <p className="mt-2 text-[11px] text-muted-foreground">Measured from this session's preview work only. Completion time and SLA need a connected execution backend.</p></div>;
}

function Failures({ agentId }: { agentId?: string }) {
  const [s, update] = useOps();
  const [assign, setAssign] = useState<string | null>(null);
  const runs = s.runs.filter((r) => (r.status === "Failed" || r.status === "Stopped") && (!agentId || r.agentId === agentId));
  const blocked = s.tasks.filter((t) => t.status === "Blocked" && (!agentId || t.agentId === agentId));
  if (!runs.length && !blocked.length) return <Unavailable>No failures recorded. Failed runs and blocked tasks appear here.</Unavailable>;
  const retry = (agent: string, taskId?: string) => { update((x) => ({ ...x, runs: [{ id: uid("run"), agentId: agent, ...(taskId ? { taskId } : {}), status: "Queued", steps: [], at: new Date().toISOString() }, ...x.runs] }), { kind: "Retry", text: `Retry queued for ${agentById(agent)?.name}`, agentId: agent }); toast("Retry queued (preview)"); };
  const rows = [
    ...runs.map((r) => ({ id: r.id, failure: `Run ${r.status.toLowerCase()}`, task: s.tasks.find((t) => t.id === r.taskId)?.title ?? "—", agentId: r.agentId, at: r.at, taskId: r.taskId })),
    ...blocked.map((t) => ({ id: t.id, failure: "Task blocked", task: t.title, agentId: t.agentId, at: t.createdAt, taskId: t.id })),
  ];
  return <div className="space-y-2">{rows.map((r) => <div key={r.id} className="bento-card space-y-2 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium text-destructive">{r.failure}</p><span className="text-[11px] text-muted-foreground">{fmt(r.at)}</span></div>
    <dl className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-3"><div><dt className="text-muted-foreground">Task</dt><dd className="break-words">{r.task}</dd></div><div><dt className="text-muted-foreground">Agent</dt><dd>{agentById(r.agentId)?.name}</dd></div><div><dt className="text-muted-foreground">Impact</dt><dd>— not assessed</dd></div><div><dt className="text-muted-foreground">Root cause</dt><dd>Not investigated</dd></div><div><dt className="text-muted-foreground">Retry state</dt><dd>{s.runs.some((x) => x.agentId === r.agentId && x.status === "Queued") ? "Retry queued" : "None"}</dd></div><div><dt className="text-muted-foreground">Human intervention</dt><dd>Required</dd></div></dl>
    <div className="flex flex-wrap gap-1">
      <Button size="sm" variant="ghost" onClick={() => retry(r.agentId, r.taskId)}>Retry</Button>
      <Button size="sm" variant="ghost" onClick={() => { update((x) => ({ ...x, paused: [...new Set([...x.paused, r.agentId])] }), { kind: "Control", text: "Worker paused after failure", agentId: r.agentId }); toast("Paused (preview)"); }}>Pause</Button>
      <Button size="sm" variant="ghost" onClick={() => setAssign(r.task)}>Reassign</Button>
      <Button size="sm" variant="ghost" onClick={() => { update((x) => x, { kind: "Escalation", text: `Failure escalated: ${r.task}`, agentId: r.agentId }); toast("Escalated (preview)"); }}>Escalate</Button>
      <Button asChild size="sm" variant="ghost"><Link to="/ai-ceo/activity">Inspect</Link></Button>
    </div>
  </div>)}
    {assign && <AssignTaskDialog open onOpenChange={(o) => !o && setAssign(null)} preset={{ title: assign, description: "Reassigned after failure", source: "Failure workspace" }} />}
  </div>;
}

function CapabilityMatrix() {
  const has = (a: AgentDef, d: string) => a.category === d || (d === "Support Operations" && /support|sla/i.test(a.name)) || (d === "Reporting" && a.capabilities.includes("Create report")) || (d === "Knowledge Operations" && false);
  return <div className="space-y-2">
    <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground"><span className="inline-flex items-center gap-1"><Check className="h-3 w-3 text-accent-emerald" />Configured</span><span className="inline-flex items-center gap-1"><Minus className="h-3 w-3" />Not configured</span><span>No worker is configured for Knowledge Operations yet.</span></div>
    <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[720px] text-xs">
      <thead><tr className="border-b border-border"><th className="sticky left-0 bg-card p-2 text-left">Worker</th>{MATRIX_DOMAINS.map((d) => <th key={d} className="p-2 text-center font-medium text-muted-foreground">{d}</th>)}</tr></thead>
      <tbody>{AGENTS.map((a) => <tr key={a.id} className="border-b border-border/50"><td className="sticky left-0 bg-card p-2"><Link to="/ai-ceo/workers/$id" params={{ id: a.id }} className="hover:text-primary-glow">{a.name}</Link></td>{MATRIX_DOMAINS.map((d) => <td key={d} className="p-2 text-center">{has(a, d) ? <Check className="mx-auto h-3.5 w-3.5 text-accent-emerald" aria-label="Configured" /> : <Minus className="mx-auto h-3.5 w-3.5 text-muted-foreground/50" aria-label="Not configured" />}</td>)}</tr>)}</tbody>
    </table></div>
    <p className="text-[11px] text-muted-foreground">Mobile: scroll the table sideways inside its frame; the page itself does not overflow.</p>
  </div>;
}

export function WorkerDirectory() {
  const { s, update, rows } = useWorkers();
  const [tab, setTab] = useState<(typeof WORKER_TABS)[number]>("All");
  const [q, setQ] = useState(""); const [cap, setCap] = useState("all"); const [dom, setDom] = useState("all");
  const [load, setLoad] = useState("all"); const [pri, setPri] = useState("all"); const [perf, setPerf] = useState("all");
  const [assign, setAssign] = useState<string | null>(null);
  const list = rows.filter((r) => r.tab.includes(tab))
    .filter((r) => !q || `${r.a.name} ${r.a.purpose} ${r.a.category}`.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => cap === "all" || r.a.capabilities.includes(cap))
    .filter((r) => dom === "all" || r.a.category === dom)
    .filter((r) => load === "all" || (load === "none" ? r.open.length === 0 : load === "full" ? r.open.length >= CAPACITY : r.open.length > 0 && r.open.length < CAPACITY))
    .filter((r) => pri === "all" || r.open.some((t) => t.priority === pri))
    .filter((r) => perf === "all" || (perf === "measured" ? r.runs.length > 0 : r.runs.length === 0));
  const sel = (v: string, set: (v: string) => void, label: string, opts: [string, string][]) => (
    <Select value={v} onValueChange={set}><SelectTrigger className="h-9 w-full sm:w-[150px]" aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="all">All {label.toLowerCase()}</SelectItem>{opts.map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select>
  );
  return <PageShell>
    <section><p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /> Founder AI · Worker Agents</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Worker Agent Command Center</h1>
      <p className="mt-1 text-sm text-muted-foreground">The specialized operations workforce coordinated by the Morning AI Agent. Operations only — no development agents.</p></section>
    <PreviewNotice />
    <Tabs defaultValue="directory">
      <TabsList className="flex h-auto flex-wrap"><TabsTrigger value="directory">Directory</TabsTrigger><TabsTrigger value="matrix">Capability matrix</TabsTrigger><TabsTrigger value="queue">Work queue</TabsTrigger><TabsTrigger value="performance">Performance</TabsTrigger><TabsTrigger value="failures">Failures</TabsTrigger></TabsList>
      <TabsContent value="directory" className="space-y-4">
        <div className="flex flex-wrap gap-1">{WORKER_TABS.map((t) => <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>{t} <span className="ml-1 tabular-nums opacity-70">{rows.filter((r) => r.tab.includes(t)).length}</span></Button>)}</div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          <div className="relative sm:w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search workers" className="h-9 pl-8" aria-label="Search workers" /></div>
          {sel(cap, setCap, "Capabilities", Object.keys(CAPABILITIES).map((c) => [c, c]))}
          {sel(dom, setDom, "Domains", CATEGORIES.map((c) => [c, c]))}
          {sel(load, setLoad, "Workload", [["none", "No work"], ["some", "Has capacity"], ["full", "At capacity"]])}
          {sel(pri, setPri, "Priority", ["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => [p, p]))}
          {sel(perf, setPerf, "Performance", [["measured", "Has run history"], ["unmeasured", "Awaiting data"]])}
        </div>
        {list.length === 0 ? <Unavailable>No workers match these filters.</Unavailable> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{list.map((r) => {
          const cur = r.open.find((t) => t.status === "In Progress") ?? r.open[0];
          return <article key={r.a.id} className="bento-card min-w-0 space-y-2 p-4">
            <div className="flex items-start justify-between gap-2"><div className="min-w-0"><Link to="/ai-ceo/workers/$id" params={{ id: r.a.id }} className="text-sm font-semibold hover:text-primary-glow">{r.a.name}</Link><p className="text-[11px] text-muted-foreground">{r.a.category} · {r.a.purpose}</p></div><Pill value={r.failed ? "Failed" : r.st} /></div>
            <dl className="grid grid-cols-[100px_1fr] gap-0.5 text-[11px]">
              <dt className="text-muted-foreground">Specialization</dt><dd>{r.a.capabilities.slice(-2).join(", ")}</dd>
              <dt className="text-muted-foreground">Current task</dt><dd className="break-words">{cur?.title ?? "—"}</dd>
              <dt className="text-muted-foreground">Priority</dt><dd>{cur ? <SeverityBadge level={cur.priority} /> : "—"}</dd>
              <dt className="text-muted-foreground">Assignment</dt><dd className="break-words">{cur?.source ?? "Unassigned"}</dd>
              <dt className="text-muted-foreground">Success rate</dt><dd>{pct(r.runs.filter((x) => x.status === "Completed").length, r.runs.length)}</dd>
              <dt className="text-muted-foreground">Last activity</dt><dd>{r.last ? fmt(r.last.at) : "—"}</dd>
            </dl>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><span>Workload {r.open.length}/{CAPACITY}</span><Progress value={(r.open.length / CAPACITY) * 100} className="h-1.5 flex-1" /></div>
            <WorkerActions a={r.a} paused={s.paused.includes(r.a.id)} onAssign={() => setAssign(r.a.id)} update={update} />
          </article>;
        })}</div>}
      </TabsContent>
      <TabsContent value="matrix"><CapabilityMatrix /></TabsContent>
      <TabsContent value="queue"><WorkQueue tasks={s.tasks} s={s} /></TabsContent>
      <TabsContent value="performance"><Performance tasks={s.tasks} runs={s.runs} events={s.events} /></TabsContent>
      <TabsContent value="failures"><Failures /></TabsContent>
    </Tabs>
    {assign && <AssignTaskDialog open onOpenChange={(o) => !o && setAssign(null)} agentId={assign} />}
  </PageShell>;
}

export function WorkerDetail({ id }: { id: string }) {
  const { s, update, rows } = useWorkers();
  const [assign, setAssign] = useState(false);
  const r = rows.find((x) => x.a.id === id);
  if (!r) return <PageShell><BackLink to="/ai-ceo/workers" label="Workers" /><Unavailable>This worker is not in the catalog.</Unavailable></PageShell>;
  const { a } = r;
  const cur = r.open.find((t) => t.status === "In Progress"); const next = r.open.find((t) => t.status === "Queued");
  const blocked = r.open.filter((t) => t.status === "Blocked"); const waiting = r.open.filter((t) => t.status === "Waiting Approval");
  const events = s.events.filter((e) => e.agentId === a.id);
  return <PageShell>
    <BackLink to="/ai-ceo/workers" label="Workers" />
    <section className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs text-muted-foreground">{a.category} · Worker Agent</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">{a.name}</h1><p className="mt-1 text-sm text-muted-foreground">{a.purpose}</p></div><div className="flex items-center gap-2"><SeverityBadge level={a.risk} /><Pill value={r.failed ? "Failed" : r.st} /></div></section>
    <PreviewNotice />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">{([["Current task", cur?.title ?? "—"], ["Next task", next?.title ?? "—"], ["Blocked by", blocked.length ? `${blocked.length} task(s)` : "Nothing"], ["Waiting for", waiting.length ? "Founder approval" : "Nothing"], ["Deadline", cur?.due || "—"], ["SLA", "Not configured"], ["Verification", s.runs.some((x) => x.agentId === a.id && x.status === "Completed") ? "Verified runs exist" : "Not verified"]] as const).map(([k, v]) => <div key={k} className="bento-card min-w-0 p-3"><p className="truncate text-sm font-medium" title={v}>{v}</p><p className="text-[11px] text-muted-foreground">{k}</p></div>)}</div>
    <Tabs defaultValue="overview">
      <TabsList className="flex h-auto flex-wrap">{["Overview", "Capabilities", "Current work", "Queue", "History", "Performance", "Failures", "Dependencies", "Permissions", "Activity", "Evidence"].map((t) => <TabsTrigger key={t} value={t}>{t}</TabsTrigger>)}</TabsList>
      <TabsContent value="Overview" className="space-y-3"><DetailSection title="Role"><p className="text-sm">{a.purpose}</p><p className="mt-2 text-xs text-muted-foreground">Owner: {a.owner} · Workload {r.open.length}/{CAPACITY} · Deployment: not deployed (policy catalog)</p></DetailSection><WorkerActions a={a} paused={s.paused.includes(a.id)} onAssign={() => setAssign(true)} update={update} /></TabsContent>
      <TabsContent value="Capabilities"><div className="grid gap-2 sm:grid-cols-2">{Object.entries(CAPABILITIES).map(([c, info]) => { const on = a.capabilities.includes(c); return <div key={c} className={cn("rounded-lg border p-3 text-sm", on ? "border-accent-emerald/40" : "border-border opacity-60")}><p className="inline-flex items-center gap-2 font-medium">{on ? <Check className="h-4 w-4 text-accent-emerald" /> : <X className="h-4 w-4" />}{c}</p><p className="text-xs text-muted-foreground">{on ? info.description : "Not configured for this worker"}</p></div>; })}</div></TabsContent>
      <TabsContent value="Current work">{r.open.length ? <div className="grid gap-2 sm:grid-cols-2">{r.open.map((t) => <TaskCard key={t.id} t={t} s={s} />)}</div> : <Unavailable>No current work.</Unavailable>}</TabsContent>
      <TabsContent value="Queue"><WorkQueue tasks={r.tasks} s={s} /></TabsContent>
      <TabsContent value="History">{r.runs.length ? <ul className="space-y-1">{r.runs.map((x) => <li key={x.id} className="flex justify-between gap-2 rounded-lg border border-border p-2 text-xs"><Pill value={x.status} /><span className="text-muted-foreground">{fmt(x.at)}</span></li>)}</ul> : <Unavailable>No run history.</Unavailable>}</TabsContent>
      <TabsContent value="Performance"><Performance tasks={r.tasks} runs={r.runs} events={events} /></TabsContent>
      <TabsContent value="Failures"><Failures agentId={a.id} /></TabsContent>
      <TabsContent value="Dependencies">{r.open.some((t) => t.dependsOn.length) ? <ul className="space-y-1 text-sm">{r.open.filter((t) => t.dependsOn.length).map((t) => <li key={t.id}>{t.title} → waits on {t.dependsOn.map((d) => s.tasks.find((x) => x.id === d)?.title ?? d).join(", ")}</li>)}</ul> : <Unavailable>No dependencies.</Unavailable>}</TabsContent>
      <TabsContent value="Permissions"><div className="grid gap-2 sm:grid-cols-2">{PERMISSIONS.filter((p) => p !== "REQUEST_APPROVAL").map((p) => <div key={p} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-muted-foreground" />{p.charAt(0) + p.slice(1).toLowerCase()}</span><AccessPill a={a.permissions[p]} /></div>)}</div><p className="mt-2 text-[11px] text-muted-foreground">"Restricted" = unavailable to this worker. Execute always needs authorization and no execution backend is connected.</p></TabsContent>
      <TabsContent value="Activity">{events.length ? <ol className="space-y-2 border-l border-border pl-4">{events.map((e) => <li key={e.id} className="text-sm"><span className="text-[11px] text-muted-foreground">{fmt(e.at)} · {e.kind}</span><p>{e.text}</p></li>)}</ol> : <Unavailable>No activity recorded.</Unavailable>}</TabsContent>
      <TabsContent value="Evidence">{r.tasks.length ? <ul className="space-y-1 text-sm">{r.tasks.map((t) => <li key={t.id} className="rounded-lg border border-border p-2"><p className="font-medium">{t.title}</p><p className="text-xs text-muted-foreground">Source: {t.source}</p></li>)}</ul> : <Unavailable>No evidence yet — evidence is attached when work is assigned from a decision, risk or priority.</Unavailable>}</TabsContent>
    </Tabs>
    {assign && <AssignTaskDialog open onOpenChange={setAssign} agentId={a.id} />}
  </PageShell>;
}
