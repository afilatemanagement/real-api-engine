import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckSquare, Search } from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardSkeleton } from "@/components/feedback/Skeletons";
import { useCEOData } from "@/hooks/useCEOData";
import { dataSourceStatus } from "@/components/ai-ceo/DataSourceStatus";
import type { DecisionItem } from "@/lib/ceo-types";
import { SeverityBadge, StatusBadge, decisionView } from "./shared";
import { GovernanceDialogs, type GovernanceAction } from "./GovernanceDialogs";
import { APPROVAL_KEY, useSessionMap, type ApprovalOutcome } from "./state";

export function ApprovalQueue() {
  const navigate = useNavigate();
  const { data, isPersisted, isLoading } = useCEOData();
  const [outcomes] = useSessionMap<ApprovalOutcome>(APPROVAL_KEY);
  const [action, setAction] = useState<GovernanceAction>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("risk");

  const requests = data.decisions
    .filter((d) => decisionView(d).needsApproval)
    .filter((d) => !q || `${d.action} ${d.requestedBy} ${d.reasoning}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => sort === "confidence" ? a.confidence - b.confidence : (decisionView(a).priority === "CRITICAL" ? -1 : 1) - (decisionView(b).priority === "CRITICAL" ? -1 : 1));
  const open = requests.filter((d) => !outcomes[d.id]);
  const groups: { label: string; items: DecisionItem[] }[] = [
    { label: "Urgent", items: open.filter((d) => decisionView(d).priority === "CRITICAL") },
    { label: "High Risk", items: open.filter((d) => decisionView(d).priority !== "CRITICAL" && d.confidence < 70) },
    { label: "Standard", items: open.filter((d) => decisionView(d).priority !== "CRITICAL" && d.confidence >= 70) },
  ];
  const reviewed = requests.filter((d) => outcomes[d.id]);

  const Card = ({ d }: { d: DecisionItem }) => {
    const v = decisionView(d);
    const o = outcomes[d.id];
    return (
      <article className="bento-card flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2"><SeverityBadge level={v.priority} />{o ? <StatusBadge status={o.outcome} /> : <StatusBadge status="AWAITING_APPROVAL" />}</div>
        <div>
          <Link to="/ai-ceo/approvals/$id" params={{ id: d.id }} className="font-medium hover:text-primary-glow focus-visible:outline-none focus-visible:underline">{d.action}</Link>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.reasoning}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <div><dt>Requested by</dt><dd className="text-foreground">{d.requestedBy}</dd></div>
          <div><dt>Approver</dt><dd className="text-foreground">Founder</dd></div>
          <div><dt>Confidence</dt><dd className="text-foreground">{d.confidence}%</dd></div>
          <div><dt>Expiration</dt><dd className="text-foreground">Not set</dd></div>
        </dl>
        <div className="mt-auto flex flex-wrap gap-2">
          {!o && <>
            <Button size="sm" onClick={() => setAction({ kind: "approve", item: d })}>Approve</Button>
            <Button size="sm" variant="outline" onClick={() => setAction({ kind: "reject", item: d })}>Reject</Button>
          </>}
          <Button size="sm" variant="ghost" asChild><Link to="/ai-ceo/approvals/$id" params={{ id: d.id }}>Review</Link></Button>
          {!o && <Button size="sm" variant="ghost" onClick={() => setAction({ kind: "delegate", item: d })}>Delegate</Button>}
          <Button size="sm" variant="ghost" onClick={() => { void navigate({ to: "/ai-ceo" }); setTimeout(() => document.getElementById("decision-brief")?.scrollIntoView({ behavior: "smooth" }), 400); }}>Ask AI</Button>
        </div>
      </article>
    );
  };

  return (
    <PageShell>
      <section>
        <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><CheckSquare className="h-3.5 w-3.5" /> Founder AI · Approve</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Approval Suggestions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Actions requiring Founder or authorized approval.</p>
        <p className="mt-2 text-[11px] text-muted-foreground">{dataSourceStatus(isPersisted, "approval requests")}</p>
      </section>
      <div className="flex flex-wrap gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search approvals..." aria-label="Search approvals" className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0" />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="h-9 w-[170px]" aria-label="Sort approvals"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="risk">Sort: urgency</SelectItem><SelectItem value="confidence">Sort: lowest confidence</SelectItem></SelectContent>
        </Select>
      </div>
      {isLoading ? <div className="grid gap-3 md:grid-cols-2"><CardSkeleton /><CardSkeleton /></div> : requests.length === 0 ? (
        <div className="bento-card p-10 text-center text-sm text-muted-foreground">No approval requests.</div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => g.items.length > 0 && (
            <section key={g.label} aria-label={g.label}>
              <h2 className="mb-2 text-sm font-semibold">{g.label} <span className="text-muted-foreground">· {g.items.length}</span></h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{g.items.map((d) => <Card key={d.id} d={d} />)}</div>
            </section>
          ))}
          {reviewed.length > 0 && (
            <section aria-label="Recently reviewed">
              <h2 className="mb-2 text-sm font-semibold">Recently Reviewed <span className="text-muted-foreground">· {reviewed.length}</span></h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{reviewed.map((d) => <Card key={d.id} d={d} />)}</div>
            </section>
          )}
        </div>
      )}
      <GovernanceDialogs action={action} onClose={() => setAction(null)} />
    </PageShell>
  );
}
