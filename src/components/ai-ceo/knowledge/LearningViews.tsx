import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { Input } from "@/components/ui/input";
import { useCEOData } from "@/hooks/useCEOData";
import { dataSourceStatus } from "@/components/ai-ceo/DataSourceStatus";
import { AuditTimeline, BackLink, DetailSection, EvidencePanel } from "@/components/ai-ceo/governance/shared";

/** Searchable index placed above the existing System Learning Log screen. */
export function LearningIndex() {
  const { data } = useCEOData();
  const [q, setQ] = useState("");
  const list = data.learningLogs.filter((l) => !q || `${l.observation} ${l.suggestion} ${l.outcome}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <PageShell>
      <section aria-label="Learning records" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Learning records <span className="text-muted-foreground">· {list.length}</span></h2>
          <div className="flex min-w-[220px] items-center gap-2 rounded-xl border border-border bg-surface px-3">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search learning..." aria-label="Search learning" className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0" />
          </div>
        </div>
        <ul className="grid gap-2 md:grid-cols-2">
          {list.map((l) => (
            <li key={l.id}>
              <Link to="/ai-ceo/learning/$id" params={{ id: l.id }} className="bento-card block p-4 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <p className="font-medium">{l.observation}</p>
                <p className="text-xs text-muted-foreground">Founder {l.bossDecision} · {l.outcome} · {l.timestamp}</p>
              </Link>
            </li>
          ))}
          {list.length === 0 && <li className="bento-card p-6 text-center text-sm text-muted-foreground md:col-span-2">No learning records match.</li>}
        </ul>
      </section>
    </PageShell>
  );
}

export function LearningDetail({ id }: { id: string }) {
  const { data, isPersisted, isLoading } = useCEOData();
  const l = data.learningLogs.find((x) => x.id === id);
  if (!l) return <PageShell><BackLink to="/ai-ceo/learning" label="System Learning Log" /><div className="bento-card p-10 text-center text-sm text-muted-foreground">{isLoading ? "Loading…" : "This learning record isn't available."}</div></PageShell>;
  return (
    <PageShell>
      <BackLink to="/ai-ceo/learning" label="System Learning Log" />
      <header><p className="text-xs text-muted-foreground">{l.timestamp} · {l.learned ? "Incorporated into learning" : "Pending review"}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{l.observation}</h1></header>
      <div className="grid gap-4 md:grid-cols-2">
        <DetailSection title="What Founder AI suggested"><p className="text-foreground">{l.suggestion}</p></DetailSection>
        <DetailSection title="Founder decision"><p className="capitalize text-foreground">{l.bossDecision}</p></DetailSection>
        <DetailSection title="Outcome"><p className="text-foreground">{l.outcome}</p></DetailSection>
        <DetailSection title="What was learned"><p>{l.bossDecision === "overridden" ? "The Founder's override proved correct — similar signals will carry lower weight." : "The suggestion was confirmed — similar signals will carry more weight."}</p></DetailSection>
        <DetailSection title="Evidence"><EvidencePanel items={[{ source: dataSourceStatus(isPersisted, "learning log"), title: "Recorded outcome", summary: l.outcome, freshness: l.timestamp }]} /></DetailSection>
        <DetailSection title="Timeline">
          <AuditTimeline entries={[
            { actor: "Founder AI", kind: "AI", action: `Observed: ${l.observation}`, at: l.timestamp },
            { actor: "Founder AI", kind: "AI", action: `Suggested: ${l.suggestion}`, at: l.timestamp },
            { actor: "Founder", kind: "Founder", action: `Decision: ${l.bossDecision}`, at: l.timestamp },
            { actor: "System", kind: "System", action: `Outcome: ${l.outcome}`, at: l.timestamp },
          ]} />
        </DetailSection>
      </div>
    </PageShell>
  );
}
