import { useCallback, useEffect, useMemo, useState } from "react";
import type { CEOOperationalData } from "@/lib/ceo-types";
import type { Severity } from "@/components/ai-ceo/governance/shared";
import { useCEOData } from "@/hooks/useCEOData";
import { useOps } from "@/components/ai-ceo/ops/store";

/**
 * Notifications are DERIVED from the operational record (and this tab's preview
 * work) — no notification service exists yet (NOTIFICATIONS_API_REQUIRED).
 * Read/archive state is stored in this browser only.
 */
export type NotifCategory = "Critical" | "Risk" | "Approval" | "Decision" | "Task" | "Agent" | "Automation" | "Research" | "Knowledge" | "System";
export interface Notif {
  id: string; category: NotifCategory; title: string; summary: string; at?: string; severity: Severity;
  source: string; module: string; to: string; action: string; escalated: boolean;
}

export function deriveNotifications(d: CEOOperationalData, ops: ReturnType<typeof useOps>[0]): Notif[] {
  const sev = (s: string): Severity => (s === "critical" ? "CRITICAL" : s === "high" || s === "warning" ? "HIGH" : s === "medium" ? "MEDIUM" : "LOW");
  return [
    ...d.observations.filter((o) => o.severity !== "info").map((o): Notif => ({ id: `obs-${o.id}`, category: o.severity === "critical" ? "Critical" : "System", title: o.title, summary: o.detail, at: o.timestamp, severity: sev(o.severity), source: "AI observation", module: "Command Center", to: "/ai-ceo", action: "Review", escalated: o.severity === "critical" })),
    ...d.decisions.filter((x) => x.aiDecision === "escalate" || x.aiDecision === "delay").map((x): Notif => ({ id: `dec-${x.id}`, category: "Approval", title: `Approval needed: ${x.action}`, summary: x.reasoning, severity: x.aiDecision === "escalate" ? "CRITICAL" : "MEDIUM", source: `Requested by ${x.requestedBy}`, module: "Approvals", to: `/ai-ceo/approvals/${x.id}`, action: "Review approval", escalated: x.aiDecision === "escalate" })),
    ...d.decisions.filter((x) => x.aiDecision === "approve" || x.aiDecision === "reject").map((x): Notif => ({ id: `dcu-${x.id}`, category: "Decision", title: `AI recommends ${x.aiDecision}: ${x.action}`, summary: `${x.confidence}% confidence. ${x.reasoning}`, severity: "LOW", source: "Decision Engine", module: "Decision Engine", to: `/ai-ceo/decision-engine/${x.id}`, action: "Open decision", escalated: false })),
    ...d.riskCategories.filter((r) => r.level === "critical" || r.level === "high").map((r): Notif => ({ id: `risk-${r.id}`, category: "Risk", title: `${r.category} at ${r.level} level`, summary: `Score ${r.score}, ${r.issues} open issues, trend ${r.trend}.`, severity: sev(r.level), source: "Risk register", module: "Risk & Compliance", to: `/ai-ceo/risk/${r.id}`, action: "Open risk", escalated: r.level === "critical" })),
    ...d.complianceItems.filter((c) => !/compliant|pass/i.test(c.status)).map((c): Notif => ({ id: `kn-${c.id}`, category: "Knowledge", title: `Policy needs review: ${c.policy}`, summary: `Status ${c.status}, last audit ${c.lastAudit}.`, severity: "MEDIUM", source: "Company Brain", module: "Company Brain", to: "/ai-ceo/company-brain", action: "Review policy", escalated: false })),
    ...ops.tasks.filter((t) => t.status === "Waiting Approval").map((t): Notif => ({ id: `task-${t.id}`, category: "Task", title: `Task awaiting approval: ${t.title}`, summary: "Preview task created in this session.", at: t.createdAt, severity: t.priority, source: "Task Center (preview)", module: "Tasks", to: `/ai-ceo/tasks/${t.id}`, action: "Approve or reject", escalated: false })),
    ...ops.runs.filter((r) => r.status === "Failed" || r.status === "Stopped").map((r): Notif => ({ id: `run-${r.id}`, category: r.automationId ? "Automation" : "Agent", title: `Run ${r.status.toLowerCase()}`, summary: `Steps: ${r.steps.join(" → ")}`, at: r.at, severity: "HIGH", source: "Execution (preview)", module: "Activity", to: "/ai-ceo/activity", action: "Review run", escalated: false })),
  ];
}

const KEY = "sv:founder:notif-state";
interface NState { read: string[]; archived: string[] }
export function useNotifications() {
  const { data } = useCEOData();
  const [ops] = useOps();
  const [st, setSt] = useState<NState>({ read: [], archived: [] });
  useEffect(() => {
    const l = () => { try { setSt({ read: [], archived: [], ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }); } catch { /* ignore */ } };
    l(); window.addEventListener("notif:update", l); return () => window.removeEventListener("notif:update", l);
  }, []);
  const save = useCallback((fn: (s: NState) => NState) => {
    let cur: NState = { read: [], archived: [] };
    try { cur = { ...cur, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { /* ignore */ }
    try { localStorage.setItem(KEY, JSON.stringify(fn(cur))); } catch { /* ignore */ }
    window.dispatchEvent(new Event("notif:update"));
  }, []);
  const all = useMemo(() => deriveNotifications(data, ops), [data, ops]);
  const toggle = (k: keyof NState, id: string, on: boolean) => save((s) => ({ ...s, [k]: on ? [...new Set([...s[k], id])] : s[k].filter((x) => x !== id) }));
  return {
    all, state: st,
    unread: all.filter((n) => !st.read.includes(n.id) && !st.archived.includes(n.id)).length,
    setRead: (id: string, on: boolean) => toggle("read", id, on),
    setArchived: (id: string, on: boolean) => toggle("archived", id, on),
    markAllRead: () => save((s) => ({ ...s, read: all.map((n) => n.id) })),
  };
}
