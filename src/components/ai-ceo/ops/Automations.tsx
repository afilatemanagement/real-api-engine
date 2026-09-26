import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Workflow } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DetailSection, Unavailable } from "@/components/ai-ceo/governance/shared";
import { AGENTS, agentById } from "./catalog";
import { uid, useOps, type Automation, type Trigger } from "./store";
import { Pill, PreviewNotice, fmt } from "./ui";

const TRIGGERS: Trigger[] = ["Schedule", "KPI threshold", "Risk level change", "New decision", "Manual"];
const ACTIONS = ["Create report", "Create recommendation", "Create task", "Escalate issue", "Request approval", "Trigger approved workflow"];
const STEP_NAMES = ["Trigger", "Conditions", "Agent & action", "Approval gate", "Verification", "Review"];

export function AutomationCenter() {
  const [s] = useOps();
  const [open, setOpen] = useState(false);
  return (
    <PageShell>
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Workflow className="h-3.5 w-3.5" /> Founder AI · Operations</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Automation Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">Design governed operational workflows with approval gates and verification.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />New automation</Button>
      </section>
      <PreviewNotice>Automations are configurations only. None will trigger or run until the automation backend is connected.</PreviewNotice>
      {s.automations.length === 0 ? <Unavailable>No automations configured. Create one with the builder.</Unavailable> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{s.automations.map((a) => (
          <article key={a.id} className="bento-card space-y-2 p-4">
            <div className="flex items-start justify-between"><Link to="/ai-ceo/automations/$automationId" params={{ automationId: a.id }} className="font-semibold hover:underline">{a.name}</Link><Pill value={a.state} /></div>
            <p className="text-xs text-muted-foreground">When {a.trigger.toLowerCase()} ({a.triggerDetail}) → {agentById(a.agentId)?.name}: {a.action}</p>
            <p className="text-[11px] text-muted-foreground">Approval: {a.approval} · Retries: {a.retries} · Runs: {s.runs.filter((r) => r.automationId === a.id).length}</p>
          </article>))}</div>)}
      {open && <AutomationBuilder onClose={() => setOpen(false)} />}
    </PageShell>
  );
}

function AutomationBuilder({ onClose }: { onClose: () => void }) {
  const [, update] = useOps();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Omit<Automation, "id" | "createdAt" | "state">>({
    name: "", trigger: "Schedule", triggerDetail: "Every Monday 09:00", conditions: [], agentId: AGENTS[0]!.id,
    action: "Create report", approval: "Founder", verification: "Founder reviews the output", retries: 1,
  });
  const [cond, setCond] = useState("");
  const risky = a.action === "Trigger approved workflow" || (agentById(a.agentId)?.risk ?? "LOW") !== "LOW";
  const save = () => {
    if (!a.name.trim()) { setStep(5); toast.error("Name the automation"); return; }
    const id = uid("auto");
    update((s) => ({ ...s, automations: [{ ...a, id, state: "Configured", createdAt: new Date().toISOString() }, ...s.automations] }), { kind: "Automation", text: `Automation "${a.name}" configured`, agentId: a.agentId });
    toast.success("Automation configured (not active)"); onClose();
    void navigate({ to: "/ai-ceo/automations/$automationId", params: { automationId: id } });
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Automation builder · {STEP_NAMES[step]}</DialogTitle><DialogDescription>Step {step + 1} of {STEP_NAMES.length}</DialogDescription></DialogHeader>
        <div className="min-h-[180px] space-y-3 text-sm">
          {step === 0 && <><Label>Trigger type</Label><Select value={a.trigger} onValueChange={(v) => setA({ ...a, trigger: v as Trigger })}><SelectTrigger aria-label="Trigger"><SelectValue /></SelectTrigger><SelectContent>{TRIGGERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            <Label htmlFor="td">Trigger detail</Label><Input id="td" value={a.triggerDetail} onChange={(e) => setA({ ...a, triggerDetail: e.target.value })} /></>}
          {step === 1 && <><Label htmlFor="cond">Add a condition (e.g. "Risk score ≥ 70")</Label>
            <div className="flex gap-2"><Input id="cond" value={cond} onChange={(e) => setCond(e.target.value)} /><Button type="button" variant="outline" onClick={() => { if (cond.trim()) { setA({ ...a, conditions: [...a.conditions, cond.trim()] }); setCond(""); } }}>Add</Button></div>
            <ul className="space-y-1">{a.conditions.map((c, i) => <li key={i} className="flex justify-between rounded border border-border px-2 py-1 text-xs">{i > 0 && "AND "}{c}<button className="text-muted-foreground" aria-label={`Remove ${c}`} onClick={() => setA({ ...a, conditions: a.conditions.filter((_, j) => j !== i) })}>×</button></li>)}</ul></>}
          {step === 2 && <><Label>Agent</Label><Select value={a.agentId} onValueChange={(v) => setA({ ...a, agentId: v })}><SelectTrigger aria-label="Agent"><SelectValue /></SelectTrigger><SelectContent>{AGENTS.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent></Select>
            <Label>Action</Label><Select value={a.action} onValueChange={(v) => setA({ ...a, action: v })}><SelectTrigger aria-label="Action"><SelectValue /></SelectTrigger><SelectContent>{ACTIONS.filter((x) => agentById(a.agentId)!.capabilities.includes(x)).map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
            <p className="text-[11px] text-muted-foreground">Only actions within the agent's capabilities are offered.</p></>}
          {step === 3 && <><Label>Approval gate</Label><Select value={a.approval} onValueChange={(v) => setA({ ...a, approval: v as Automation["approval"] })}><SelectTrigger aria-label="Approval"><SelectValue /></SelectTrigger>
            <SelectContent>{!risky && <SelectItem value="None">None (low-risk only)</SelectItem>}<SelectItem value="Founder">Founder approval</SelectItem><SelectItem value="Founder + second reviewer">Founder + second reviewer</SelectItem></SelectContent></Select>
            {risky && <p className="text-[11px] text-accent-amber">This agent/action is above low risk, so an approval gate is required.</p>}</>}
          {step === 4 && <><Label htmlFor="ver">Verification step</Label><Input id="ver" value={a.verification} onChange={(e) => setA({ ...a, verification: e.target.value })} />
            <Label>Retry policy (max retries)</Label><Select value={String(a.retries)} onValueChange={(v) => setA({ ...a, retries: Number(v) })}><SelectTrigger aria-label="Retries"><SelectValue /></SelectTrigger><SelectContent>{[0, 1, 2, 3].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select>
            <p className="text-[11px] text-muted-foreground">After final failure the run escalates to you.</p></>}
          {step === 5 && <><Label htmlFor="nm">Name</Label><Input id="nm" value={a.name} onChange={(e) => setA({ ...a, name: e.target.value })} placeholder="Weekly risk digest" />
            <p className="text-xs text-muted-foreground">When {a.trigger.toLowerCase()} ({a.triggerDetail}){a.conditions.length ? ` and ${a.conditions.join(" and ")}` : ""}, {agentById(a.agentId)?.name} will {a.action.toLowerCase()} — approval: {a.approval}; verify: {a.verification}.</p></>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => (step ? setStep(step - 1) : onClose())}>{step ? "Back" : "Cancel"}</Button>
          {step < 5 ? <Button onClick={() => { if (step === 2 && risky && a.approval === "None") setA({ ...a, approval: "Founder" }); setStep(step + 1); }}>Next</Button> : <Button onClick={save}>Save configuration</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WorkflowDetail({ id }: { id: string }) {
  const [s, update] = useOps();
  const a = s.automations.find((x) => x.id === id);
  if (!a) return <PageShell><Unavailable>This automation isn't in this browser session.</Unavailable><Link to="/ai-ceo/automations" className="text-sm text-primary-glow">Back to Automations</Link></PageShell>;
  const runs = s.runs.filter((r) => r.automationId === a.id);
  const setState = (state: Automation["state"]) => { update((x) => ({ ...x, automations: x.automations.map((y) => y.id === a.id ? { ...y, state } : y) }), { kind: "Automation", text: `Automation "${a.name}" ${state.toLowerCase()}`, agentId: a.agentId }); toast.success(`Automation ${state.toLowerCase()}`); };
  const testRun = () => update((x) => ({ ...x, runs: [{ id: uid("run"), automationId: a.id, agentId: a.agentId, status: a.approval === "None" ? "Queued" : "Waiting Approval", steps: ["Trigger", "Conditions"], at: new Date().toISOString() }, ...x.runs] }), { kind: "Run", text: `Manual test of "${a.name}" recorded (not executed)`, agentId: a.agentId });
  return (
    <PageShell>
      <Link to="/ai-ceo/automations" className="text-xs text-muted-foreground hover:text-foreground">← Automations</Link>
      <section className="flex flex-wrap items-start justify-between gap-2"><div><h1 className="text-2xl font-semibold">{a.name}</h1><Pill value={a.state} /></div>
        <div className="flex gap-2">{a.state === "Paused" ? <Button variant="outline" onClick={() => setState("Configured")}>Resume</Button> : <Button variant="outline" onClick={() => setState("Paused")}>Pause</Button>}<Button onClick={testRun} disabled={a.state === "Paused" || s.killSwitch}>Record test run</Button></div></section>
      <PreviewNotice />
      <ol className="grid gap-3 md:grid-cols-5">
        {[["Trigger", `${a.trigger}: ${a.triggerDetail}`], ["Conditions", a.conditions.join(" AND ") || "None"], ["Action", `${agentById(a.agentId)?.name} · ${a.action}`], ["Approval gate", a.approval], ["Verification", `${a.verification} · retries ${a.retries}`]].map(([k, v], i) => (
          <li key={k} className="bento-card p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{i + 1}. {k}</p><p className="mt-1 text-sm">{v}</p></li>))}
      </ol>
      <DetailSection title="Execution history">{runs.length === 0 ? <Unavailable>No runs recorded.</Unavailable> : <ul className="divide-y divide-border">{runs.map((r) => (
        <li key={r.id} className="flex items-center justify-between py-2 text-xs"><span>{fmt(r.at)} · steps: {r.steps.join(" → ")}</span><span className="flex items-center gap-2"><Pill value={r.status} />
          {r.status === "Waiting Approval" && <Button size="sm" variant="outline" onClick={() => update((x) => ({ ...x, runs: x.runs.map((y) => y.id === r.id ? { ...y, status: "Queued" } : y) }), { kind: "Approval", text: `Founder approved run of "${a.name}"`, agentId: a.agentId })}>Approve</Button>}
          {(r.status === "Queued" || r.status === "Waiting Approval") && <Button size="sm" variant="ghost" onClick={() => update((x) => ({ ...x, runs: x.runs.map((y) => y.id === r.id ? { ...y, status: "Stopped" } : y) }), { kind: "Control", text: `Run of "${a.name}" stopped`, agentId: a.agentId })}>Stop</Button>}
        </span></li>))}</ul>}</DetailSection>
    </PageShell>
  );
}
