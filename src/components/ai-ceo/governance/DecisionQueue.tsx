import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Brain, Plus, RefreshCw, Search, X } from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardSkeleton } from "@/components/feedback/Skeletons";
import { useCEOData } from "@/hooks/useCEOData";
import { dataSourceStatus } from "@/components/ai-ceo/DataSourceStatus";
import { SeverityBadge, StatusBadge, decisionView, type Severity } from "./shared";
import { CreateDecisionDialog } from "./GovernanceDialogs";
import { APPROVAL_KEY, useSessionMap, type ApprovalOutcome } from "./state";

const ORDER: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export function DecisionQueue() {
  const { data, isPersisted, isLoading } = useCEOData();
  const [outcomes] = useSessionMap<ApprovalOutcome>(APPROVAL_KEY);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [approval, setApproval] = useState("all");
  const [sort, setSort] = useState("priority");
  const [creating, setCreating] = useState(false);

  const rows = useMemo(() => data.decisions.map((d) => {
    const o = outcomes[d.id];
    const override = o?.outcome === "APPROVED" ? "APPROVED" : o?.outcome === "REJECTED" ? "REJECTED" : undefined;
    return { d, v: decisionView(d, override) };
  }), [data.decisions, outcomes]);

  const filtered = rows
    .filter(({ d }) => !q || `${d.action} ${d.reasoning} ${d.requestedBy} ${d.type} ${d.historicalOutcome}`.toLowerCase().includes(q.toLowerCase()))
    .filter(({ v }) => status === "all" || v.status === status)
    .filter(({ v }) => priority === "all" || v.priority === priority)
    .filter(({ v }) => approval === "all" || (approval === "yes") === v.needsApproval)
    .sort((a, b) => sort === "confidence" ? b.d.confidence - a.d.confidence : ORDER.indexOf(a.v.priority) - ORDER.indexOf(b.v.priority));
  const hasFilters = q || status !== "all" || priority !== "all" || approval !== "all";
  const clear = () => { setQ(""); setStatus("all"); setPriority("all"); setApproval("all"); };

  return (
    <PageShell>
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Brain className="h-3.5 w-3.5" /> Founder AI · Decide</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Decision Engine</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review, evaluate and control important operational decisions.</p>
          <p className="mt-2 text-[11px] text-muted-foreground">{dataSourceStatus(isPersisted, "decision queue")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}><RefreshCw className="h-4 w-4" /> Refresh</Button>
          <Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Create Decision</Button>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search decisions..." aria-label="Search decisions" className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-[170px]" aria-label="Filter by status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {["RECOMMENDATION_READY", "AWAITING_APPROVAL", "APPROVED", "REJECTED"].map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ").toLowerCase()}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="h-9 w-[140px]" aria-label="Filter by priority"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All priorities</SelectItem>{ORDER.map((p) => <SelectItem key={p} value={p}>{p.toLowerCase()}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={approval} onValueChange={setApproval}>
          <SelectTrigger className="h-9 w-[160px]" aria-label="Filter by approval requirement"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Any approval</SelectItem><SelectItem value="yes">Approval required</SelectItem><SelectItem value="no">No approval</SelectItem></SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="h-9 w-[150px]" aria-label="Sort"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="priority">Sort: priority</SelectItem><SelectItem value="confidence">Sort: confidence</SelectItem></SelectContent>
        </Select>
        {hasFilters && <Button variant="ghost" size="sm" onClick={clear}><X className="h-4 w-4" /> Clear filters</Button>}
      </div>

      {isLoading ? (
        <div className="grid gap-3"><CardSkeleton /><CardSkeleton /></div>
      ) : filtered.length === 0 ? (
        <div className="bento-card p-10 text-center text-sm text-muted-foreground">
          {data.decisions.length === 0 ? "No decisions available yet." : "No decisions match these filters."}
        </div>
      ) : (
        <ul className="space-y-2" aria-label="Decision queue">
          {filtered.map(({ d, v }) => (
            <li key={d.id}>
              <Link to="/ai-ceo/decision-engine/$id" params={{ id: d.id }}
                className="bento-card grid gap-3 p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><SeverityBadge level={v.priority} /><StatusBadge status={v.status} /><span className="text-[11px] text-muted-foreground">{d.type}</span></div>
                  <p className="mt-1.5 font-medium">{d.action}</p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{d.reasoning}</p>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground md:justify-end md:text-right">
                  <span>Owner <b className="text-foreground">{d.requestedBy}</b></span>
                  <span>Confidence <b className="text-foreground">{v.confidenceBand} · {d.confidence}%</b></span>
                  <span>{v.needsApproval ? "Approval required" : "No approval required"}</span>
                  <span>Source · Founder AI</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <CreateDecisionDialog open={creating} onOpenChange={setCreating} />
    </PageShell>
  );
}
