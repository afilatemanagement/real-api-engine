import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AlertOctagon, AlertTriangle, ArrowLeft, Bot, CircleDot, FileSearch, Info, Lock, ShieldCheck, User } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DecisionItem, RiskCategory } from "@/lib/ceo-types";

/* ---------- Severity (never color-only: icon + label) ---------- */
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
const SEV: Record<Severity, { icon: typeof Info; cls: string }> = {
  LOW: { icon: Info, cls: "border-border bg-muted/40 text-muted-foreground" },
  MEDIUM: { icon: CircleDot, cls: "border-primary/40 bg-primary/15 text-primary-glow" },
  HIGH: { icon: AlertTriangle, cls: "border-accent-amber/40 bg-accent-amber/15 text-accent-amber" },
  CRITICAL: { icon: AlertOctagon, cls: "border-destructive/40 bg-destructive/15 text-destructive" },
};
export function SeverityBadge({ level }: { level: Severity }) {
  const s = SEV[level];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider", s.cls)} aria-label={`Severity ${level.toLowerCase()}`}>
      <s.icon className="h-3 w-3" aria-hidden /> {level}
    </span>
  );
}

/* ---------- Decision status ---------- */
export type DecisionStatus =
  | "NEW" | "ANALYZING" | "RECOMMENDATION_READY" | "AWAITING_APPROVAL" | "APPROVED" | "REJECTED"
  | "EXECUTING" | "VERIFYING" | "COMPLETED" | "BLOCKED" | "CANCELLED";
export function StatusBadge({ status }: { status: DecisionStatus | string }) {
  const tone = status === "APPROVED" || status === "COMPLETED" ? "text-accent-emerald border-accent-emerald/40"
    : status === "REJECTED" || status === "BLOCKED" || status === "CANCELLED" ? "text-destructive border-destructive/40"
    : status === "AWAITING_APPROVAL" ? "text-accent-amber border-accent-amber/40"
    : "text-primary-glow border-primary/40";
  return <span className={cn("inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium tracking-wide", tone)}>{String(status).replace(/_/g, " ")}</span>;
}

/**
 * View-model derived only from fields in the operational-data contract.
 * Mapping is a presentation rule, not a new data point.
 */
export function decisionView(d: DecisionItem, override?: DecisionStatus) {
  const needsApproval = d.aiDecision === "escalate" || d.aiDecision === "delay";
  const status: DecisionStatus = override ?? (needsApproval ? "AWAITING_APPROVAL" : "RECOMMENDATION_READY");
  const priority: Severity = d.aiDecision === "escalate" ? "CRITICAL" : d.aiDecision === "reject" ? "HIGH" : d.aiDecision === "delay" ? "MEDIUM" : "LOW";
  const confidenceBand = d.confidence >= 80 ? "High" : d.confidence >= 60 ? "Medium" : "Low";
  return { needsApproval, status, priority, confidenceBand };
}
export const riskSeverity = (r: RiskCategory): Severity => r.level.toUpperCase() as Severity;

/* ---------- Layout pieces ---------- */
export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
      <ArrowLeft className="h-3.5 w-3.5" /> {label}
    </Link>
  );
}
export function DetailSection({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("bento-card p-5", className)} aria-label={title}>
      <h2 className="mb-3 text-sm font-semibold tracking-tight">{title}</h2>
      <div className="text-sm text-muted-foreground">{children}</div>
    </section>
  );
}
export function Unavailable({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">{children}</p>;
}

/* ---------- Shared Evidence Panel (EVIDENCE_API_REQUIRED for real sources) ---------- */
export interface EvidenceItem { source: string; title: string; summary: string; freshness: string }
export function EvidencePanel({ items, state = "available" }: { items: EvidenceItem[]; state?: "available" | "loading" | "unavailable" | "restricted" }) {
  if (state === "loading") return <div className="h-20 animate-pulse rounded-lg bg-muted/40" role="status" aria-label="Loading evidence" />;
  if (state === "restricted") return <Unavailable><Lock className="mr-1 inline h-3 w-3" />You don't have access to this evidence.</Unavailable>;
  if (state === "unavailable" || items.length === 0) return <Unavailable>Evidence will appear when connected.</Unavailable>;
  return (
    <ul className="space-y-2">
      {items.map((e, i) => (
        <li key={i} className="flex gap-3 rounded-lg border border-border bg-surface/60 p-3">
          <FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-primary-glow" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{e.title}</p>
            <p className="text-xs">{e.summary}</p>
            <p className="mt-1 text-[11px]">{e.source} · {e.freshness}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Shared Audit Timeline ---------- */
export interface AuditEntry { actor: string; kind: "AI" | "Founder" | "Agent" | "System" | "Administrator"; action: string; at: string }
export function AuditTimeline({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) return <Unavailable>Audit entries appear once actions are recorded.</Unavailable>;
  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {entries.map((e, i) => {
        const Icon = e.kind === "AI" || e.kind === "Agent" ? Bot : e.kind === "System" ? ShieldCheck : User;
        return (
          <li key={i} className="relative">
            <span className="absolute -left-[27px] grid h-5 w-5 place-items-center rounded-full border border-border bg-background">
              <Icon className="h-3 w-3 text-primary-glow" aria-hidden />
            </span>
            <p className="text-sm text-foreground">{e.action}</p>
            <p className="text-[11px]">{e.actor} · {e.kind} · {e.at}</p>
          </li>
        );
      })}
    </ol>
  );
}

