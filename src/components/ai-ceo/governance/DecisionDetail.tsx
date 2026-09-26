import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, MessageSquare, Microscope, ListTodo, UserCheck, Check, X } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { useCEOData } from "@/hooks/useCEOData";
import { dataSourceStatus } from "@/components/ai-ceo/DataSourceStatus";
import { AuditTimeline, BackLink, DetailSection, EvidencePanel, SeverityBadge, StatusBadge, Unavailable, decisionView } from "./shared";
import { GovernanceDialogs, type GovernanceAction } from "./GovernanceDialogs";
import { APPROVAL_KEY, useSessionMap, type ApprovalOutcome } from "./state";

export function DecisionDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const { data, isPersisted, isLoading } = useCEOData();
  const [outcomes] = useSessionMap<ApprovalOutcome>(APPROVAL_KEY);
  const [action, setAction] = useState<GovernanceAction>(null);
  const [expanded, setExpanded] = useState(false);
  const d = data.decisions.find((x) => x.id === id);

  if (!d) {
    return (
      <PageShell>
        <BackLink to="/ai-ceo/decision-engine" label="Decision Engine" />
        <div className="bento-card p-10 text-center text-sm text-muted-foreground">{isLoading ? "Loading decision…" : "This decision isn't available."}</div>
      </PageShell>
    );
  }
  const o = outcomes[d.id];
  const v = decisionView(d, o?.outcome === "APPROVED" ? "APPROVED" : o?.outcome === "REJECTED" ? "REJECTED" : undefined);
  const decided = v.status === "APPROVED" || v.status === "REJECTED";
  const source = dataSourceStatus(isPersisted, "decision record");
  const toTask = () => { toast.info("Task ready to create", { description: "Tasks save once the task source is connected." }); void navigate({ to: "/ai-ceo/tasks" }); };
  const related = data.riskCategories.filter((r) => r.level === "high" || r.level === "critical").slice(0, 2);

  return (
    <PageShell>
      <BackLink to="/ai-ceo/decision-engine" label="Decision Engine" />
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2"><SeverityBadge level={v.priority} /><StatusBadge status={v.status} /><span className="text-xs text-muted-foreground">{d.type} · Owner {d.requestedBy}</span></div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{d.action}</h1>
        <div className="flex flex-wrap gap-2">
          {v.needsApproval && !decided && <>
            <Button size="sm" onClick={() => setAction({ kind: "approve", item: d })}><Check className="h-4 w-4" /> Approve</Button>
            <Button size="sm" variant="outline" onClick={() => setAction({ kind: "reject", item: d })}><X className="h-4 w-4" /> Reject</Button>
            <Button size="sm" variant="outline" onClick={() => setAction({ kind: "delegate", item: d })}><UserCheck className="h-4 w-4" /> Delegate</Button>
          </>}
          <Button size="sm" variant="ghost" asChild><Link to="/ai-ceo/chat" search={{ context: `Decision: ${d.action}` }}><MessageSquare className="h-4 w-4" /> Ask Founder AI</Link></Button>
          <Button size="sm" variant="ghost" onClick={toTask}><ListTodo className="h-4 w-4" /> Create Task</Button>
        </div>
        {o && <p className="text-xs text-muted-foreground">{o.outcome.toLowerCase()} this session · {o.at}{o.note ? ` · ${o.note}` : ""}</p>}
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <DetailSection title="Problem">
            <dl className="space-y-2">
              <div><dt className="text-xs uppercase tracking-wider">What decision is required?</dt><dd className="text-foreground">{d.action}</dd></div>
              <div><dt className="text-xs uppercase tracking-wider">Why does it matter?</dt><dd className={expanded ? "" : "line-clamp-2"}>{d.reasoning}</dd></div>
            </dl>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setExpanded((e) => !e)}>{expanded ? "Collapse" : "Expand"}</Button>
              <Button size="sm" variant="ghost" onClick={() => { void navigator.clipboard?.writeText(`${d.action}\n${d.reasoning}`); toast.success("Copied"); }}><Copy className="h-4 w-4" /> Copy</Button>
            </div>
          </DetailSection>

          <DetailSection title="AI Recommendation">
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
              <p className="text-xs uppercase tracking-wider text-primary-glow">Recommended: {d.aiDecision}</p>
              <p className="mt-1 text-foreground">{d.reasoning}</p>
              <p className="mt-2 text-xs">Confidence: <b className="text-foreground">{v.confidenceBand}</b> ({d.confidence}%) · Evidence strength based on historical outcomes · Data freshness: {isPersisted ? "live" : "seed"}</p>
              <p className="mt-1 text-xs">Known limitations: confidence is an estimate, not a certainty. You remain the decision maker.</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {v.needsApproval && !decided && <Button size="sm" variant="secondary" onClick={() => setAction({ kind: "approve", item: d })}>Accept Recommendation</Button>}
              <Button size="sm" variant="ghost" onClick={toTask}>Create Task</Button>
              <Button size="sm" variant="ghost" asChild><Link to="/ai-ceo/research"><Microscope className="h-4 w-4" /> Request Research</Link></Button>
            </div>
          </DetailSection>

          <DetailSection title="Options">
            <ul className="grid gap-2 sm:grid-cols-2">
              {(["approve", "delay", "reject", "escalate"] as const).map((opt) => (
                <li key={opt} className={`rounded-lg border p-3 ${opt === d.aiDecision ? "border-primary/50 bg-primary/5" : "border-border"}`}>
                  <p className="font-medium capitalize text-foreground">{opt}{opt === d.aiDecision && <span className="ml-2 text-[10px] text-primary-glow">AI recommended</span>}</p>
                  <p className="text-xs">Impact, cost and trade-offs appear once the decision model is connected.</p>
                </li>
              ))}
            </ul>
          </DetailSection>

          <DetailSection title="Evidence">
            <EvidencePanel items={[{ source, title: "Historical outcome", summary: d.historicalOutcome, freshness: isPersisted ? "Live" : "Seed snapshot" }]} />
          </DetailSection>

          <div className="grid gap-4 md:grid-cols-2">
            <DetailSection title="Risk analysis"><div className="flex items-center gap-2"><SeverityBadge level={v.priority} /><span>Priority derived from the AI recommendation.</span></div><p className="mt-2 text-xs">Probability, mitigation and unknowns appear when risk modelling is connected.</p></DetailSection>
            <DetailSection title="Expected impact"><Unavailable>Impact estimate unavailable.</Unavailable></DetailSection>
          </div>

          <DetailSection title="Approval">
            {v.needsApproval ? (
              <div className="space-y-1">
                <p className="font-medium text-foreground">Approval Required</p>
                <p>Reason: AI recommends “{d.aiDecision}” — Founder confirmation needed.</p>
                <p>Approver: Founder</p>
                {!decided && <Button size="sm" className="mt-2" asChild><Link to="/ai-ceo/approvals/$id" params={{ id: d.id }}>Review Approval</Link></Button>}
              </div>
            ) : <p>No approval required.</p>}
          </DetailSection>

          <DetailSection title="Execution & verification"><Unavailable>Execution and verification status will appear when orchestration is connected.</Unavailable></DetailSection>

          <DetailSection title="Audit trail">
            <AuditTimeline entries={[
              { actor: "Founder AI", kind: "AI", action: `Recommended “${d.aiDecision}” at ${d.confidence}% confidence`, at: "On record" },
              ...(o ? [{ actor: "Founder", kind: "Founder" as const, action: `${o.outcome.toLowerCase()}${o.note ? ` — ${o.note}` : ""}`, at: o.at }] : []),
            ]} />
          </DetailSection>
        </div>

        <aside className="space-y-4" aria-label="Related context">
          <DetailSection title="Context">
            <ul className="space-y-2">
              <li>Requested by <b className="text-foreground">{d.requestedBy}</b></li>
              <li>Area <b className="text-foreground">{d.type}</b></li>
              {related.map((r) => <li key={r.id}><Link className="text-primary-glow hover:underline" to="/ai-ceo/risk/$id" params={{ id: r.id }}>Related risk: {r.category}</Link></li>)}
              <li><Link className="text-primary-glow hover:underline" to="/ai-ceo/performance">Related KPIs</Link></li>
              <li><Link className="text-primary-glow hover:underline" to="/ai-ceo/reports">Related reports</Link></li>
            </ul>
          </DetailSection>
        </aside>
      </div>
      <GovernanceDialogs action={action} onClose={() => setAction(null)} />
    </PageShell>
  );
}
