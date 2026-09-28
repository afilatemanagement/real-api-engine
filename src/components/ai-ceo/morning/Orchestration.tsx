import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDown, ArrowRight, CheckCircle2, GitBranch, Plus, Send, ShieldAlert, Sunset, Workflow } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { BackLink, DetailSection, SeverityBadge, Unavailable, type Severity } from "@/components/ai-ceo/governance/shared";
import { useCEOData } from "@/hooks/useCEOData";
import { AGENTS, agentById, agentForText, type AgentDef, type RiskTier } from "@/components/ai-ceo/ops/catalog";
import { uid, useOps, type OpsTask } from "@/components/ai-ceo/ops/store";
import { Pill, PreviewNotice, agentStatus, fmt } from "@/components/ai-ceo/ops/ui";
import { WorkerBackend } from "./WorkerBackend";
import { usePlan, type MsgKind, type PlanTask } from "./orchestration-store";
import { cn } from "@/lib/utils";

const TIERS: RiskTier[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const RANK: Record<RiskTier, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
const CAPACITY = 5;
const FLOW = ["Company state", "Morning analysis", "Priorities", "Work plan", "Agent selection", "Worker assignment", "Execution", "Verification", "Outcome", "Escalation / learning"];

/** Responsive orchestration timeline: vertical on mobile, wrapping row on larger screens. */
export function OrchestrationFlow({ reached }: { reached: number }) {
  return <ol className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-5">{FLOW.map((s, i) => (
    <li key={s} className={cn("flex items-center gap-2 rounded-lg border p-2 text-xs", i < reached ? "border-accent-emerald/40 text-foreground" : i === reached ? "border-primary/50 bg-primary/10 text-foreground" : "border-border text-muted-foreground")}>
      <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold", i < reached ? "bg-accent-emerald/20 text-accent-emerald" : "bg-muted")}>{i < reached ? "✓" : i + 1}</span>
      <span className="min-w-0 truncate">{s}</span>
    </li>
  ))}</ol>;
}

function useStage() {
  const [p] = usePlan(); const [s] = useOps();
  const linked = p.tasks.map((t) => s.tasks.find((o) => o.id === t.opsTaskId)).filter(Boolean) as OpsTask[];
  if (!p.objective && !p.tasks.length) return 3;
  if (!p.tasks.length) return 3;
  if (p.tasks.some((t) => !t.agentId)) return 4;
  if (!linked.length) return 5;
  if (linked.some((t) => t.status !== "Completed")) return 6;
  return s.runs.some((r) => r.status === "Completed") ? 9 : 7;
}

/** Transparent assignment reasoning. Scores are presentation rules, not a trained model. */
function score(t: PlanTask, a: AgentDef, open: number, st: string) {
  const suggested = agentForText(`${t.title} ${t.requirement}`).id === a.id;
  const canTask = a.capabilities.includes("Create task") || a.capabilities.includes("Create recommendation");
  const cap = suggested ? 2 : canTask ? 1 : 0;
  const avail = st === "Paused" ? 0 : st === "Needs Approval" ? 1 : 2;
  const load = open >= CAPACITY ? 0 : open >= 3 ? 1 : 2;
  const risk = RANK[a.risk] >= RANK[t.priority] ? 2 : 1;
  return { cap, avail, load, risk, total: cap * 2 + avail + load + risk };
}

function AssignDialog({ task, onClose }: { task: PlanTask; onClose: () => void }) {
  const [s] = useOps(); const [, update] = usePlan();
  const rows = AGENTS.map((a) => { const st = agentStatus(a, s.tasks, s.paused, s.killSwitch); const open = s.tasks.filter((t) => t.agentId === a.id && t.status !== "Completed" && t.status !== "Cancelled").length; const runs = s.runs.filter((r) => r.agentId === a.id); return { a, st, open, runs, sc: score(task, a, open, st) }; }).sort((x, y) => y.sc.total - x.sc.total);
  const pick = (a: AgentDef) => { update((p) => ({ ...p, tasks: p.tasks.map((t) => t.id === task.id ? { ...t, agentId: a.id, messages: [...t.messages, { id: uid("m"), at: new Date().toISOString(), kind: "Instruction" as MsgKind, from: "Morning AI", to: a.name, text: `Proposed assignment: ${task.title}` }] } : t) })); toast(`${a.name} proposed for this task — not yet assigned`); onClose(); };
  const lvl = (n: number) => ["Low", "Partial", "Strong"][n];
  return <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
    <DialogHeader><DialogTitle>Select worker</DialogTitle><DialogDescription>Requirement: {task.requirement || task.title} · Priority {task.priority}. Choosing a worker is a proposal; no real assignment happens until the execution backend is connected.</DialogDescription></DialogHeader>
    <div className="space-y-2">{rows.slice(0, 8).map(({ a, st, open, runs, sc }, i) => <div key={a.id} className={cn("rounded-lg border p-3", i === 0 ? "border-primary/50" : "border-border")}>
      <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-medium">{a.name}{i === 0 && <span className="ml-2 text-[10px] text-primary-glow">Best match</span>}</p><p className="text-[11px] text-muted-foreground">{a.capabilities.slice(-3).join(", ")}</p></div><div className="flex items-center gap-2"><SeverityBadge level={a.risk} /><Pill value={st} /></div></div>
      <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] sm:grid-cols-5">
        <span>Capability: <b>{lvl(sc.cap)}</b></span><span>Availability: <b>{lvl(sc.avail)}</b></span><span>Workload: <b>{open}/{CAPACITY}</b></span><span>Priority fit: <b>{lvl(sc.risk)}</b></span><span>History: <b>{runs.length ? `${runs.filter((r) => r.status === "Completed").length}/${runs.length}` : "awaiting data"}</b></span>
      </div>
      <Button size="sm" variant="outline" className="mt-2" onClick={() => pick(a)}>Propose {a.name}</Button>
    </div>)}</div>
  </DialogContent></Dialog>;
}

export function WorkPlanBuilder() {
  const { data } = useCEOData();
  const [p, update] = usePlan(); const [, updateOps] = useOps();
  const [assign, setAssign] = useState<PlanTask | null>(null);
  const [title, setTitle] = useState(""); const [req, setReq] = useState("");
  const [verif, setVerif] = useState<Record<string, string>>({});
  const set = (id: string, patch: Partial<PlanTask>) => update((x) => ({ ...x, tasks: x.tasks.map((t) => t.id === id ? { ...t, ...patch } : t) }));
  const add = (t: string, r: string, pri: RiskTier = "MEDIUM") => { if (!t.trim()) { toast.error("Add a task title"); return; } update((x) => ({ ...x, tasks: [...x.tasks, { id: uid("pt"), title: t, requirement: r, priority: pri, dependsOn: [], approval: pri === "HIGH" || pri === "CRITICAL", verification: [], messages: [] }] })); setTitle(""); setReq(""); };
  const suggestions = [...data.decisions.filter((d) => d.aiDecision === "escalate").map((d) => ({ t: `Prepare decision: ${d.action}`, r: d.reasoning, p: "CRITICAL" as RiskTier })), ...data.riskCategories.filter((r) => r.level === "high" || r.level === "critical").map((r) => ({ t: `Mitigate ${r.category} risk`, r: `${r.issues} open issues`, p: "HIGH" as RiskTier }))].filter((s) => !p.tasks.some((t) => t.title === s.t));
  const risk: Severity = p.tasks.reduce<RiskTier>((m, t) => RANK[t.priority] > RANK[m] ? t.priority : m, "LOW");
  const send = () => {
    const ready = p.tasks.filter((t) => t.agentId && !t.opsTaskId);
    if (!ready.length) { toast.error("Propose a worker for at least one task"); return; }
    const created = ready.map((t) => ({ plan: t, ops: { id: uid("task"), title: t.title, description: t.requirement, agentId: t.agentId!, priority: t.priority, status: t.approval ? "Waiting Approval" : "Queued", source: `Morning plan: ${p.objective || "Untitled"}`, dependsOn: [], createdAt: new Date().toISOString(), ...(t.deadline ? { due: t.deadline } : {}) } as OpsTask }));
    updateOps((x) => ({ ...x, tasks: [...created.map((c) => c.ops), ...x.tasks] }), { kind: "Plan", text: `Morning plan staged ${created.length} task(s) in the preview queue` });
    update((x) => ({ ...x, tasks: x.tasks.map((t) => { const c = created.find((c) => c.plan.id === t.id); return c ? { ...t, opsTaskId: c.ops.id } : t; }) }));
    toast.success(`${created.length} task(s) staged in the preview queue — nothing executes`);
  };
  return <PageShell>
    <BackLink to="/ai-ceo/morning" label="Morning AI" />
    <section className="flex flex-wrap items-end justify-between gap-3"><div><p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Workflow className="h-3.5 w-3.5" /> Morning AI · Orchestration</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Work Plan Builder</h1><p className="mt-1 text-sm text-muted-foreground">Morning AI proposes; the Founder approves; Worker Agents execute under governance.</p></div>
      <div className="flex gap-2"><Button asChild variant="outline" size="sm"><Link to="/ai-ceo/morning/execution">Live execution</Link></Button><Button size="sm" onClick={send}><Send className="mr-1 h-4 w-4" />Stage in queue</Button></div></section>
    <PreviewNotice>Prototype preview: plans live in this browser tab. Staging adds preview tasks only — no worker receives or runs anything.</PreviewNotice>
    <DetailSection title="Orchestration flow"><OrchestrationFlow reached={useStage()} /></DetailSection>

    <div className="grid gap-4 lg:grid-cols-3">
      <DetailSection title="Objective" className="lg:col-span-2"><div className="space-y-3">
        <div><Label htmlFor="obj">Objective</Label><Input id="obj" value={p.objective} onChange={(e) => update((x) => ({ ...x, objective: e.target.value }))} placeholder="e.g. Clear critical approvals and contain elevated risks today" /></div>
        <div className="grid gap-3 sm:grid-cols-2"><div><Label>Priority</Label><Select value={p.priority} onValueChange={(v) => update((x) => ({ ...x, priority: v as RiskTier }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Plan risk</Label><div className="pt-2"><SeverityBadge level={risk} /></div></div></div>
        <div><Label htmlFor="out">Expected outcome</Label><Textarea id="out" rows={2} value={p.expectedOutcome} onChange={(e) => update((x) => ({ ...x, expectedOutcome: e.target.value }))} placeholder="What should be true by end of day?" /></div>
      </div></DetailSection>
      <DetailSection title="Suggested from the operational record">{suggestions.length ? <ul className="space-y-2">{suggestions.slice(0, 5).map((s) => <li key={s.t} className="flex items-start justify-between gap-2 text-xs"><span className="min-w-0"><SeverityBadge level={s.p} /> {s.t}</span><Button size="sm" variant="ghost" onClick={() => add(s.t, s.r, s.p)}><Plus className="h-3.5 w-3.5" /></Button></li>)}</ul> : <Unavailable>No further suggestions.</Unavailable>}</DetailSection>
    </div>

    <DetailSection title={`Tasks · ${p.tasks.length}`}>
      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task" aria-label="Task title" /><Input value={req} onChange={(e) => setReq(e.target.value)} placeholder="Requirement / context" aria-label="Requirement" /><Button onClick={() => add(title, req)}><Plus className="mr-1 h-4 w-4" />Add task</Button></div>
      {p.tasks.length === 0 ? <Unavailable>No tasks yet. Add one or pick a suggestion.</Unavailable> : <div className="space-y-3">{p.tasks.map((t) => {
        const a = t.agentId ? agentById(t.agentId) : undefined;
        return <article key={t.id} className="min-w-0 rounded-xl border border-border p-3">
          <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="break-words text-sm font-medium">{t.title}</p><p className="break-words text-xs text-muted-foreground">{t.requirement}</p></div>{t.opsTaskId ? <Pill value="Staged" /> : <Pill value="Draft" />}</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div><Label className="text-[11px]">Agent</Label><Button size="sm" variant="outline" className="w-full justify-start truncate" onClick={() => setAssign(t)}>{a ? a.name : "Assign agent"}</Button></div>
            <div><Label className="text-[11px]">Priority</Label><Select value={t.priority} onValueChange={(v) => set(t.id, { priority: v as RiskTier, approval: t.approval || v === "HIGH" || v === "CRITICAL" })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{TIERS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-[11px]">Depends on</Label><Select value={t.dependsOn[0] ?? "none"} onValueChange={(v) => set(t.id, { dependsOn: v === "none" ? [] : [v] })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No dependency</SelectItem>{p.tasks.filter((o) => o.id !== t.id).map((o) => <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-[11px]">Deadline</Label><Input type="date" className="h-9" value={t.deadline ?? ""} onChange={(e) => set(t.id, { deadline: e.target.value })} /></div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
            <label className="inline-flex items-center gap-2"><Switch checked={t.approval} disabled={t.priority === "HIGH" || t.priority === "CRITICAL" || (a && RANK[a.risk] >= 2)} onCheckedChange={(v) => set(t.id, { approval: v })} />Require Founder approval{(t.priority === "HIGH" || t.priority === "CRITICAL") && " (mandatory)"}</label>
            <label className="inline-flex items-center gap-2">Hand off to<Select value={t.handoffTo ?? "none"} onValueChange={(v) => set(t.id, v === "none" ? { handoffTo: undefined } as Partial<PlanTask> : { handoffTo: v, handoffReason: `Needs ${agentById(v)?.category} capability` })}><SelectTrigger className="h-8 w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No handoff</SelectItem>{AGENTS.filter((x) => x.id !== t.agentId).map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent></Select></label>
          </div>
          <div className="mt-3"><p className="text-[11px] text-muted-foreground">Verification steps</p><ul className="mt-1 list-disc pl-5 text-xs">{t.verification.map((v) => <li key={v}>{v}</li>)}</ul>
            <div className="mt-1 flex gap-2"><Input className="h-8" value={verif[t.id] ?? ""} onChange={(e) => setVerif({ ...verif, [t.id]: e.target.value })} placeholder="e.g. Founder confirms risk score dropped" /><Button size="sm" variant="outline" onClick={() => { const v = (verif[t.id] ?? "").trim(); if (!v) return; set(t.id, { verification: [...t.verification, v] }); setVerif({ ...verif, [t.id]: "" }); }}>Add verification step</Button></div></div>
        </article>;
      })}</div>}
    </DetailSection>
    {assign && <AssignDialog task={assign} onClose={() => setAssign(null)} />}
  </PageShell>;
}

type Ctrl = "Pause" | "Resume" | "Retry" | "Reassign" | "Escalate" | "Stop" | "Verify";
const MSG_KINDS: MsgKind[] = ["Instruction", "Clarification", "Handoff", "Result", "Exception", "Escalation"];

export function LiveExecution() {
  const [p, updatePlan] = usePlan(); const [s, update] = useOps();
  const [confirm, setConfirm] = useState<null | { c: Ctrl; t: OpsTask }>(null);
  const [msg, setMsg] = useState<{ kind: MsgKind; text: string; task: string }>({ kind: "Clarification", text: "", task: "" });
  const [learn, setLearn] = useState("");
  const pairs = p.tasks.map((pt) => ({ pt, t: s.tasks.find((o) => o.id === pt.opsTaskId) })).filter((x): x is { pt: PlanTask; t: OpsTask } => !!x.t);
  const verified = (t: OpsTask) => s.runs.some((r) => r.taskId === t.id && r.status === "Completed");
  const failedRun = (t: OpsTask) => s.runs.some((r) => r.taskId === t.id && (r.status === "Failed" || r.status === "Stopped"));
  const c = { tasks: pairs.length, completed: pairs.filter((x) => x.t.status === "Completed").length, blocked: pairs.filter((x) => x.t.status === "Blocked").length, waiting: pairs.filter((x) => x.t.status === "Waiting Approval").length, failed: pairs.filter((x) => failedRun(x.t) || x.t.status === "Cancelled").length, verified: pairs.filter((x) => verified(x.t)).length };
  const agents = [...new Set(pairs.map((x) => x.t.agentId))];
  const highRisk = (t: OpsTask) => RANK[t.priority] >= 2 || RANK[agentById(t.agentId)?.risk ?? "LOW"] >= 2;
  const DANGER: Ctrl[] = ["Stop", "Reassign", "Retry", "Resume"];
  const act = (ctl: Ctrl, t: OpsTask, confirmed = false) => {
    if (s.killSwitch && ctl !== "Stop" && ctl !== "Escalate") { toast.error("Global stop is active"); return; }
    if (!confirmed && (ctl === "Stop" || (DANGER.includes(ctl) && highRisk(t)))) { setConfirm({ c: ctl, t }); return; }
    const now = new Date().toISOString(); const name = agentById(t.agentId)?.name ?? t.agentId;
    update((x) => {
      const tasks = x.tasks.map((o) => o.id !== t.id ? o : { ...o, status: ({ Pause: "Blocked", Resume: "In Progress", Retry: "Queued", Reassign: o.status, Escalate: o.status, Stop: "Cancelled", Verify: "Completed" } as const)[ctl] });
      const runs = ctl === "Verify" ? [{ id: uid("run"), taskId: t.id, agentId: t.agentId, status: "Completed" as const, steps: ["Verify"], at: now }, ...x.runs] : ctl === "Stop" ? [{ id: uid("run"), taskId: t.id, agentId: t.agentId, status: "Stopped" as const, steps: [], at: now }, ...x.runs] : x.runs;
      return { ...x, tasks, runs };
    }, { kind: ctl === "Escalate" ? "Escalation" : "Control", text: `${ctl}: ${t.title} (${name})`, agentId: t.agentId });
    if (ctl === "Escalate" || ctl === "Stop") postMsg(t.id, ctl === "Stop" ? "Exception" : "Escalation", `${ctl} requested by Founder`);
    toast.success(`${ctl} recorded (preview)`);
  };
  const postMsg = (opsId: string, kind: MsgKind, text: string) => updatePlan((x) => ({ ...x, tasks: x.tasks.map((pt) => pt.opsTaskId !== opsId ? pt : { ...pt, messages: [...pt.messages, { id: uid("m"), at: new Date().toISOString(), kind, from: "Founder", to: agentById(s.tasks.find((o) => o.id === opsId)?.agentId ?? "")?.name ?? "Worker", text }] }) }));
  const exceptions = pairs.flatMap(({ pt, t }) => {
    const dep = pt.dependsOn.map((d) => p.tasks.find((x) => x.id === d)).filter(Boolean) as PlanTask[];
    const depOpen = dep.some((d) => s.tasks.find((o) => o.id === d.opsTaskId)?.status !== "Completed");
    const late = t.due && t.status !== "Completed" && new Date(t.due) < new Date(new Date().toDateString());
    const out: { type: string; t: OpsTask; impact: string; evidence: string; response: string; level: Severity }[] = [];
    if (depOpen && t.status !== "Completed") out.push({ type: "Blocked dependency", t, impact: "Task cannot start", evidence: `Waits on ${dep.map((d) => d.title).join(", ")}`, response: "Complete or reprioritize the dependency", level: "MEDIUM" });
    if (failedRun(t)) out.push({ type: "Failed worker", t, impact: "Work not delivered", evidence: "Run stopped or failed", response: "Retry or reassign", level: "HIGH" });
    if (t.status === "Waiting Approval") out.push({ type: "Missing approval", t, impact: "Held at approval gate", evidence: "Founder approval required", response: "Review and approve in Approvals", level: highRisk(t) ? "HIGH" : "MEDIUM" });
    if (late) out.push({ type: "SLA breach", t, impact: "Deadline passed", evidence: `Due ${t.due}`, response: "Escalate or reset deadline", level: "HIGH" });
    if (t.status === "Completed" && pt.verification.length && !verified(t)) out.push({ type: "Verification pending", t, impact: "Outcome unconfirmed", evidence: `${pt.verification.length} verification step(s) open`, response: "Run verification", level: "MEDIUM" });
    return out;
  });
  const deferred = p.tasks.filter((t) => t.deferred || !t.opsTaskId);
  const escalated = s.events.filter((e) => e.kind === "Escalation").length;
  const messages = p.tasks.flatMap((t) => t.messages.map((m) => ({ ...m, task: t.title }))).sort((a, b) => b.at.localeCompare(a.at));

  return <PageShell>
    <BackLink to="/ai-ceo/morning" label="Morning AI" />
    <section className="flex flex-wrap items-end justify-between gap-3"><div><p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><GitBranch className="h-3.5 w-3.5" /> Morning AI · Orchestration</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Live Execution</h1><p className="mt-1 text-sm text-muted-foreground">Active plan: {p.objective || "Untitled plan"}</p></div><Button asChild size="sm" variant="outline"><Link to="/ai-ceo/morning/plan">Edit plan</Link></Button></section>
    <WorkerBackend />
    <PreviewNotice>Below this line is the plan preview: controls change preview state in this tab only. No worker is running; "Verify" records a Founder verification, not an automated check.</PreviewNotice>
    <DetailSection title="Orchestration flow"><OrchestrationFlow reached={useStage()} /></DetailSection>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">{([["Current agents", agents.length], ["Current tasks", c.tasks], ["Completed", c.completed], ["Blocked", c.blocked], ["Waiting", c.waiting], ["Failed", c.failed], ["Verified", c.verified]] as const).map(([k, v]) => <div key={k} className="bento-card p-3"><p className="text-xl font-semibold tabular-nums">{v}</p><p className="text-[11px] text-muted-foreground">{k}</p></div>)}</div>

    <Tabs defaultValue="execution">
      <TabsList className="flex h-auto flex-wrap"><TabsTrigger value="execution">Execution</TabsTrigger><TabsTrigger value="handoffs">Handoffs</TabsTrigger><TabsTrigger value="comms">Communication</TabsTrigger><TabsTrigger value="exceptions">Exceptions · {exceptions.length}</TabsTrigger><TabsTrigger value="close">Daily close</TabsTrigger></TabsList>

      <TabsContent value="execution" className="space-y-3">
        {pairs.length === 0 ? <Unavailable>No staged tasks. Build a plan and stage it to see execution here.</Unavailable> : pairs.map(({ pt, t }) => {
          const steps = [["Started", t.status !== "Queued" && t.status !== "Waiting Approval"], ["Progress", t.status === "In Progress" || t.status === "Completed"], ["Checkpoint", t.status === "Completed" || t.status === "Blocked"], ["Result", t.status === "Completed"], ["Verification", verified(t)]] as const;
          return <article key={t.id} className="bento-card min-w-0 space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="break-words text-sm font-medium">{t.title}</p><p className="text-[11px] text-muted-foreground">{agentById(t.agentId)?.name} · {t.due ? `due ${t.due}` : "no deadline"}</p></div><div className="flex items-center gap-2"><SeverityBadge level={t.priority} /><Pill value={t.status} />{highRisk(t) && <ShieldAlert className="h-4 w-4 text-accent-amber" aria-label="High risk" />}</div></div>
            <ol className="flex flex-wrap gap-1">{steps.map(([k, done]) => <li key={k} className={cn("rounded-md border px-2 py-0.5 text-[10px]", done ? "border-accent-emerald/40 text-accent-emerald" : "border-border text-muted-foreground")}>{done ? "✓ " : ""}{k}</li>)}</ol>
            <div className="flex flex-wrap gap-1">{(["Pause", "Resume", "Retry", "Reassign", "Escalate", "Stop", "Verify"] as Ctrl[]).map((ctl) => <Button key={ctl} size="sm" variant={ctl === "Stop" ? "destructive" : "ghost"} onClick={() => ctl === "Reassign" ? setConfirm({ c: ctl, t }) : act(ctl, t)}>{ctl}</Button>)}<Button asChild size="sm" variant="ghost"><Link to="/ai-ceo/tasks/$taskId" params={{ taskId: t.id }}>Inspect</Link></Button></div>
            {pt.verification.length > 0 && <p className="text-[11px] text-muted-foreground">Verification: {pt.verification.join(" · ")}</p>}
          </article>;
        })}
      </TabsContent>

      <TabsContent value="handoffs" className="space-y-3">
        {p.tasks.filter((t) => t.handoffTo).length === 0 ? <Unavailable>No handoffs in this plan. Set "Hand off to" on a task in the plan builder.</Unavailable> : p.tasks.filter((t) => t.handoffTo).map((t) => {
          const o = s.tasks.find((x) => x.id === t.opsTaskId);
          const chain = [agentById(t.agentId ?? "")?.name ?? "Unassigned", t.title, agentById(t.handoffTo!)?.name ?? "—", "Verification", o && verified(o) ? "Outcome verified" : "Outcome pending"];
          return <article key={t.id} className="bento-card space-y-2 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center">{chain.map((n, i) => <span key={i} className="inline-flex items-center gap-1 text-xs"><span className="rounded-md border border-border px-2 py-1">{n}</span>{i < chain.length - 1 && <><ArrowRight className="hidden h-3 w-3 sm:block" /><ArrowDown className="h-3 w-3 sm:hidden" /></>}</span>)}</div>
            <dl className="grid gap-1 text-[11px] sm:grid-cols-2"><div><dt className="inline text-muted-foreground">Reason: </dt><dd className="inline">{t.handoffReason}</dd></div><div><dt className="inline text-muted-foreground">Dependency: </dt><dd className="inline">{t.dependsOn.length ? p.tasks.find((x) => x.id === t.dependsOn[0])?.title : "None"}</dd></div><div><dt className="inline text-muted-foreground">Context: </dt><dd className="inline">{t.requirement || "—"}</dd></div><div><dt className="inline text-muted-foreground">Evidence: </dt><dd className="inline">{o?.source ?? "Not staged"}</dd></div><div><dt className="inline text-muted-foreground">Status: </dt><dd className="inline">{o?.status ?? "Draft"}</dd></div></dl>
          </article>;
        })}
      </TabsContent>

      <TabsContent value="comms" className="space-y-3">
        <div className="bento-card grid gap-2 p-3 sm:grid-cols-[160px_180px_1fr_auto]">
          <Select value={msg.task} onValueChange={(v) => setMsg({ ...msg, task: v })}><SelectTrigger aria-label="Task"><SelectValue placeholder="Task" /></SelectTrigger><SelectContent>{pairs.map(({ t }) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent></Select>
          <Select value={msg.kind} onValueChange={(v) => setMsg({ ...msg, kind: v as MsgKind })}><SelectTrigger aria-label="Message type"><SelectValue /></SelectTrigger><SelectContent>{MSG_KINDS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select>
          <Input value={msg.text} onChange={(e) => setMsg({ ...msg, text: e.target.value })} placeholder="Operational instruction or note" />
          <Button disabled={!msg.task || !msg.text.trim()} onClick={() => { postMsg(msg.task, msg.kind, msg.text.trim()); setMsg({ ...msg, text: "" }); toast("Logged (not delivered — no worker is connected)"); }}>Log</Button>
        </div>
        {messages.length === 0 ? <Unavailable>No operational messages yet.</Unavailable> : <ol className="space-y-2">{messages.map((m) => <li key={m.id} className="rounded-lg border border-border p-3 text-sm"><div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground"><Pill value={m.kind} /><span>{m.from} → {m.to}</span><span>· {m.task}</span><span className="ml-auto">{fmt(m.at)}</span></div><p className="mt-1 break-words">{m.text}</p></li>)}</ol>}
      </TabsContent>

      <TabsContent value="exceptions" className="space-y-2">
        <p className="text-[11px] text-muted-foreground">Detected: blocked dependency, failed worker, missing approval, SLA breach (past deadline), verification pending. Timeouts and unexpected results need the execution backend.</p>
        {exceptions.length === 0 ? <Unavailable><CheckCircle2 className="mr-1 inline h-4 w-4" />No exceptions.</Unavailable> : exceptions.map((e, i) => <article key={i} className="bento-card space-y-2 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">{e.type} · <span className="font-normal">{e.t.title}</span></p><SeverityBadge level={e.level} /></div>
          <dl className="grid gap-1 text-[11px] sm:grid-cols-2 lg:grid-cols-4"><div><dt className="text-muted-foreground">Impact</dt><dd>{e.impact}</dd></div><div><dt className="text-muted-foreground">Evidence</dt><dd>{e.evidence}</dd></div><div><dt className="text-muted-foreground">Recommended response</dt><dd>{e.response}</dd></div><div><dt className="text-muted-foreground">Owner</dt><dd>{agentById(e.t.agentId)?.owner ?? "Founder"}</dd></div></dl>
          <div className="flex flex-wrap gap-1"><Button size="sm" variant="ghost" onClick={() => act("Escalate", e.t)}>Escalate</Button><Button size="sm" variant="ghost" onClick={() => act("Retry", e.t)}>Retry</Button><Button asChild size="sm" variant="ghost"><Link to="/ai-ceo/tasks/$taskId" params={{ taskId: e.t.id }}>Inspect</Link></Button></div>
        </article>)}
      </TabsContent>

      <TabsContent value="close" className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Sunset className="h-4 w-4 text-accent-amber" /> End-of-day summary for this plan</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{([["Planned", p.tasks.length], ["Completed", c.completed], ["Verified", c.verified], ["Failed", c.failed], ["Deferred", deferred.length], ["Escalated", escalated]] as const).map(([k, v]) => <div key={k} className="bento-card p-3"><p className="text-xl font-semibold tabular-nums">{v}</p><p className="text-[11px] text-muted-foreground">{k}</p></div>)}</div>
        <div className="grid gap-4 lg:grid-cols-2">
          <DetailSection title="Learnings">{p.learnings.length ? <ul className="list-disc space-y-1 pl-5 text-sm">{p.learnings.map((l) => <li key={l}>{l}</li>)}</ul> : <p className="text-xs text-muted-foreground">No learnings recorded.</p>}
            <div className="mt-2 flex gap-2"><Input value={learn} onChange={(e) => setLearn(e.target.value)} placeholder="What should Morning AI remember?" /><Button variant="outline" onClick={() => { if (!learn.trim()) return; updatePlan((x) => ({ ...x, learnings: [...x.learnings, learn.trim()] })); setLearn(""); }}>Add</Button></div></DetailSection>
          <DetailSection title="Tomorrow's carry-forward">{(() => { const carry = pairs.filter(({ t }) => t.status !== "Completed").map((x) => x.pt).concat(deferred); return carry.length ? <ul className="space-y-1 text-sm">{carry.map((t) => <li key={t.id} className="flex items-center justify-between gap-2"><span className="min-w-0 break-words">{t.title}</span><SeverityBadge level={t.priority} /></li>)}</ul> : <Unavailable>Nothing carries forward.</Unavailable>; })()}</DetailSection>
        </div>
      </TabsContent>
    </Tabs>

    <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirm?.c}: {confirm?.t.title}</AlertDialogTitle>
        <AlertDialogDescription>{confirm && highRisk(confirm.t) ? "High-risk work. This action requires Founder approval; confirming records your approval in this preview." : "Confirm this control action."} {confirm?.c === "Reassign" && "The task will be moved to the next best-matching worker."} Nothing is executed.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => {
          if (!confirm) return;
          if (confirm.c === "Reassign") {
            const t = confirm.t; const next = AGENTS.find((a) => a.id !== t.agentId && a.category === agentById(t.agentId)?.category) ?? AGENTS.find((a) => a.id !== t.agentId)!;
            update((x) => ({ ...x, tasks: x.tasks.map((o) => o.id === t.id ? { ...o, agentId: next.id } : o) }), { kind: "Control", text: `Reassigned ${t.title} to ${next.name}`, agentId: next.id });
            postMsg(t.id, "Handoff", `Reassigned to ${next.name}`); toast.success(`Reassigned to ${next.name} (preview)`);
          } else act(confirm.c, confirm.t, true);
          setConfirm(null);
        }}>Confirm{confirm && highRisk(confirm.t) ? " & approve" : ""}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </PageShell>;
}
