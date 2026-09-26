import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ListTodo, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DetailSection, SeverityBadge, Unavailable } from "@/components/ai-ceo/governance/shared";
import { useCEOData } from "@/hooks/useCEOData";
import { agentById, agentForText } from "./catalog";
import { useOps, type TaskStatus } from "./store";
import { AssignTaskDialog, Pill, PreviewNotice } from "./ui";

const STATUSES: TaskStatus[] = ["Waiting Approval", "Queued", "In Progress", "Blocked", "Completed", "Cancelled"];

export function TaskCenter() {
  const [s] = useOps();
  const { data } = useCEOData();
  const [q, setQ] = useState(""); const [st, setSt] = useState("all");
  const [create, setCreate] = useState<null | { title: string; description: string; source: string; priority?: "HIGH" | "MEDIUM"; agentId?: string }>(null);
  const tasks = s.tasks.filter((t) => !q || t.title.toLowerCase().includes(q.toLowerCase())).filter((t) => st === "all" || t.status === st);
  const imported = new Set(s.tasks.map((t) => t.title));

  return (
    <PageShell>
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><ListTodo className="h-3.5 w-3.5" /> Founder AI · Operations</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Task Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">Assign, approve and track operational work for operations agents.</p>
        </div>
        <Button onClick={() => setCreate({ title: "", description: "", source: "Manual" })}><Plus className="mr-1 h-4 w-4" />New task</Button>
      </section>
      <PreviewNotice>Tasks live only in this browser tab until the tasks backend is connected. Agents do not receive them.</PreviewNotice>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["Waiting Approval", "Queued", "In Progress", "Completed"] as const).map((k) => <div key={k} className="bento-card p-4"><p className="text-xl font-semibold tabular-nums">{s.tasks.filter((t) => t.status === k).length}</p><p className="text-xs text-muted-foreground">{k}</p></div>)}
      </div>

      <Tabs defaultValue="list">
        <TabsList><TabsTrigger value="list">Task list</TabsTrigger><TabsTrigger value="queue">Work queue</TabsTrigger><TabsTrigger value="suggested">Suggested from operations</TabsTrigger></TabsList>
        <TabsContent value="list" className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3"><Search className="h-3.5 w-3.5 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks..." aria-label="Search tasks" className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0" /></div>
            <Select value={st} onValueChange={setSt}><SelectTrigger className="h-9 w-[170px]" aria-label="Status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{STATUSES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
          </div>
          {tasks.length === 0 ? <Unavailable>No tasks yet. Create one, or pick a suggestion from operations.</Unavailable> : (
            <ul className="bento-card divide-y divide-border">{tasks.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div><Link to="/ai-ceo/tasks/$taskId" params={{ taskId: t.id }} className="font-medium hover:underline">{t.title}</Link><p className="text-[11px] text-muted-foreground">{agentById(t.agentId)?.name} · {t.source}{t.due ? ` · due ${t.due}` : ""}</p></div>
                <div className="flex items-center gap-2"><SeverityBadge level={t.priority} /><Pill value={t.status} /></div>
              </li>))}</ul>)}
        </TabsContent>
        <TabsContent value="queue" className="grid gap-3 md:grid-cols-3">
          {(["Waiting Approval", "Queued", "In Progress"] as const).map((col) => (
            <DetailSection key={col} title={`${col} (${s.tasks.filter((t) => t.status === col).length})`}>
              <ul className="space-y-2">{s.tasks.filter((t) => t.status === col).map((t) => <li key={t.id} className="rounded-lg border border-border p-2"><Link to="/ai-ceo/tasks/$taskId" params={{ taskId: t.id }} className="text-foreground hover:underline">{t.title}</Link><p className="text-[11px]">{agentById(t.agentId)?.name}</p></li>)}</ul>
            </DetailSection>))}
        </TabsContent>
        <TabsContent value="suggested">
          <DetailSection title="Corrective actions on record">
            <ul className="divide-y divide-border">{data.correctiveActions.map((c) => {
              const title = `${c.team}: ${c.action}`; const agent = agentForText(`${c.team} ${c.issue}`);
              return (<li key={title} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div><p className="text-foreground">{title}</p><p className="text-[11px]">Issue: {c.issue} · Suggested agent: {agent.name}</p></div>
                <Button size="sm" variant="outline" disabled={imported.has(title)} onClick={() => setCreate({ title, description: `Issue: ${c.issue}`, source: "Corrective action", priority: c.priority === "high" ? "HIGH" : "MEDIUM", agentId: agent.id })}>{imported.has(title) ? "Task created" : "Create task"}</Button>
              </li>); })}</ul>
          </DetailSection>
        </TabsContent>
      </Tabs>
      {create && <AssignTaskDialog open onOpenChange={(o) => { if (!o) setCreate(null); }} {...(create.agentId ? { agentId: create.agentId } : {})} preset={{ title: create.title, description: create.description, source: create.source, ...(create.priority ? { priority: create.priority } : {}) }} />}
    </PageShell>
  );
}

export function TaskDetail({ taskId }: { taskId: string }) {
  const [s, update] = useOps();
  const t = s.tasks.find((x) => x.id === taskId);
  if (!t) return <PageShell><Unavailable>This task isn't in this browser session. Preview tasks clear when the tab closes.</Unavailable><Link to="/ai-ceo/tasks" className="text-sm text-primary-glow">Back to Task Center</Link></PageShell>;
  const set = (status: TaskStatus, text: string) => { update((x) => ({ ...x, tasks: x.tasks.map((y) => y.id === t.id ? { ...y, status } : y) }), { kind: "Task", text: `${text}: ${t.title}`, agentId: t.agentId }); toast.success(text); };
  const others = s.tasks.filter((x) => x.id !== t.id);
  const blockers = s.tasks.filter((x) => t.dependsOn.includes(x.id) && x.status !== "Completed");
  return (
    <PageShell>
      <Link to="/ai-ceo/tasks" className="text-xs text-muted-foreground hover:text-foreground">← Task Center</Link>
      <section><h1 className="text-2xl font-semibold">{t.title}</h1><div className="mt-1 flex gap-2"><Pill value={t.status} /><SeverityBadge level={t.priority} /></div></section>
      <PreviewNotice />
      <div className="grid gap-3 md:grid-cols-2">
        <DetailSection title="Details"><p>{t.description || "No instructions."}</p><p className="mt-2 text-[11px]">Agent: <Link to="/ai-ceo/agents/$agentId" params={{ agentId: t.agentId }} className="text-primary-glow">{agentById(t.agentId)?.name}</Link> · Source: {t.source} · Created {new Date(t.createdAt).toLocaleString()}</p></DetailSection>
        <DetailSection title="Founder control">
          <div className="flex flex-wrap gap-2">
            {t.status === "Waiting Approval" && <><Button size="sm" onClick={() => set("Queued", "Task approved")}>Approve</Button><Button size="sm" variant="outline" onClick={() => set("Cancelled", "Task rejected")}>Reject</Button></>}
            {t.status === "Blocked" && <Button size="sm" onClick={() => set("Queued", "Task requeued")}>Retry</Button>}
            {t.status !== "Completed" && t.status !== "Cancelled" && <Button size="sm" variant="destructive" onClick={() => set("Cancelled", "Task cancelled")}>Cancel</Button>}
          </div>
          {blockers.length > 0 && <p className="mt-2 text-xs text-accent-amber">Blocked by {blockers.length} unfinished dependenc{blockers.length === 1 ? "y" : "ies"}.</p>}
        </DetailSection>
        <DetailSection title="Dependencies">
          {others.length === 0 ? <Unavailable>No other tasks to depend on.</Unavailable> : <ul className="space-y-1">{others.map((o) => (
            <li key={o.id}><label className="flex items-center gap-2"><input type="checkbox" checked={t.dependsOn.includes(o.id)} onChange={(e) => update((x) => ({ ...x, tasks: x.tasks.map((y) => y.id === t.id ? { ...y, dependsOn: e.target.checked ? [...y.dependsOn, o.id] : y.dependsOn.filter((d) => d !== o.id) } : y) }))} />{o.title} <Pill value={o.status} /></label></li>))}</ul>}
        </DetailSection>
        <DetailSection title="Activity">{s.events.filter((e) => e.text.includes(t.title)).map((e) => <p key={e.id} className="text-xs">{new Date(e.at).toLocaleString()} · {e.text}</p>)}</DetailSection>
      </div>
    </PageShell>
  );
}
