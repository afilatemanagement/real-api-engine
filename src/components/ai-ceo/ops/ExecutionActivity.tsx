import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, OctagonX } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DetailSection, SeverityBadge, Unavailable, type Severity } from "@/components/ai-ceo/governance/shared";
import { useCEOData } from "@/hooks/useCEOData";
import { AGENTS, agentById, agentForText } from "./catalog";
import { useOps } from "./store";
import { AssignTaskDialog, Pill, PreviewNotice, agentStatus, fmt } from "./ui";

export function ExecutionActivity({ agent }: { agent?: string }) {
  const [s, update] = useOps();
  const { data } = useCEOData();
  const [confirm, setConfirm] = useState(false);
  const [assign, setAssign] = useState<null | { title: string; agentId: string; priority: Severity }>(null);
  const events = s.events.filter((e) => !agent || e.agentId === agent);
  const escalations = [
    ...data.decisions.filter((d) => d.aiDecision === "escalate").map((d) => ({ id: `d-${d.id}`, title: d.action, why: d.reasoning, sev: "CRITICAL" as Severity, agent: agentForText(`${d.action} ${d.type}`), link: { to: "/ai-ceo/decision-engine/$id" as const, id: d.id } })),
    ...data.riskCategories.filter((r) => r.level === "critical" || r.level === "high").map((r) => ({ id: `r-${r.id}`, title: `${r.category}: ${r.issues} open issues`, why: `Risk score ${r.score}, trend ${r.trend}.`, sev: r.level.toUpperCase() as Severity, agent: agentForText(r.category), link: { to: "/ai-ceo/risk/$id" as const, id: r.id } })),
  ];
  const openEsc = escalations.filter((e) => !s.resolvedEscalations.includes(e.id));
  const kill = (on: boolean) => { update((x) => ({ ...x, killSwitch: on, tasks: on ? x.tasks.map((t) => t.status === "In Progress" ? { ...t, status: "Blocked" } : t) : x.tasks }), { kind: "Control", text: on ? "Global stop activated by Founder" : "Operations resumed by Founder" }); toast.success(on ? "All agent activity stopped" : "Operations resumed"); };

  return (
    <PageShell>
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Activity className="h-3.5 w-3.5" /> Founder AI · Operations</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Execution Activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">Monitor agent work, escalations and every controlled action.</p>
        </div>
        {s.killSwitch ? <Button onClick={() => kill(false)}>Resume operations</Button> : <Button variant="destructive" onClick={() => setConfirm(true)}><OctagonX className="mr-1 h-4 w-4" />Stop all agents</Button>}
      </section>
      <PreviewNotice />
      {s.killSwitch && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">Global stop is active. No agent runs, tasks or automations can proceed.</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Open escalations", openEsc.length], ["Tasks awaiting approval", s.tasks.filter((t) => t.status === "Waiting Approval").length], ["Runs recorded", s.runs.length], ["Failed / stopped", s.runs.filter((r) => r.status === "Failed" || r.status === "Stopped").length]].map(([k, v]) => <div key={k} className="bento-card p-4"><p className="text-xl font-semibold tabular-nums">{v}</p><p className="text-xs text-muted-foreground">{k}</p></div>)}
      </div>

      <Tabs defaultValue={agent ? "timeline" : "escalations"}>
        <TabsList className="flex h-auto flex-wrap"><TabsTrigger value="escalations">Escalations</TabsTrigger><TabsTrigger value="timeline">Timeline</TabsTrigger><TabsTrigger value="monitor">Monitoring</TabsTrigger><TabsTrigger value="history">Execution history</TabsTrigger></TabsList>
        <TabsContent value="escalations" className="space-y-2">
          <p className="text-[11px] text-muted-foreground">From the operational record: decisions Founder AI escalated and high/critical risks.</p>
          {escalations.length === 0 ? <Unavailable>No escalations on record.</Unavailable> : escalations.map((e) => {
            const done = s.resolvedEscalations.includes(e.id);
            return (
              <article key={e.id} className="bento-card flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="space-y-1"><div className="flex items-center gap-2"><SeverityBadge level={e.sev} />{done && <Pill value="Completed" />}</div>
                  <Link to={e.link.to} params={{ id: e.link.id }} className="font-medium hover:underline">{e.title}</Link>
                  <p className="text-xs text-muted-foreground">{e.why}</p><p className="text-[11px] text-muted-foreground">Suggested agent: {e.agent.name}</p></div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setAssign({ title: e.title, agentId: e.agent.id, priority: e.sev })}>Create task</Button>
                  <Button size="sm" variant="ghost" onClick={() => update((x) => ({ ...x, resolvedEscalations: done ? x.resolvedEscalations.filter((r) => r !== e.id) : [...x.resolvedEscalations, e.id] }), { kind: "Escalation", text: `Escalation "${e.title}" ${done ? "reopened" : "marked handled"}` })}>{done ? "Reopen" : "Mark handled"}</Button>
                </div>
              </article>); })}
        </TabsContent>
        <TabsContent value="timeline">
          <DetailSection title={agent ? `Activity · ${agentById(agent)?.name ?? agent}` : "Operational activity timeline"}>
            {agent && <Link to="/ai-ceo/activity" className="mb-2 inline-block text-xs text-primary-glow">Show all agents</Link>}
            {events.length === 0 ? <Unavailable>No actions recorded in this session yet.</Unavailable> : <ol className="space-y-2 border-l border-border pl-4">{events.map((e) => <li key={e.id} className="text-xs"><span className="text-muted-foreground">{fmt(e.at)} · {e.kind}</span><p className="text-foreground">{e.text}</p></li>)}</ol>}
          </DetailSection>
        </TabsContent>
        <TabsContent value="monitor">
          <DetailSection title="Agent workload">
            <table className="w-full text-xs"><thead><tr className="text-left text-muted-foreground"><th className="py-1">Agent</th><th>Status</th><th>Open tasks</th><th>Awaiting approval</th></tr></thead>
              <tbody>{AGENTS.map((a) => { const t = s.tasks.filter((x) => x.agentId === a.id); return (
                <tr key={a.id} className="border-t border-border"><td className="py-2"><Link to="/ai-ceo/agents/$agentId" params={{ agentId: a.id }} className="text-foreground hover:underline">{a.name}</Link></td><td><Pill value={agentStatus(a, s.tasks, s.paused, s.killSwitch)} /></td><td>{t.filter((x) => x.status === "Queued" || x.status === "In Progress").length}</td><td>{t.filter((x) => x.status === "Waiting Approval").length}</td></tr>); })}</tbody></table>
            <p className="mt-2 text-[11px]">"Offline" means the agent is defined but not deployed.</p>
          </DetailSection>
        </TabsContent>
        <TabsContent value="history">
          <DetailSection title="Execution history">{s.runs.length === 0 ? <Unavailable>No runs recorded.</Unavailable> : <ul className="divide-y divide-border">{s.runs.map((r) => <li key={r.id} className="flex items-center justify-between py-2 text-xs"><span>{fmt(r.at)} · {agentById(r.agentId)?.name} · {r.steps.join(" → ")}</span><Pill value={r.status} /></li>)}</ul>}</DetailSection>
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Stop all agent activity?</AlertDialogTitle><AlertDialogDescription>Every agent pauses, in-progress tasks become blocked and automations cannot run until you resume.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => kill(true)}>Stop all</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {assign && <AssignTaskDialog open onOpenChange={(o) => !o && setAssign(null)} agentId={assign.agentId} preset={{ title: assign.title, description: "From Escalation Center", source: "Escalation", priority: assign.priority }} />}
    </PageShell>
  );
}
