import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BarChart3, Files, Gauge, HelpCircle, KeyRound, MessagesSquare, Radar } from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailSection, SeverityBadge, Unavailable, riskSeverity } from "@/components/ai-ceo/governance/shared";
import { useSessionMap, APPROVAL_KEY, type ApprovalOutcome } from "@/components/ai-ceo/governance/state";
import { useCEOData } from "@/hooks/useCEOData";
import { dataSourceStatus } from "@/components/ai-ceo/DataSourceStatus";
import { useOps } from "@/components/ai-ceo/ops/store";
import { AGENTS, PERMISSIONS } from "@/components/ai-ceo/ops/catalog";
import { AccessPill, Pill } from "@/components/ai-ceo/ops/ui";
import { useWork } from "@/components/ai-ceo/work/store";

function Header({ icon: Icon, section = "System", title, subtitle, note }: { icon: typeof Gauge; section?: string; title: string; subtitle: string; note?: string }) {
  return (
    <section>
      <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> Founder AI · {section}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      {note && <p className="mt-2 text-[11px] text-muted-foreground">{note}</p>}
    </section>
  );
}

interface Metric { name: string; value: string | null; definition: string; period: string; source: string; freshness: string; confidence?: string }
function MetricCard({ m }: { m: Metric }) {
  return (
    <article className="bento-card space-y-1.5 p-4">
      <p className="text-xs font-medium text-muted-foreground">{m.name}</p>
      <p className="text-2xl font-semibold tabular-nums">{m.value ?? "—"}</p>
      {m.value === null && <p className="text-[10px] text-accent-amber">Awaiting data</p>}
      <p className="text-[11px] text-muted-foreground">{m.definition}</p>
      <dl className="grid grid-cols-2 gap-x-2 text-[10px] text-muted-foreground"><dt>Period</dt><dd>{m.period}</dd><dt>Source</dt><dd>{m.source}</dd><dt>Freshness</dt><dd>{m.freshness}</dd>{m.confidence && <><dt>Confidence</dt><dd>{m.confidence}</dd></>}</dl>
    </article>
  );
}

/* ---------------- AI Evaluation ---------------- */
export function EvaluationCenter() {
  const { data, isPersisted } = useCEOData();
  const [approvals] = useSessionMap<ApprovalOutcome>(APPROVAL_KEY);
  const [ops] = useOps();
  const fresh = isPersisted ? "Live" : "Seed dataset";
  const logs = data.learningLogs;
  const accepted = logs.filter((l) => /approv|accept/i.test(l.bossDecision)).length;
  const rejected = logs.filter((l) => /reject|declin/i.test(l.bossDecision)).length;
  const modified = logs.filter((l) => /modif|adjust|partial/i.test(l.bossDecision)).length;
  const avgConf = data.decisions.length ? Math.round(data.decisions.reduce((s, d) => s + d.confidence, 0) / data.decisions.length) : null;
  const outcomes = Object.values(approvals);
  const runs = ops.runs; const ok = runs.filter((r) => r.status === "Completed").length;
  const metrics: Metric[] = [
    { name: "Recommendation Quality", value: `${data.learningStats.accuracyRate}%`, definition: "Share of recommendations whose outcome matched the prediction.", period: "All time", source: "Learning stats", freshness: fresh, confidence: `${data.learningStats.decisionsAnalyzed.toLocaleString()} decisions` },
    { name: "Decision Confidence (avg)", value: avgConf === null ? null : `${avgConf}%`, definition: "Average AI confidence across open decisions.", period: "Current queue", source: "Decision Engine", freshness: fresh },
    { name: "Approval Acceptance Rate", value: logs.length ? `${Math.round((accepted / logs.length) * 100)}%` : null, definition: "Learning records where you accepted the suggestion.", period: "Learning log", source: "Learning log", freshness: fresh },
    { name: "Human Override Rate", value: logs.length ? `${Math.round(((rejected + modified) / logs.length) * 100)}%` : null, definition: "Suggestions you rejected or changed.", period: "Learning log", source: "Learning log", freshness: fresh },
    { name: "Action Success Rate", value: runs.length ? `${Math.round((ok / runs.length) * 100)}%` : null, definition: "Completed runs of all recorded runs.", period: "This session (preview)", source: "Execution activity", freshness: "Session" },
    { name: "Verification Success", value: null, definition: "Runs that passed their verification step.", period: "—", source: "Execution backend", freshness: "Not connected" },
    { name: "False Positive Indicators", value: null, definition: "Alerts later marked not relevant.", period: "—", source: "Feedback backend", freshness: "Not connected" },
    { name: "False Negative Indicators", value: null, definition: "Issues found that AI did not flag.", period: "—", source: "Feedback backend", freshness: "Not connected" },
    { name: "Source / Retrieval Quality", value: null, definition: "Relevance of cited evidence.", period: "—", source: "Knowledge index", freshness: "Not connected" },
    { name: "Tool Success Rate", value: null, definition: "Successful tool calls by agents.", period: "—", source: "Execution backend", freshness: "Not connected" },
    { name: "Agent Reliability", value: null, definition: "Runs without failure per agent.", period: "—", source: "Execution backend", freshness: "Not connected" },
    { name: "Automation Reliability", value: null, definition: "Automation runs completed as configured.", period: "—", source: "Automation backend", freshness: "Not connected" },
  ];
  return (
    <PageShell>
      <Header icon={Gauge} title="AI Evaluation Center" subtitle="Operational AI quality monitoring — how well recommendations and actions perform." note={dataSourceStatus(isPersisted, "evaluation metrics")} />
      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto flex-wrap"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="feedback">Human feedback</TabsTrigger><TabsTrigger value="history">History</TabsTrigger><TabsTrigger value="failures">Failures & exceptions</TabsTrigger></TabsList>
        <TabsContent value="overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((m) => <MetricCard key={m.name} m={m} />)}</TabsContent>
        <TabsContent value="feedback" className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{[["Accepted", accepted + outcomes.filter((o) => o.outcome === "APPROVED").length], ["Rejected", rejected + outcomes.filter((o) => o.outcome === "REJECTED").length], ["Modified", modified], ["Overridden", rejected + modified], ["Escalated", data.decisions.filter((d) => d.aiDecision === "escalate").length]].map(([k, v]) => <div key={k} className="bento-card p-4"><p className="text-xl font-semibold tabular-nums">{v}</p><p className="text-xs text-muted-foreground">{k}</p></div>)}</div>
          <DetailSection title="Feedback records"><ul className="divide-y divide-border">{logs.map((l) => <li key={l.id} className="py-2"><Link to="/ai-ceo/learning/$id" params={{ id: l.id }} className="text-foreground hover:underline">{l.suggestion}</Link><p className="text-[11px]">Your decision: {l.bossDecision} · Outcome: {l.outcome}</p></li>)}</ul></DetailSection>
        </TabsContent>
        <TabsContent value="history"><DetailSection title="Evaluation history"><Unavailable>Metric trends need periodic evaluation snapshots from the backend. Current learning improvement this month: {data.learningStats.improvementThisMonth}%.</Unavailable></DetailSection></TabsContent>
        <TabsContent value="failures"><DetailSection title="Failures & exceptions">{runs.filter((r) => r.status === "Failed" || r.status === "Stopped").length === 0 ? <Unavailable>No failed or stopped runs recorded.</Unavailable> : <ul className="space-y-1 text-xs">{runs.filter((r) => r.status === "Failed" || r.status === "Stopped").map((r) => <li key={r.id}>{new Date(r.at).toLocaleString()} · {r.steps.join(" → ")} <Pill value={r.status} /></li>)}</ul>}</DetailSection></TabsContent>
      </Tabs>
    </PageShell>
  );
}

/* ---------------- Usage & Cost ---------------- */
export function UsageCenter() {
  const { data } = useCEOData();
  const [ops] = useOps(); const [work] = useWork();
  const rows: [string, string | number | null, string][] = [
    ["AI requests / tokens", null, "Needs AI usage telemetry"],
    ["Estimated cost", null, "Never estimated without billing data"],
    ["Agent runs", ops.runs.filter((r) => !r.automationId).length, "This session · preview"],
    ["Automation executions", ops.runs.filter((r) => r.automationId).length, "This session · preview"],
    ["Research requests", work.research.length, "This session · preview"],
    ["Documents processed", 0, "File processing not connected"],
  ];
  return (
    <PageShell>
      <Header icon={BarChart3} title="Usage & AI Cost" subtitle="Visibility into AI resource consumption." note="No usage or billing telemetry is connected, so tokens and cost are not shown. Workspace usage reflects this browser session only." />
      <div className="grid gap-3 sm:grid-cols-3">{rows.map(([k, v, n]) => <div key={k} className="bento-card p-4"><p className="text-xl font-semibold tabular-nums">{v ?? "—"}</p><p className="text-xs">{k}</p><p className="text-[10px] text-muted-foreground">{n}</p></div>)}</div>
      <div className="grid gap-3 md:grid-cols-2">
        <DetailSection title="Model configuration"><p>AI version {data.systemInfo.aiVersion} · model {data.systemInfo.modelVersion}</p><p className="text-[11px]">Training: {data.systemInfo.lastTraining}</p></DetailSection>
        <DetailSection title="Cost by module / agent · trend · budget"><Unavailable>Breakdowns and budgets appear once AI usage and billing telemetry is connected.</Unavailable></DetailSection>
      </div>
    </PageShell>
  );
}

/* ---------------- Security & Permissions ---------------- */
const HIERARCHY: [string, string, "allowed" | "approval" | "restricted"][] = [
  ["READ", "View operational data within scope", "allowed"], ["ANALYZE", "Compare, summarize and detect patterns", "allowed"], ["RECOMMEND", "Propose actions with evidence", "allowed"],
  ["APPROVE", "Only the Founder approves", "restricted"], ["EXECUTE", "Requires explicit authorization", "approval"], ["VERIFY", "Check outcomes after actions", "allowed"], ["AUDIT", "Audit Agent and Founder only", "restricted"],
];
export function SecurityCenter() {
  const { data, isPersisted } = useCEOData();
  return (
    <PageShell>
      <Header icon={KeyRound} title="Security & Permissions" subtitle="What Founder AI and its agents may do, and what always needs your authorization." note={dataSourceStatus(isPersisted, "security events")} />
      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto flex-wrap"><TabsTrigger value="overview">Access overview</TabsTrigger><TabsTrigger value="roles">Roles</TabsTrigger><TabsTrigger value="agents">AI action permissions</TabsTrigger><TabsTrigger value="data">Knowledge & sensitive data</TabsTrigger><TabsTrigger value="events">Security & risk events</TabsTrigger></TabsList>
        <TabsContent value="overview"><DetailSection title="Permission hierarchy"><ul className="divide-y divide-border">{HIERARCHY.map(([p, d, a]) => <li key={p} className="flex items-center justify-between py-2"><span><span className="font-semibold text-foreground">{p}</span> — {d}</span><AccessPill a={a} /></li>)}</ul><p className="mt-2 text-[11px]">EXECUTE always requires authorization. Founder AI never acts without permission.</p></DetailSection></TabsContent>
        <TabsContent value="roles" className="grid gap-3 md:grid-cols-3">{[["Founder", "Full visibility; sole approver; emergency stop."], ["Founder AI", "Observe, analyze, recommend, request approval."], ["Operations agents", "Scoped to their capabilities; execution only after approval."]].map(([r, d]) => <DetailSection key={r} title={r}>{d}</DetailSection>)}<p className="text-[11px] text-muted-foreground md:col-span-3">Role management and sign-in details appear once authentication is connected.</p></TabsContent>
        <TabsContent value="agents"><DetailSection title="Agent permission matrix"><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-[11px]"><thead><tr className="text-left"><th className="py-1">Agent</th>{PERMISSIONS.map((p) => <th key={p}>{p.replace("_", " ")}</th>)}</tr></thead><tbody>{AGENTS.map((a) => <tr key={a.id} className="border-t border-border"><td className="py-1.5"><Link to="/ai-ceo/agents/$agentId" params={{ agentId: a.id }} className="text-foreground hover:underline">{a.name}</Link></td>{PERMISSIONS.map((p) => <td key={p}><AccessPill a={a.permissions[p]} /></td>)}</tr>)}</tbody></table></div></DetailSection></TabsContent>
        <TabsContent value="data" className="grid gap-3 md:grid-cols-2"><DetailSection title="Knowledge access">Agents read only records in their operational scope. Sources: {data.complianceItems.length} policies, {data.reports.length} reports, {data.learningLogs.length} learning records.</DetailSection><DetailSection title="Sensitive data">Payment, legal and access data are limited to Finance, Payment, Risk and Compliance agents, and any action on them needs approval. Audit logging status: awaiting backend.</DetailSection></TabsContent>
        <TabsContent value="events" className="space-y-2">{data.riskCategories.map((r) => <Link key={r.id} to="/ai-ceo/risk/$id" params={{ id: r.id }} className="bento-card flex items-center justify-between p-3 hover:border-primary/40"><span className="text-sm">{r.category} · {r.issues} open issues</span><SeverityBadge level={riskSeverity(r)} /></Link>)}
          {data.liveActions.filter((a) => a.impact === "high" || a.impact === "critical").map((a) => <div key={a.id} className="bento-card p-3 text-xs"><p className="text-foreground">{a.actor} ({a.role}): {a.action}</p><p className="text-muted-foreground">{a.location} · risk {a.risk} · {a.time}</p></div>)}</TabsContent>
      </Tabs>
    </PageShell>
  );
}

/* ---------------- System Status ---------------- */
export function SystemStatus() {
  const { isPersisted, isLoading } = useCEOData();
  const [ops] = useOps();
  const rows: [string, string, string][] = [
    ["Operational data", isLoading ? "Unknown" : isPersisted ? "Operational" : "Degraded", isPersisted ? "Live connection active" : "Showing realistic seed data until the live data connection is configured"],
    ["AI (Decision Brief)", "Operational", "AI briefs are generated on request"],
    ["Knowledge", isPersisted ? "Operational" : "Degraded", "Built from the operational record"],
    ["Agents", ops.killSwitch ? "Attention Required" : "Unavailable", ops.killSwitch ? "Global stop active" : "Defined, not deployed"],
    ["Automations", "Unavailable", "Configuration only; no automation backend"],
    ["Notifications", "Degraded", "In-app only; delivery not connected"],
    ["Integrations", "Unknown", "No external integrations reporting"],
  ];
  const tone: Record<string, string> = { Operational: "text-accent-emerald", Degraded: "text-accent-amber", "Attention Required": "text-destructive", Unavailable: "text-muted-foreground", Unknown: "text-muted-foreground" };
  return (
    <PageShell>
      <Header icon={Radar} title="System Status" subtitle="Operational awareness of Founder AI's services. Founder AI never deploys, rolls back or modifies code." />
      <ul className="bento-card divide-y divide-border">{rows.map(([k, s, d]) => <li key={k} className="flex flex-wrap items-center justify-between gap-2 p-3"><div><p className="text-sm font-medium">{k}</p><p className="text-[11px] text-muted-foreground">{d}</p></div><span className={`text-xs font-semibold ${tone[s]}`}>● {s}</span></li>)}</ul>
    </PageShell>
  );
}

/* ---------------- Help ---------------- */
const Kbd = ({ children }: { children: ReactNode }) => <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px]">{children}</kbd>;
export function HelpCenter() {
  return (
    <PageShell>
      <Header icon={HelpCircle} title="Help & Shortcuts" subtitle="How Founder AI works and how to move around quickly." />
      <div className="grid gap-3 md:grid-cols-2">
        <DetailSection title="Keyboard shortcuts"><ul className="space-y-2">{[[["Ctrl", "K"], "Open search & commands"], [["Esc"], "Close dialogs"], [["↑", "↓"], "Move through results"], [["Enter"], "Open selection"], [["Shift", "?"], "Open this help page"]].map(([k, d]) => <li key={String(d)} className="flex justify-between"><span>{d as string}</span><span className="flex gap-1">{(k as string[]).map((x) => <Kbd key={x}>{x}</Kbd>)}</span></li>)}</ul></DetailSection>
        <DetailSection title="How Founder AI works"><p>Observe → Understand → Predict → Decide → Approve → Orchestrate → Verify → Learn.</p><p className="mt-2">Founder AI recommends; you approve. Operations agents only act within their permissions. Development work lives in a separate module.</p></DetailSection>
        <DetailSection title="Preview vs live"><p>Screens marked "preview" keep state in your browser only. Operational figures come from the live data connection, or realistic seed data until it's configured.</p></DetailSection>
        <DetailSection title="Where to start"><ul className="space-y-1">{[["/ai-ceo", "Command Center"], ["/ai-ceo/approvals", "Approvals"], ["/ai-ceo/chat", "Ask Founder AI"], ["/ai-ceo/notifications", "Notifications"]].map(([to, l]) => <li key={to}><a href={to} className="text-primary-glow hover:underline">{l}</a></li>)}</ul></DetailSection>
      </div>
    </PageShell>
  );
}

/* ---------------- Workspaces: Files & Collaboration ---------------- */
export function FilesWorkspace() {
  const [work] = useWork();
  const files = [
    ...work.projects.flatMap((p) => p.files.map((f) => ({ ...f, where: p.name, link: { to: "/ai-ceo/projects/$projectId" as const, params: { projectId: p.id } } }))),
    ...work.research.flatMap((r) => r.sources.filter((s) => s.kind === "File").map((s) => ({ id: s.id, name: s.title, size: 0, at: r.createdAt, where: r.question, link: { to: "/ai-ceo/research/$researchId" as const, params: { researchId: r.id } } }))),
  ];
  return (
    <PageShell>
      <Header icon={Files} section="Workspaces" title="Artifacts & Files" subtitle="Files attached across projects and research." note="Files are listed by name only; they are not uploaded or read until file storage is connected." />
      {files.length === 0 ? <Unavailable>No files attached yet. Attach files inside a project or research workspace.</Unavailable> : <ul className="bento-card divide-y divide-border">{files.map((f) => <li key={f.id} className="flex flex-wrap justify-between gap-2 p-3 text-sm"><span>{f.name}</span><Link {...f.link} className="text-xs text-primary-glow hover:underline">{f.where}</Link></li>)}</ul>}
    </PageShell>
  );
}
export function CollaborationWorkspace() {
  const [work] = useWork();
  const threads = [
    ...work.projects.flatMap((p) => p.comments.map((c) => ({ ...c, where: `Project · ${p.name}`, link: { to: "/ai-ceo/projects/$projectId" as const, params: { projectId: p.id } } }))),
    ...work.research.flatMap((r) => r.comments.map((c) => ({ ...c, where: `Research · ${r.question}`, link: { to: "/ai-ceo/research/$researchId" as const, params: { researchId: r.id } } }))),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const mentions = threads.filter((t) => t.text.includes("@"));
  return (
    <PageShell>
      <Header icon={MessagesSquare} section="Workspaces" title="Collaboration" subtitle="Comments and mentions across projects and research." note="Preview: comments are kept in this browser tab; mentions don't send notifications yet." />
      <Tabs defaultValue="all"><TabsList><TabsTrigger value="all">All comments ({threads.length})</TabsTrigger><TabsTrigger value="mentions">Mentions ({mentions.length})</TabsTrigger></TabsList>
        {(["all", "mentions"] as const).map((k) => <TabsContent key={k} value={k}>{(k === "all" ? threads : mentions).length === 0 ? <Unavailable>No comments yet.</Unavailable> : <ul className="space-y-2">{(k === "all" ? threads : mentions).map((c) => <li key={c.id} className="bento-card p-3 text-sm"><p>{c.text}</p><p className="mt-1 text-[11px] text-muted-foreground">{c.author} · {new Date(c.at).toLocaleString()} · <Link {...c.link} className="text-primary-glow">{c.where}</Link></p></li>)}</ul>}</TabsContent>)}
      </Tabs>
    </PageShell>
  );
}
