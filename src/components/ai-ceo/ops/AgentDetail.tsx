import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackLink, DetailSection, SeverityBadge, Unavailable } from "@/components/ai-ceo/governance/shared";
import { useCEOData } from "@/hooks/useCEOData";
import { CAPABILITIES, PERMISSIONS, RISK_TIER_INFO, agentForText, type AgentDef } from "./catalog";
import { useOps } from "./store";
import { AccessPill, AssignTaskDialog, Pill, PreviewNotice, agentStatus, fmt } from "./ui";
import { RunWorkspace } from "./RunWorkspace";

export function AgentDetail({ agent }: { agent: AgentDef }) {
  const [s, update] = useOps();
  const { data } = useCEOData();
  const [assign, setAssign] = useState(false);
  const status = agentStatus(agent, s.tasks, s.paused, s.killSwitch);
  const tasks = s.tasks.filter((t) => t.agentId === agent.id);
  const events = s.events.filter((e) => e.agentId === agent.id);
  const escalations = [
    ...data.decisions.filter((d) => d.aiDecision === "escalate" && agentForText(`${d.action} ${d.type}`).id === agent.id).map((d) => d.action),
    ...data.riskCategories.filter((r) => (r.level === "critical" || r.level === "high") && agentForText(r.category).id === agent.id).map((r) => `${r.category} (${r.level})`),
  ];
  const paused = s.paused.includes(agent.id);
  const setPause = (on: boolean) => {
    update((x) => ({ ...x, paused: on ? [...x.paused, agent.id] : x.paused.filter((p) => p !== agent.id) }), { kind: "Control", text: `${agent.name} ${on ? "paused" : "resumed"}`, agentId: agent.id });
    toast.success(`${agent.name} ${on ? "paused" : "resumed"} (preview)`);
  };

  return (
    <PageShell>
      <BackLink to="/ai-ceo/agents" label="Operations Agents" />
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{agent.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><Pill value={status} /><span>{agent.category}</span><SeverityBadge level={agent.risk} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setAssign(true)}>Assign Task</Button>
          {paused ? <Button variant="outline" onClick={() => setPause(false)}>Resume</Button> : <Button variant="outline" onClick={() => setPause(true)}>Pause</Button>}
          <Button asChild variant="ghost"><Link to="/ai-ceo/activity" search={{ agent: agent.id }}>View Activity</Link></Button>
        </div>
      </section>
      <PreviewNotice />

      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto flex-wrap">
          {["overview", "capabilities", "work", "history", "permissions", "policies", "performance", "activity", "escalations"].map((t) => <TabsTrigger key={t} value={t} className="capitalize">{t === "work" ? "Current work" : t === "history" ? "Task history" : t}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="overview" className="grid gap-3 md:grid-cols-2">
          <DetailSection title="Purpose">{agent.purpose}</DetailSection>
          <DetailSection title="Governance">Owner: {agent.owner}. Risk tier {agent.risk.toLowerCase()} — {RISK_TIER_INFO[agent.risk]} Founder AI coordinates this agent; it cannot act outside its permissions.</DetailSection>
        </TabsContent>
        <TabsContent value="capabilities" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agent.capabilities.map((c) => { const info = CAPABILITIES[c]!; const access = info.risk === "HIGH" ? "approval" : "allowed"; return (
            <div key={c} className="bento-card space-y-2 p-4"><p className="font-medium">{c}</p><p className="text-xs text-muted-foreground">{info.description}</p><div className="flex gap-2"><AccessPill a={access} /><SeverityBadge level={info.risk} /></div></div>
          ); })}
        </TabsContent>
        <TabsContent value="work"><RunWorkspace agent={agent} /></TabsContent>
        <TabsContent value="history">
          <DetailSection title="Task history">{tasks.length === 0 ? <Unavailable>No tasks assigned in this session.</Unavailable> : (
            <ul className="divide-y divide-border">{tasks.map((t) => <li key={t.id} className="flex items-center justify-between py-2"><Link to="/ai-ceo/tasks/$taskId" params={{ taskId: t.id }} className="hover:underline">{t.title}</Link><Pill value={t.status} /></li>)}</ul>)}</DetailSection>
        </TabsContent>
        <TabsContent value="permissions" id="permissions">
          <DetailSection title="Permission model">
            <table className="w-full text-xs"><thead><tr className="text-left text-muted-foreground"><th className="py-1">Permission</th><th>Access</th></tr></thead>
              <tbody>{PERMISSIONS.map((p) => <tr key={p} className="border-t border-border"><td className="py-2 font-medium text-foreground">{p.replace("_", " ")}</td><td><AccessPill a={agent.permissions[p]} /></td></tr>)}</tbody></table>
            <p className="mt-3 text-[11px]">No agent has an "everything allowed" default. Editing permissions requires the governance backend.</p>
          </DetailSection>
        </TabsContent>
        <TabsContent value="policies">
          <DetailSection title="Applicable policies">{data.complianceItems.length ? <ul className="space-y-1">{data.complianceItems.map((c) => <li key={c.id}>{c.policy} — {c.status} (last audit {c.lastAudit})</li>)}</ul> : <Unavailable>No policies on record.</Unavailable>}</DetailSection>
        </TabsContent>
        <TabsContent value="performance"><DetailSection title="Performance"><Unavailable>Agent performance metrics appear once agents run on the execution backend. Session: {tasks.filter((t) => t.status === "Completed").length} of {tasks.length} preview tasks completed.</Unavailable></DetailSection></TabsContent>
        <TabsContent value="activity"><DetailSection title="Activity">{events.length ? <ul className="space-y-1 text-xs">{events.map((e) => <li key={e.id}><span className="text-muted-foreground">{fmt(e.at)}</span> · {e.text}</li>)}</ul> : <Unavailable>No activity in this session.</Unavailable>}</DetailSection></TabsContent>
        <TabsContent value="escalations"><DetailSection title="Related escalations (on record)">{escalations.length ? <ul className="list-disc space-y-1 pl-4">{escalations.map((e) => <li key={e}>{e}</li>)}</ul> : <Unavailable>No escalations on record for this agent's area.</Unavailable>}<Link to="/ai-ceo/activity" className="mt-2 inline-block text-xs text-primary-glow hover:underline">Open Escalation Center</Link></DetailSection></TabsContent>
      </Tabs>
      {assign && <AssignTaskDialog open onOpenChange={setAssign} agentId={agent.id} />}
    </PageShell>
  );
}
