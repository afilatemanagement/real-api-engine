import { Link, useNavigate } from "@tanstack/react-router";
import { Copy, Star } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { useCEOData } from "@/hooks/useCEOData";
import { AuditTimeline, BackLink, DetailSection, EvidencePanel, Unavailable } from "@/components/ai-ceo/governance/shared";
import { useSessionMap } from "@/components/ai-ceo/governance/state";
import { FAVORITES_KEY, FreshnessBadge, LOCAL_KNOWLEDGE_KEY, buildKnowledge, type KnowledgeItem } from "./model";

export function KnowledgeDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const { data, isLoading } = useCEOData();
  const [local] = useSessionMap<KnowledgeItem>(LOCAL_KNOWLEDGE_KEY);
  const [fav, setFav] = useSessionMap<boolean>(FAVORITES_KEY);
  const items = buildKnowledge(data, Object.values(local));
  const k = items.find((i) => i.id === id);
  if (!k) return <PageShell><BackLink to="/ai-ceo/company-brain" label="Company Brain" /><div className="bento-card p-10 text-center text-sm text-muted-foreground">{isLoading ? "Loading knowledge…" : "This knowledge item isn't available."}</div></PageShell>;
  const related = items.filter((i) => i.id !== k.id && (i.group === k.group || i.tags.some((t) => k.tags.includes(t)))).slice(0, 4);

  return (
    <PageShell>
      <BackLink to="/ai-ceo/company-brain" label="Company Brain" />
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="rounded-md border border-border px-1.5 py-0.5">{k.type}</span><FreshnessBadge value={k.freshness} /><span>{k.group} · Owner {k.owner} · updated {k.updated}</span></div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{k.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setFav(k.id, !fav[k.id])} aria-pressed={!!fav[k.id]}><Star className={`h-4 w-4 ${fav[k.id] ? "fill-current text-accent-amber" : ""}`} /> {fav[k.id] ? "Favorited" : "Favorite"}</Button>
          <Button size="sm" variant="ghost" onClick={() => { void navigator.clipboard?.writeText(`${k.title} — ${k.source}`); toast.success("Reference copied"); }}><Copy className="h-4 w-4" /> Copy Reference</Button>
          {k.link && <Button size="sm" variant="ghost" onClick={() => k.link && navigate({ href: k.link.to })}>{k.link.label}</Button>}
        </div>
      </header>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <DetailSection title="Content"><p className="whitespace-pre-line leading-relaxed text-foreground">{k.body}</p></DetailSection>
          <DetailSection title="Sources"><EvidencePanel items={[{ source: k.source, title: k.title, summary: k.summary, freshness: k.freshness }]} /></DetailSection>
          <DetailSection title="History"><AuditTimeline entries={[{ actor: k.owner, kind: k.local ? "Founder" : "System", action: k.local ? "Draft created this session" : `Recorded from ${k.source}`, at: k.updated }]} /></DetailSection>
        </div>
        <aside className="space-y-4">
          <DetailSection title="Metadata">
            <dl className="space-y-1.5 text-xs">
              <div className="flex justify-between"><dt>Source</dt><dd className="text-foreground">{k.source}</dd></div>
              <div className="flex justify-between"><dt>Access scope</dt><dd className="text-foreground">{k.access}</dd></div>
              <div className="flex justify-between"><dt>Tags</dt><dd className="text-foreground">{k.tags.join(", ")}</dd></div>
              <div className="flex justify-between"><dt>Review date</dt><dd className="text-foreground">Not scheduled</dd></div>
            </dl>
          </DetailSection>
          <DetailSection title="Related knowledge">
            {related.length ? <ul className="space-y-1.5">{related.map((r) => <li key={r.id}><Link className="text-primary-glow hover:underline" to="/ai-ceo/company-brain/$id" params={{ id: r.id }}>{r.title}</Link></li>)}</ul> : <Unavailable>No related knowledge yet.</Unavailable>}
          </DetailSection>
          <DetailSection title="Usage"><Unavailable>Where this knowledge is used will appear when connected.</Unavailable></DetailSection>
        </aside>
      </div>
    </PageShell>
  );
}
