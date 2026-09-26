import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Library, Lock, Plus, Search, Star, X } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CardSkeleton } from "@/components/feedback/Skeletons";
import { useCEOData } from "@/hooks/useCEOData";
import { dataSourceStatus } from "@/components/ai-ceo/DataSourceStatus";
import { useSessionMap } from "@/components/ai-ceo/governance/state";
import { CATEGORY_TREE, FAVORITES_KEY, FreshnessBadge, LOCAL_KNOWLEDGE_KEY, buildKnowledge, type KnowledgeGroup, type KnowledgeItem } from "./model";

export function CompanyBrain() {
  const { data, isPersisted, isLoading } = useCEOData();
  const [local, addLocal] = useSessionMap<KnowledgeItem>(LOCAL_KNOWLEDGE_KEY);
  const [fav, setFav] = useSessionMap<boolean>(FAVORITES_KEY);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<KnowledgeGroup | "all">("all");
  const [onlyFav, setOnlyFav] = useState(false);
  const [adding, setAdding] = useState(false);
  const items = buildKnowledge(data, Object.values(local));
  const shown = items
    .filter((i) => group === "all" || i.group === group)
    .filter((i) => !onlyFav || fav[i.id])
    .filter((i) => !q || `${i.title} ${i.summary} ${i.type} ${i.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  const count = (f: (i: KnowledgeItem) => boolean) => items.filter(f).length;
  const cards = [
    { label: "Total Knowledge", n: items.length },
    { label: "Policies", n: count((i) => i.type === "Policy") },
    { label: "Decisions", n: count((i) => i.type === "Past Decision") },
    { label: "Lessons Learned", n: count((i) => i.type === "Lesson Learned") },
    { label: "Needs Review", n: count((i) => i.freshness !== "Fresh") },
    { label: "SOPs", n: null },
  ];

  return (
    <PageShell>
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Library className="h-3.5 w-3.5" /> Founder AI · Operating memory</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Company Brain</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Your operational memory — the context Founder AI uses to understand the company.</p>
          <p className="mt-2 text-[11px] text-muted-foreground">{dataSourceStatus(isPersisted, "knowledge")} · Built from policies, decisions, risks, reports and lessons already on record.</p>
        </div>
        <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add Knowledge</Button>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="bento-card p-4"><p className="text-xl font-semibold tabular-nums">{isLoading ? "—" : c.n ?? "—"}</p><p className="text-xs text-muted-foreground">{c.label}{c.n === null && " · awaiting data"}</p></div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label="Knowledge categories" className="bento-card h-fit p-3">
          <button onClick={() => setGroup("all")} className={`w-full rounded-lg px-2.5 py-1.5 text-left text-sm ${group === "all" ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>All knowledge</button>
          {(Object.keys(CATEGORY_TREE) as KnowledgeGroup[]).map((g) => (
            <div key={g}>
              <button onClick={() => setGroup(g)} aria-pressed={group === g} className={`mt-1 flex w-full justify-between rounded-lg px-2.5 py-1.5 text-left text-sm ${group === g ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {g}<span className="text-xs">{count((i) => i.group === g)}</span>
              </button>
              {group === g && <p className="px-2.5 pb-1 text-[11px] text-muted-foreground">{CATEGORY_TREE[g].join(" · ")}</p>}
            </div>
          ))}
        </nav>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Company Brain..." aria-label="Search Company Brain" className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0" />
              {q && <button onClick={() => setQ("")} aria-label="Clear search"><X className="h-3.5 w-3.5" /></button>}
            </div>
            <Button size="sm" variant={onlyFav ? "default" : "outline"} onClick={() => setOnlyFav((f) => !f)} aria-pressed={onlyFav}><Star className="h-4 w-4" /> Favorites</Button>
          </div>
          {isLoading ? <CardSkeleton /> : shown.length === 0 ? (
            <div className="bento-card p-10 text-center text-sm text-muted-foreground">{q ? `No knowledge matches “${q}”.` : "No knowledge in this category yet. Use Add Knowledge to capture it."}</div>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {shown.map((i) => (
                <li key={i.id} className="bento-card flex flex-col gap-2 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="rounded-md border border-border px-1.5 py-0.5">{i.type}</span><FreshnessBadge value={i.freshness} />
                    {i.local && <span className="text-accent-pink">Draft · this session</span>}
                    {i.access !== "Leadership" && <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" />{i.access}</span>}
                  </div>
                  <Link to="/ai-ceo/company-brain/$id" params={{ id: i.id }} className="font-medium hover:text-primary-glow focus-visible:outline-none focus-visible:underline">{i.title}</Link>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{i.summary}</p>
                  <p className="text-[11px] text-muted-foreground">{i.group} · {i.owner} · updated {i.updated} · {i.source}</p>
                  <div className="mt-auto flex gap-2">
                    <Button size="sm" variant="secondary" asChild><Link to="/ai-ceo/company-brain/$id" params={{ id: i.id }}>Open</Link></Button>
                    <Button size="sm" variant="ghost" onClick={() => setQ(i.tags[0] ?? i.type)}>Search Related</Button>
                    <Button size="sm" variant="ghost" aria-pressed={!!fav[i.id]} aria-label={fav[i.id] ? "Remove favorite" : "Add favorite"} onClick={() => setFav(i.id, !fav[i.id])}><Star className={`h-4 w-4 ${fav[i.id] ? "fill-current text-accent-amber" : ""}`} /></Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <AddKnowledgeDialog open={adding} onOpenChange={setAdding} onAdd={(item) => addLocal(item.id, item)} />
    </PageShell>
  );
}

function AddKnowledgeDialog({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (o: boolean) => void; onAdd: (i: KnowledgeItem) => void }) {
  const [title, setTitle] = useState("");
  const [group, setGroup] = useState<KnowledgeGroup | "">("");
  const [type, setType] = useState("");
  const [body, setBody] = useState("");
  const [touched, setTouched] = useState(false);
  const valid = title.trim() && group && type && body.trim();
  const save = () => {
    setTouched(true);
    if (!valid) return;
    onAdd({ id: `local-${Date.now()}`, title: title.trim().slice(0, 140), type, group: group as KnowledgeGroup, summary: body.trim().slice(0, 160), body: body.trim().slice(0, 5000), owner: "Founder", updated: "Just now", freshness: "Fresh", source: "Added by Founder", access: "Founder", tags: [type.toLowerCase()], local: true });
    toast.success("Knowledge draft added", { description: "Kept for this session. It will save permanently once Company Brain is connected." });
    setTitle(""); setGroup(""); setType(""); setBody(""); setTouched(false); onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Knowledge</DialogTitle><DialogDescription>Capture a policy, SOP, goal or lesson for Founder AI's context.</DialogDescription></DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5"><Label htmlFor="k-title">Title *</Label><Input id="k-title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Group *</Label>
              <Select value={group} onValueChange={(v) => { setGroup(v as KnowledgeGroup); setType(""); }}><SelectTrigger aria-label="Group"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{Object.keys(CATEGORY_TREE).map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Type *</Label>
              <Select value={type} onValueChange={setType} disabled={!group}><SelectTrigger aria-label="Type"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{(group ? CATEGORY_TREE[group] : []).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="k-body">Content *</Label><Textarea id="k-body" rows={6} value={body} onChange={(e) => setBody(e.target.value)} /></div>
          {touched && !valid && <p className="text-xs text-destructive" role="alert">Fill in the title, group, type and content.</p>}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save}>Add Knowledge</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
