import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FolderKanban, Plus } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailSection, SeverityBadge, Unavailable, riskSeverity } from "@/components/ai-ceo/governance/shared";
import { useCEOData } from "@/hooks/useCEOData";
import { AssignTaskDialog, Pill, PreviewNotice } from "@/components/ai-ceo/ops/ui";
import { useOps } from "@/components/ai-ceo/ops/store";
import { agentById } from "@/components/ai-ceo/ops/catalog";
import { Comments } from "./Comments";
import { useWork, wid, type Project } from "./store";

const STATUSES: Project["status"][] = ["Planning", "Active", "At Risk", "On Hold", "Completed"];
const progress = (p: Project) => p.milestones.length ? Math.round((p.milestones.filter((m) => m.done).length / p.milestones.length) * 100) : 0;

export function ProjectsList() {
  const [s, update] = useWork();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", objective: "", owner: "Founder" });
  const create = () => {
    if (!f.name.trim()) { toast.error("Name the project"); return; }
    const id = wid("prj");
    update((x) => ({ ...x, projects: [{ id, name: f.name.trim(), objective: f.objective.trim(), owner: f.owner, status: "Planning", milestones: [], taskIds: [], riskIds: [], decisionIds: [], researchIds: [], reportIds: [], knowledge: [], files: [], comments: [], createdAt: new Date().toISOString() }, ...x.projects] }), { scope: `project:${id}`, text: `Project created: ${f.name.trim()}` });
    setOpen(false); setF({ name: "", objective: "", owner: "Founder" });
    void navigate({ to: "/ai-ceo/projects/$projectId", params: { projectId: id } });
  };
  return (
    <PageShell>
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><FolderKanban className="h-3.5 w-3.5" /> Founder AI · Work</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Operational Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">Coordinate initiatives: objective, plan, work, risks, decisions and outcomes.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />New project</Button>
      </section>
      <PreviewNotice>Projects are saved only in this browser tab until the projects backend is connected.</PreviewNotice>
      {s.projects.length === 0 ? <Unavailable>No projects yet. Create one to group tasks, risks, decisions and research.</Unavailable> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{s.projects.map((p) => (
          <article key={p.id} className="bento-card space-y-2 p-4">
            <div className="flex items-start justify-between"><Link to="/ai-ceo/projects/$projectId" params={{ projectId: p.id }} className="font-semibold hover:underline">{p.name}</Link><Pill value={p.status} /></div>
            <p className="line-clamp-2 text-xs text-muted-foreground">{p.objective || "No objective set"}</p>
            <Progress value={progress(p)} aria-label={`${progress(p)}% of milestones done`} />
            <p className="text-[11px] text-muted-foreground">{progress(p)}% milestones · {p.taskIds.length} tasks · {p.riskIds.length} risks · owner {p.owner}</p>
          </article>))}</div>)}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New operational project</DialogTitle><DialogDescription>Operations initiatives only — development work belongs to the separate development module.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label htmlFor="pn">Name</Label><Input id="pn" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Reduce payout exceptions" /></div>
            <div><Label htmlFor="po">Objective</Label><Textarea id="po" value={f.objective} onChange={(e) => setF({ ...f, objective: e.target.value })} rows={2} /></div>
            <div><Label htmlFor="pw">Owner</Label><Input id="pw" value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function LinkPicker({ label, options, selected, onToggle }: { label: string; options: { id: string; title: string }[]; selected: string[]; onToggle: (id: string, on: boolean) => void }) {
  return (
    <details className="mt-3 text-xs"><summary className="cursor-pointer text-primary-glow">{label}</summary>
      <ul className="mt-2 max-h-48 space-y-1 overflow-auto">{options.map((o) => <li key={o.id}><label className="flex gap-2"><input type="checkbox" checked={selected.includes(o.id)} onChange={(e) => onToggle(o.id, e.target.checked)} />{o.title}</label></li>)}</ul></details>
  );
}

export function ProjectWorkspace({ id }: { id: string }) {
  const [s, update] = useWork();
  const [ops] = useOps();
  const { data } = useCEOData();
  const [ms, setMs] = useState({ title: "", due: "" });
  const [task, setTask] = useState(false);
  const p = s.projects.find((x) => x.id === id);
  if (!p) return <PageShell><Unavailable>This project isn't in this browser session.</Unavailable><Link to="/ai-ceo/projects" className="text-sm text-primary-glow">Back to Projects</Link></PageShell>;
  const patch = (x: Partial<Project>, text?: string) => update((st) => ({ ...st, projects: st.projects.map((y) => y.id === p.id ? { ...y, ...x } : y) }), text ? { scope: `project:${p.id}`, text } : undefined);
  const toggle = (key: "taskIds" | "riskIds" | "decisionIds" | "researchIds" | "reportIds" | "knowledge", name: string) => (oid: string, on: boolean) =>
    patch({ [key]: on ? [...p[key], oid] : p[key].filter((v) => v !== oid) } as Partial<Project>, `${on ? "Linked" : "Unlinked"} ${name}`);
  const tasks = ops.tasks.filter((t) => p.taskIds.includes(t.id));
  const risks = data.riskCategories.filter((r) => p.riskIds.includes(r.id));
  const decisions = data.decisions.filter((d) => p.decisionIds.includes(d.id));
  const reports = data.reports.filter((r) => p.reportIds.includes(r.id));
  const research = s.research.filter((r) => p.researchIds.includes(r.id));
  const knowledge = data.complianceItems.filter((c) => p.knowledge.includes(c.id));
  const events = s.events.filter((e) => e.scope === `project:${p.id}`);

  return (
    <PageShell>
      <Link to="/ai-ceo/projects" className="text-xs text-muted-foreground hover:text-foreground">← Projects</Link>
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">{p.name}</h1><p className="mt-1 text-xs text-muted-foreground">Owner {p.owner} · created {new Date(p.createdAt).toLocaleDateString()}</p></div>
        <Select value={p.status} onValueChange={(v) => patch({ status: v as Project["status"] }, `Status changed to ${v}`)}><SelectTrigger className="w-[150px]" aria-label="Project status"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
      </section>
      <PreviewNotice>Project workspace preview — saved in this browser tab only.</PreviewNotice>
      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto flex-wrap">{["overview", "milestones", "tasks", "risks", "decisions", "knowledge", "reports", "files", "discussion", "activity"].map((t) => <TabsTrigger key={t} value={t} className="capitalize">{t === "milestones" ? "Goals & milestones" : t}</TabsTrigger>)}</TabsList>
        <TabsContent value="overview" className="grid gap-3 md:grid-cols-2">
          <DetailSection title="Objective"><Textarea value={p.objective} onChange={(e) => patch({ objective: e.target.value })} rows={3} aria-label="Objective" /></DetailSection>
          <DetailSection title="Summary"><Progress value={progress(p)} /><ul className="mt-3 grid grid-cols-2 gap-1 text-xs">{[["Milestones done", `${p.milestones.filter((m) => m.done).length}/${p.milestones.length}`], ["Tasks", tasks.length], ["Open risks", risks.length], ["Decisions", decisions.length], ["Research", research.length], ["Files", p.files.length]].map(([k, v]) => <li key={k}>{k}: <span className="text-foreground">{v}</span></li>)}</ul></DetailSection>
        </TabsContent>
        <TabsContent value="milestones">
          <DetailSection title="Goals & milestones">
            {p.milestones.length === 0 ? <Unavailable>No milestones yet.</Unavailable> : <ul className="space-y-1">{p.milestones.map((m) => <li key={m.id}><label className="flex items-center gap-2"><input type="checkbox" checked={m.done} onChange={(e) => patch({ milestones: p.milestones.map((y) => y.id === m.id ? { ...y, done: e.target.checked } : y) }, `Milestone "${m.title}" ${e.target.checked ? "completed" : "reopened"}`)} /><span className={m.done ? "line-through" : "text-foreground"}>{m.title}</span>{m.due && <span className="text-[11px]">due {m.due}</span>}</label></li>)}</ul>}
            <div className="mt-3 flex flex-wrap gap-2"><Input value={ms.title} onChange={(e) => setMs({ ...ms, title: e.target.value })} placeholder="Milestone" className="flex-1" aria-label="Milestone" /><Input type="date" value={ms.due} onChange={(e) => setMs({ ...ms, due: e.target.value })} className="w-[160px]" aria-label="Due date" />
              <Button disabled={!ms.title.trim()} onClick={() => { patch({ milestones: [...p.milestones, { id: wid("m"), title: ms.title.trim(), done: false, ...(ms.due ? { due: ms.due } : {}) }] }, `Milestone added: ${ms.title.trim()}`); setMs({ title: "", due: "" }); }}>Add</Button></div>
          </DetailSection>
        </TabsContent>
        <TabsContent value="tasks">
          <DetailSection title="Project tasks">
            {tasks.length === 0 ? <Unavailable>No tasks linked.</Unavailable> : <ul className="divide-y divide-border">{tasks.map((t) => <li key={t.id} className="flex justify-between py-2"><Link to="/ai-ceo/tasks/$taskId" params={{ taskId: t.id }} className="text-foreground hover:underline">{t.title}</Link><span className="flex gap-2 text-[11px]">{agentById(t.agentId)?.name}<Pill value={t.status} /></span></li>)}</ul>}
            <div className="mt-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => setTask(true)}>New task</Button></div>
            <LinkPicker label="Link existing tasks" options={ops.tasks.map((t) => ({ id: t.id, title: t.title }))} selected={p.taskIds} onToggle={toggle("taskIds", "task")} />
          </DetailSection>
        </TabsContent>
        <TabsContent value="risks"><DetailSection title="Project risks (from risk register)">
          {risks.length === 0 ? <Unavailable>No risks linked.</Unavailable> : <ul className="space-y-2">{risks.map((r) => <li key={r.id} className="flex items-center justify-between"><Link to="/ai-ceo/risk/$id" params={{ id: r.id }} className="text-foreground hover:underline">{r.category}</Link><SeverityBadge level={riskSeverity(r)} /></li>)}</ul>}
          <LinkPicker label="Link risks" options={data.riskCategories.map((r) => ({ id: r.id, title: `${r.category} (${r.level})` }))} selected={p.riskIds} onToggle={toggle("riskIds", "risk")} /></DetailSection></TabsContent>
        <TabsContent value="decisions"><DetailSection title="Project decisions">
          {decisions.length === 0 ? <Unavailable>No decisions linked.</Unavailable> : <ul className="space-y-2">{decisions.map((d) => <li key={d.id}><Link to="/ai-ceo/decision-engine/$id" params={{ id: d.id }} className="text-foreground hover:underline">{d.action}</Link> <span className="text-[11px]">AI: {d.aiDecision} · {d.confidence}%</span></li>)}</ul>}
          <LinkPicker label="Link decisions" options={data.decisions.map((d) => ({ id: d.id, title: d.action }))} selected={p.decisionIds} onToggle={toggle("decisionIds", "decision")} /></DetailSection></TabsContent>
        <TabsContent value="knowledge" className="grid gap-3 md:grid-cols-2">
          <DetailSection title="Policies & knowledge">{knowledge.length === 0 ? <Unavailable>No knowledge linked.</Unavailable> : <ul className="space-y-1">{knowledge.map((k) => <li key={k.id}><Link to="/ai-ceo/company-brain" className="text-foreground hover:underline">{k.policy}</Link> <span className="text-[11px]">{k.status}</span></li>)}</ul>}
            <LinkPicker label="Link policies" options={data.complianceItems.map((c) => ({ id: c.id, title: c.policy }))} selected={p.knowledge} onToggle={toggle("knowledge", "policy")} /></DetailSection>
          <DetailSection title="Research">{research.length === 0 ? <Unavailable>No research linked.</Unavailable> : <ul className="space-y-1">{research.map((r) => <li key={r.id}><Link to="/ai-ceo/research/$researchId" params={{ researchId: r.id }} className="text-foreground hover:underline">{r.question}</Link> <Pill value={r.stage} /></li>)}</ul>}
            <LinkPicker label="Link research" options={s.research.map((r) => ({ id: r.id, title: r.question }))} selected={p.researchIds} onToggle={toggle("researchIds", "research")} /></DetailSection>
        </TabsContent>
        <TabsContent value="reports"><DetailSection title="Project reports">{reports.length === 0 ? <Unavailable>No reports linked.</Unavailable> : <ul className="space-y-1">{reports.map((r) => <li key={r.id}><Link to="/ai-ceo/reports/$id" params={{ id: r.id }} className="text-foreground hover:underline">{r.title}</Link> <span className="text-[11px]">{r.generatedAt}</span></li>)}</ul>}
          <LinkPicker label="Link reports" options={data.reports.map((r) => ({ id: r.id, title: r.title }))} selected={p.reportIds} onToggle={toggle("reportIds", "report")} /></DetailSection></TabsContent>
        <TabsContent value="files"><DetailSection title="Files & artifacts">
          <p className="mb-2 text-[11px]">Files are listed by name only — they are not uploaded or read (file storage not connected).</p>
          {p.files.length === 0 ? <Unavailable>No files attached.</Unavailable> : <ul className="divide-y divide-border">{p.files.map((f) => <li key={f.id} className="flex justify-between py-2 text-xs"><span className="text-foreground">{f.name}</span><span>{Math.ceil(f.size / 1024)} KB · {new Date(f.at).toLocaleDateString()} <button className="ml-2" onClick={() => patch({ files: p.files.filter((x) => x.id !== f.id) }, `File removed: ${f.name}`)}>Remove</button></span></li>)}</ul>}
          <label className="mt-3 inline-flex cursor-pointer items-center rounded-md border border-border px-3 py-1.5 text-xs">Attach files<input type="file" multiple className="sr-only" onChange={(e) => { const fs = Array.from(e.target.files ?? []); if (fs.length) patch({ files: [...p.files, ...fs.map((f) => ({ id: wid("file"), name: f.name, size: f.size, at: new Date().toISOString() }))] }, `${fs.length} file(s) attached`); }} /></label>
        </DetailSection></TabsContent>
        <TabsContent value="discussion"><DetailSection title="Collaboration"><Comments comments={p.comments} onAdd={(c) => patch({ comments: [...p.comments, c] }, "Comment added")} /></DetailSection></TabsContent>
        <TabsContent value="activity"><DetailSection title="Project activity">{events.length === 0 ? <Unavailable>No activity yet.</Unavailable> : <ol className="space-y-2 border-l border-border pl-4">{events.map((e) => <li key={e.id} className="text-xs"><span className="text-muted-foreground">{new Date(e.at).toLocaleString()}</span><p className="text-foreground">{e.text}</p></li>)}</ol>}</DetailSection></TabsContent>
      </Tabs>
      {task && <AssignTaskDialog open onOpenChange={setTask} preset={{ title: "", description: `Project: ${p.name}`, source: `Project: ${p.name}` }} />}
    </PageShell>
  );
}
