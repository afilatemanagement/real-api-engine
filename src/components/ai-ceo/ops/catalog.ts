/**
 * Operations agent POLICY catalog (definitions only).
 * These describe agent roles Founder AI can coordinate. None is deployed yet:
 * AGENTS_RUNTIME_API_REQUIRED — live status/execution come from a future backend.
 * Operations agents only — no development, coding, Git, deploy or debug agents.
 */
export type RiskTier = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Permission = "READ" | "ANALYZE" | "RECOMMEND" | "REQUEST_APPROVAL" | "EXECUTE" | "VERIFY" | "AUDIT";
export type Access = "allowed" | "approval" | "restricted";
export type AgentStatus = "Available" | "Working" | "Waiting" | "Paused" | "Needs Approval" | "Error" | "Offline";

export interface AgentDef {
  id: string; name: string; category: string; purpose: string; risk: RiskTier;
  capabilities: string[]; owner: string; permissions: Record<Permission, Access>;
}

export const PERMISSIONS: Permission[] = ["READ", "ANALYZE", "RECOMMEND", "REQUEST_APPROVAL", "EXECUTE", "VERIFY", "AUDIT"];

export const CAPABILITIES: Record<string, { description: string; risk: RiskTier }> = {
  "Read operational data": { description: "Read operational records within scope.", risk: "LOW" },
  "Analyze KPI": { description: "Compare KPIs to targets and history.", risk: "LOW" },
  "Create report": { description: "Draft a report for Founder review.", risk: "LOW" },
  "Create recommendation": { description: "Propose an action with evidence.", risk: "MEDIUM" },
  "Create task": { description: "Create a low-impact operational task.", risk: "MEDIUM" },
  "Trigger approved workflow": { description: "Run a workflow only after approval.", risk: "HIGH" },
  "Escalate issue": { description: "Raise an issue to the Founder.", risk: "MEDIUM" },
  "Request approval": { description: "Ask the Founder to authorize an action.", risk: "MEDIUM" },
};

export const RISK_TIER_INFO: Record<RiskTier, string> = {
  LOW: "Read and analyze operations.",
  MEDIUM: "Create recommendations or low-impact tasks.",
  HIGH: "Operational changes requiring approval.",
  CRITICAL: "Explicit human authorization required.",
};

const base = (risk: RiskTier): Record<Permission, Access> => ({
  READ: "allowed", ANALYZE: "allowed",
  RECOMMEND: risk === "LOW" ? "allowed" : "allowed",
  REQUEST_APPROVAL: "allowed",
  EXECUTE: risk === "LOW" ? "restricted" : "approval",
  VERIFY: risk === "CRITICAL" ? "approval" : "allowed",
  AUDIT: "restricted",
});

const RO = ["Read operational data", "Analyze KPI", "Create report"];
const REC = [...RO, "Create recommendation", "Escalate issue", "Request approval"];
const ACT = [...REC, "Create task", "Trigger approved workflow"];

const mk = (name: string, category: string, purpose: string, risk: RiskTier, caps: string[], owner = "Founder"): AgentDef => {
  const p = base(risk);
  if (name === "Audit Agent") p.AUDIT = "allowed";
  return { id: name.toLowerCase().replace(/[^a-z]+/g, "-").replace(/-$/, ""), name, category, purpose, risk, capabilities: caps, owner, permissions: p };
};

export const AGENTS: AgentDef[] = [
  mk("Operations Monitor", "Monitoring", "Watches operational activity for changes needing attention.", "LOW", RO),
  mk("KPI Monitor", "Monitoring", "Tracks KPIs against targets and flags drift.", "LOW", RO),
  mk("Anomaly Monitor", "Monitoring", "Detects unusual patterns in activity and risk scores.", "LOW", [...RO, "Escalate issue"]),
  mk("SLA Monitor", "Monitoring", "Watches service commitments and flags breaches.", "MEDIUM", [...RO, "Escalate issue"]),
  mk("Performance Analyst", "Analytics", "Explains role and team performance changes.", "LOW", REC),
  mk("Business Analyst", "Analytics", "Summarizes business health for decisions.", "LOW", REC),
  mk("Trend Analyst", "Analytics", "Finds emerging trends in operational data.", "LOW", REC),
  mk("Customer Operations Agent", "Customer Operations", "Coordinates customer operational follow-ups.", "MEDIUM", ACT),
  mk("Support Operations Agent", "Customer Operations", "Organizes support workload and escalations.", "MEDIUM", ACT),
  mk("Feedback Analyst", "Customer Operations", "Groups customer feedback into themes.", "LOW", REC),
  mk("Sales Operations Agent", "Sales Operations", "Keeps sales operations tasks moving.", "MEDIUM", ACT),
  mk("Pipeline Analyst", "Sales Operations", "Reviews pipeline health and stalled deals.", "LOW", REC),
  mk("Marketplace Operations Agent", "Marketplace Operations", "Coordinates marketplace operational work.", "MEDIUM", ACT),
  mk("Catalog Operations Agent", "Marketplace Operations", "Flags catalog quality and listing issues.", "MEDIUM", ACT),
  mk("Finance Operations Agent", "Finance Operations", "Prepares finance operations work for approval.", "HIGH", ACT),
  mk("Payment Operations Agent", "Finance Operations", "Reviews payouts and payment exceptions.", "CRITICAL", ACT),
  mk("Marketing Operations Agent", "Marketing Operations", "Coordinates marketing operational tasks.", "MEDIUM", ACT),
  mk("Campaign Analyst", "Marketing Operations", "Reviews campaign performance.", "LOW", REC),
  mk("Risk Agent", "Risk & Governance", "Monitors risk categories and mitigations.", "HIGH", REC),
  mk("Compliance Agent", "Risk & Governance", "Checks compliance status and audit dates.", "HIGH", REC),
  mk("Audit Agent", "Risk & Governance", "Keeps an audit trail of agent actions.", "MEDIUM", [...RO, "Escalate issue"]),
  mk("Research Agent", "Research", "Researches business questions for the Founder.", "LOW", REC),
  mk("Competitive Intelligence Agent", "Research", "Tracks competitor signals.", "LOW", REC),
];

export const CATEGORIES = [...new Set(AGENTS.map((a) => a.category))];
export const agentById = (id: string) => AGENTS.find((a) => a.id === id);

/** Map a contract risk/decision to a responsible agent (presentation rule). */
export function agentForText(text: string): AgentDef {
  const t = text.toLowerCase();
  const pick = (id: string) => agentById(id)!;
  if (/payout|payment|\$/.test(t)) return pick("payment-operations-agent");
  if (/financ|revenue|cost/.test(t)) return pick("finance-operations-agent");
  if (/complian|policy|audit/.test(t)) return pick("compliance-agent");
  if (/sla|support|ticket/.test(t)) return pick("sla-monitor");
  if (/security|access|permission|legal/.test(t)) return pick("risk-agent");
  if (/sales|pipeline|lead/.test(t)) return pick("sales-operations-agent");
  if (/marketing|campaign/.test(t)) return pick("marketing-operations-agent");
  return pick("operations-monitor");
}
