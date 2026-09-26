import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { useCEOData } from "@/hooks/useCEOData";
import { dataSourceStatus } from "@/components/ai-ceo/DataSourceStatus";
import { AuditTimeline, BackLink, DetailSection, EvidencePanel, SeverityBadge, StatusBadge, Unavailable, decisionView } from "./shared";
import { GovernanceDialogs, type GovernanceAction } from "./GovernanceDialogs";
import { APPROVAL_KEY, useSessionMap, type ApprovalOutcome } from "./state";

const STEPS = ["Requested", "Reviewed", "Approved/Rejected", "Executed", "Verified"];

export function ApprovalDetail({ id }: { id: string }) {
  const { data, isPersisted, isLoading } = useCEOData();
  const [outcomes] = useSessionMap<ApprovalOutcome>(APPROVAL_KEY);
  const [action, setAction] = useState<GovernanceAction>(null);
  const d = data.decisions.find((x) => x.id === id);
  if (!d) return <PageShell><BackLink to="/ai-ceo/approvals" label="Approval Suggestions" /><div className="bento-card p-10 text-center text-sm text-muted-foreground">{isLoading ? "Loading request…" : "This approval request isn't available."}</div></PageShell>;
  const v = decisionView(d);
  const o = outcomes[d.id];
  const reached = o ? (o.outcome === "DELEGATED" ? 1 : 2) : 0;

  return (
    <PageShell>
      <BackLink to="/ai-ceo/approvals" label="Approval Suggestions" />
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2"><SeverityBadge level={v.priority} /><StatusBadge status={o?.outcome ?? "AWAITING_APPROVAL"} /></div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{d.action}</h1>
        {!o && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setAction({ kind: "approve", item: d })}>Approve</Button>
            <Button size="sm" variant="outline" onClick={() => setAction({ kind: "reject", item: d })}>Reject</Button>
            <Button size="sm" variant="ghost" onClick={() => setAction({ kind: "delegate", item: d })}>Delegate</Button>
          </div>
        )}
      </header>

      <ol className="bento-card flex flex-wrap gap-2 p-4" aria-label="Approval timeline">
        {STEPS.map((s, i) => (
          <li key={s} className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${i <= reached ? "border-primary/50 text-foreground" : "border-border text-muted-foreground"}`}>
            <span aria-hidden>{i <= reached ? "●" : "○"}</span>{s}
          </li>
        ))}
      </ol>

      <div className="grid gap-4 md:grid-cols-2">
        <DetailSection title="Request"><p>Requested by <b className="text-foreground">{d.requestedBy}</b> · {d.type}</p></DetailSection>
        <DetailSection title="Reason"><p>{d.reasoning}</p></DetailSection>
        <DetailSection title="Evidence"><EvidencePanel items={[{ source: dataSourceStatus(isPersisted, "decision record"), title: "Historical outcome", summary: d.historicalOutcome, freshness: isPersisted ? "Live" : "Seed snapshot" }]} /></DetailSection>
        <DetailSection title="Impact & risk"><div className="flex items-center gap-2"><SeverityBadge level={v.priority} /> Confidence {d.confidence}%</div><p className="mt-2 text-xs">Impact estimate unavailable.</p></DetailSection>
        <DetailSection title="Policy"><Unavailable>Approval policy details appear when governance policies are connected.</Unavailable></DetailSection>
        <DetailSection title="Decision"><Link className="text-primary-glow hover:underline" to="/ai-ceo/decision-engine/$id" params={{ id: d.id }}>Open related decision →</Link></DetailSection>
        <DetailSection title="Execution & verification"><Unavailable>Execution state appears when orchestration is connected.</Unavailable></DetailSection>
        <DetailSection title="Audit">
          <AuditTimeline entries={[
            { actor: d.requestedBy, kind: "System", action: "Approval requested", at: "On record" },
            ...(o ? [{ actor: "Founder", kind: "Founder" as const, action: `${o.outcome.toLowerCase()}${o.note ? ` — ${o.note}` : ""}`, at: o.at }] : []),
          ]} />
        </DetailSection>
      </div>
      <GovernanceDialogs action={action} onClose={() => setAction(null)} />
    </PageShell>
  );
}
