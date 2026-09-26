import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Circle, Microscope, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailSection, SeverityBadge, Unavailable } from "@/components/ai-ceo/governance/shared";
import { useCEOData } from "@/hooks/useCEOData";
import { answer } from "@/components/ai-ceo/chat/engine";
import { AssignTaskDialog, Pill, PreviewNotice } from "@/components/ai-ceo/ops/ui";
import { Comments } from "./Comments";
import { STAGES, useWork, wid, type Finding, type Research, type Source } from "./store";

const NOTE = "Research preview: Founder AI does not browse the web or read files yet. Evidence comes from your operational records and sources you add.";

export function ResearchCenter() {
  const [s, update] = useWork();
  const navigate = useNavigate();
  const [q, setQ] = useState(""); const [stage, setStage] = useState("all");
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState(""); const [scope, setScope] = useState(""); const [priority, setPriority] = useState<Research["priority"]>("MEDIUM");
  const list = s.research.filter((r) => !q || r.question.toLowerCase().includes(q.toLowerCase())).filter((r) => stage === "all" || r.stage === stage);
  const create = () => {
    if (!question.trim()) { toast.error("Enter a research question"); return; }
    const id = wid("res");
    update((x) => ({ ...x, research: [{ id, question: question.trim(), scope: scope.trim(), priority, stage: "Sources", sources: [], findings: [], synthesis: "", comments: [], createdAt: new Date().toISOString() }, ...x.research] }), { scope: `research:${id}`, text: `Research request created: ${question.trim()}` });
    setOpen(false); setQuestion(""); setScope("");
    void navigate({ to: "/ai-ceo/research/$researchId", params: { researchId: id } });
  };
  const starters = ["Why is revenue volatility increasing?", "Which compliance items need attention this month?", "What is driving SLA breaches?"];
  return (
    <PageShell>
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Microscope className="h-3.5 w-3.5" /> Founder AI · Intelligence</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Research Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">Turn operational questions into evidence, findings and decisions.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />New research</Button>
      </section>
      <PreviewNotice>{NOTE}</PreviewNotice>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{STAGES.map((st) => <div key={st} className="bento-card p-3"><p className="text-lg font-semibold tabular-nums">{s.research.filter((r) => r.stage === st).length}</p><p className="text-[11px] text-muted-foreground">{st}</p></div>)}</div>
      <div className="flex flex-wrap gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3"><Search className="h-3.5 w-3.5 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search research..." aria-label="Search research" className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0" /></div>
        <Select value={stage} onValueChange={setStage}><SelectTrigger className="h-9 w-[150px]" aria-label="Stage"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All stages</SelectItem>{STAGES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
      </div>
      {list.length === 0 ? (
        <div className="bento-card space-y-3 p-6 text-center text-sm text-muted-foreground"><p>No research requests yet. Start with a question:</p>
          <div className="flex flex-wrap justify-center gap-2">{starters.map((x) => <Button key={x} size="sm" variant="outline" onClick={() => { setQuestion(x); setOpen(true); }}>{x}</Button>)}</div></div>
      ) : (
        <ul className="bento-card divide-y divide-border">{list.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
            <div><Link to="/ai-ceo/research/$researchId" params={{ researchId: r.id }} className="font-medium hover:underline">{r.question}</Link><p className="text-[11px] text-muted-foreground">{r.sources.length} sources · {r.findings.length} findings · {new Date(r.createdAt).toLocaleDateString()}</p></div>
            <div className="flex gap-2"><SeverityBadge level={r.priority} /><Pill value={r.stage} /></div>
          </li>))}</ul>)}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New research request</DialogTitle><DialogDescription>Describe the operational question you want answered.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label htmlFor="rq">Question</Label><Textarea id="rq" value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} /></div>
            <div><Label htmlFor="rs">Scope / context (optional)</Label><Input id="rs" value={scope} onChange={(e) => setScope(e.target.value)} placeholder="e.g. Last 30 days, finance team" /></div>
            <div><Label>Priority</Label><Select value={priority} onValueChange={(v) => setPriority(v as Research["priority"])}><SelectTrigger aria-label="Priority"><SelectValue /></SelectTrigger><SelectContent>{(["LOW", "MEDIUM", "HIGH"] as const).map((p) => <SelectItem key={p} value={p}>{p.toLowerCase()}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

export function ResearchWorkspace({ id }: { id: string }) {
  const [s, update] = useWork();
  const { data } = useCEOData();
  const r = s.research.find((x) => x.id === id);
  const [src, setSrc] = useState({ title: "", detail: "", href: "" });
  const [finding, setFinding] = useState(""); const [fSources, setFSources] = useState<string[]>([]); const [conf, setConf] = useState<Finding["confidence"]>("Medium");
  const [task, setTask] = useState(false);
  if (!r) return <PageShell><Unavailable>This research isn't in this browser session.</Unavailable><Link to="/ai-ceo/research" className="text-sm text-primary-glow">Back to Research</Link></PageShell>;
  const patch = (p: Partial<Research>, text?: string) => update((x) => ({ ...x, research: x.research.map((y) => y.id === r.id ? { ...y, ...p } : y) }), text ? { scope: `research:${r.id}`, text } : undefined);
  const suggested = answer(`${r.question} ${r.scope}`, data).citations.filter((c) => !r.sources.some((x) => x.id === c.id));
  const addSource = (so: Source) => patch({ sources: [...r.sources, so] }, `Source added: ${so.title}`);
  const idx = STAGES.indexOf(r.stage);

  return (
    <PageShell>
      <Link to="/ai-ceo/research" className="text-xs text-muted-foreground hover:text-foreground">← Research Center</Link>
      <section><h1 className="text-2xl font-semibold tracking-tight">{r.question}</h1><p className="mt-1 text-xs text-muted-foreground">{r.scope || "No scope set"} · <SeverityBadge level={r.priority} /></p></section>
      <PreviewNotice>{NOTE}</PreviewNotice>
      <ol className="flex flex-wrap gap-2" aria-label="Research progress">{STAGES.map((st, i) => (
        <li key={st}><button onClick={() => patch({ stage: st }, `Moved to ${st}`)} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs" aria-current={st === r.stage ? "step" : undefined}>
          {i < idx ? <CheckCircle2 className="h-3.5 w-3.5 text-accent-emerald" /> : <Circle className={`h-3.5 w-3.5 ${i === idx ? "text-primary-glow" : "text-muted-foreground"}`} />}{st}</button></li>))}</ol>

      <Tabs defaultValue={r.stage === "Findings" ? "findings" : r.stage === "Synthesis" ? "synthesis" : r.stage === "Decision" ? "handoff" : "sources"}>
        <TabsList className="flex h-auto flex-wrap"><TabsTrigger value="sources">Sources & evidence ({r.sources.length})</TabsTrigger><TabsTrigger value="findings">Findings ({r.findings.length})</TabsTrigger><TabsTrigger value="synthesis">Synthesis</TabsTrigger><TabsTrigger value="handoff">Decision handoff</TabsTrigger><TabsTrigger value="discussion">Discussion</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger></TabsList>
        <TabsContent value="sources" className="grid gap-3 lg:grid-cols-2">
          <DetailSection title="Collected sources">{r.sources.length === 0 ? <Unavailable>No sources yet.</Unavailable> : <ul className="space-y-2">{r.sources.map((so) => (
            <li key={so.id} className="rounded-lg border border-border p-2 text-xs"><div className="flex justify-between"><span className="font-medium text-foreground">{so.title}</span><span className="text-[10px]">{so.kind}</span></div><p>{so.detail}</p>
              {so.href && (so.kind === "External link" ? <a href={so.href} target="_blank" rel="noreferrer" className="text-primary-glow">Open link</a> : <a href={so.href} className="text-primary-glow">Open record</a>)}
              <button className="ml-2 text-muted-foreground" onClick={() => patch({ sources: r.sources.filter((x) => x.id !== so.id) })}>Remove</button></li>))}</ul>}</DetailSection>
          <div className="space-y-3">
            <DetailSection title="Suggested from your operational records">{suggested.length === 0 ? <Unavailable>No more matching records.</Unavailable> : <ul className="space-y-2">{suggested.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-2 text-xs"><span><span className="text-foreground">{c.type}: {c.title}</span><br />{c.detail}</span><Button size="sm" variant="outline" onClick={() => addSource({ id: c.id, kind: "Operational record", title: `${c.type}: ${c.title}`, detail: c.detail, href: c.href })}>Add</Button></li>))}</ul>}</DetailSection>
            <DetailSection title="Add a source">
              <div className="space-y-2"><Input value={src.title} onChange={(e) => setSrc({ ...src, title: e.target.value })} placeholder="Title" aria-label="Source title" /><Input value={src.href} onChange={(e) => setSrc({ ...src, href: e.target.value })} placeholder="Link (optional)" aria-label="Source link" /><Textarea value={src.detail} onChange={(e) => setSrc({ ...src, detail: e.target.value })} placeholder="What does it say?" rows={2} aria-label="Source summary" />
                <div className="flex gap-2"><Button size="sm" disabled={!src.title.trim()} onClick={() => { addSource({ id: wid("src"), kind: src.href ? "External link" : "Note", title: src.title.trim(), detail: src.detail.trim(), ...(src.href ? { href: src.href } : {}) }); setSrc({ title: "", detail: "", href: "" }); }}>Add source</Button>
                  <label className="inline-flex cursor-pointer items-center rounded-md border border-border px-3 text-xs">Attach file<input type="file" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) addSource({ id: wid("src"), kind: "File", title: f.name, detail: `${Math.ceil(f.size / 1024)} KB · attached, not read (file processing not connected)` }); }} /></label></div></div>
            </DetailSection>
          </div>
        </TabsContent>
        <TabsContent value="findings" className="grid gap-3 lg:grid-cols-2">
          <DetailSection title="Findings">{r.findings.length === 0 ? <Unavailable>Record findings backed by your sources.</Unavailable> : <ul className="space-y-2">{r.findings.map((f) => (
            <li key={f.id} className="rounded-lg border border-border p-2 text-xs"><p className="text-foreground">{f.text}</p><p className="mt-1 text-[10px]">Confidence: {f.confidence} · Evidence: {f.sourceIds.map((sid) => r.sources.find((x) => x.id === sid)?.title).filter(Boolean).join("; ") || <span className="text-accent-amber">no source linked</span>}</p></li>))}</ul>}</DetailSection>
          <DetailSection title="Add finding">
            <Textarea value={finding} onChange={(e) => setFinding(e.target.value)} rows={3} aria-label="Finding" />
            <p className="mt-2 text-[11px]">Supporting sources</p>
            <ul className="max-h-32 space-y-1 overflow-auto">{r.sources.map((so) => <li key={so.id}><label className="flex gap-2 text-xs"><input type="checkbox" checked={fSources.includes(so.id)} onChange={(e) => setFSources(e.target.checked ? [...fSources, so.id] : fSources.filter((x) => x !== so.id))} />{so.title}</label></li>)}</ul>
            <div className="mt-2 flex gap-2"><Select value={conf} onValueChange={(v) => setConf(v as Finding["confidence"])}><SelectTrigger className="w-[130px]" aria-label="Confidence"><SelectValue /></SelectTrigger><SelectContent>{["Low", "Medium", "High"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              <Button disabled={!finding.trim()} onClick={() => { patch({ findings: [...r.findings, { id: wid("f"), text: finding.trim(), sourceIds: fSources, confidence: conf }] }, "Finding recorded"); setFinding(""); setFSources([]); }}>Add</Button></div>
          </DetailSection>
        </TabsContent>
        <TabsContent value="synthesis">
          <DetailSection title="Synthesis">
            <p className="mb-2 text-[11px]">Write the overall conclusion. Founder AI does not write it for you in this preview.</p>
            <Textarea value={r.synthesis} onChange={(e) => patch({ synthesis: e.target.value })} rows={6} aria-label="Synthesis" placeholder={r.findings.map((f) => `• ${f.text}`).join("\n") || "Summarize what the findings mean."} />
            {r.findings.length > 0 && !r.synthesis && <Button size="sm" variant="outline" className="mt-2" onClick={() => patch({ synthesis: r.findings.map((f) => `• ${f.text} (${f.confidence} confidence)`).join("\n") }, "Synthesis drafted from findings")}>Start from findings</Button>}
          </DetailSection>
        </TabsContent>
        <TabsContent value="handoff" className="grid gap-3 md:grid-cols-2">
          <DetailSection title="Hand off to a decision">
            <Textarea value={r.handoff ?? ""} onChange={(e) => patch({ handoff: e.target.value })} rows={3} placeholder="Recommended decision" aria-label="Recommended decision" />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" disabled={!r.handoff?.trim()} onClick={() => { patch({ stage: "Decision" }, `Decision proposed: ${r.handoff}`); toast.success("Decision proposal recorded (preview)"); }}>Propose decision</Button>
              <Button size="sm" variant="outline" onClick={() => setTask(true)}>Create task</Button>
              <Button asChild size="sm" variant="ghost"><Link to="/ai-ceo/decision-engine">Open Decision Engine</Link></Button>
            </div>
          </DetailSection>
          <DetailSection title="Link to project">{s.projects.length === 0 ? <Unavailable>No projects yet. <Link to="/ai-ceo/projects" className="text-primary-glow">Create one</Link></Unavailable> : (
            <Select value={r.projectId ?? ""} onValueChange={(pid) => { patch({ projectId: pid }, "Linked to project"); update((x) => ({ ...x, projects: x.projects.map((p) => p.id === pid && !p.researchIds.includes(r.id) ? { ...p, researchIds: [...p.researchIds, r.id] } : p) })); }}>
              <SelectTrigger aria-label="Project"><SelectValue placeholder="Choose project" /></SelectTrigger><SelectContent>{s.projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>)}
            {r.projectId && <Link to="/ai-ceo/projects/$projectId" params={{ projectId: r.projectId }} className="mt-2 inline-block text-xs text-primary-glow">Open project</Link>}
          </DetailSection>
        </TabsContent>
        <TabsContent value="discussion"><DetailSection title="Discussion"><Comments comments={r.comments} onAdd={(c) => patch({ comments: [...r.comments, c] }, "Comment added")} /></DetailSection></TabsContent>
        <TabsContent value="activity"><DetailSection title="Activity">{s.events.filter((e) => e.scope === `research:${r.id}`).map((e) => <p key={e.id} className="text-xs">{new Date(e.at).toLocaleString()} · {e.text}</p>)}</DetailSection></TabsContent>
      </Tabs>
      {task && <AssignTaskDialog open onOpenChange={setTask} preset={{ title: r.handoff?.trim() || `Follow up: ${r.question}`, description: r.synthesis, source: "Research" }} />}
    </PageShell>
  );
}
