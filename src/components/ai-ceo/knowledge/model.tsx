import { Info } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CEOOperationalData } from "@/lib/ceo-types";
import { cn } from "@/lib/utils";

/**
 * Company Brain items are derived ONLY from records already in the operational-data contract
 * (compliance policies, decisions, risks, reports, learning logs, AI settings) plus items the
 * user adds in this session. KNOWLEDGE_API_REQUIRED for documents, SOPs, goals, etc.
 */
export type KnowledgeGroup = "Company" | "Operations" | "Business" | "Performance" | "Governance" | "Decisions" | "AI / System";
export type Freshness = "Fresh" | "Review Soon" | "Stale" | "Unknown";
export interface KnowledgeItem {
  id: string; title: string; type: string; group: KnowledgeGroup; summary: string; body: string;
  owner: string; updated: string; freshness: Freshness; source: string; access: "Founder" | "Leadership" | "Restricted";
  tags: string[]; link?: { to: string; label: string }; local?: boolean;
}

export const CATEGORY_TREE: Record<KnowledgeGroup, string[]> = {
  Company: ["Company Profile", "Mission", "Vision", "Strategy", "Goals", "Priorities"],
  Operations: ["SOPs", "Processes", "Workflows", "Escalation Rules", "SLAs", "Operational Policies"],
  Business: ["Products", "Services", "Pricing", "Customers", "Vendors", "Partners", "Locations"],
  Performance: ["KPIs", "Targets", "Scorecards", "Reports", "Benchmarks"],
  Governance: ["Policies", "Compliance", "Risk Rules", "Approval Rules", "Authority Matrix"],
  Decisions: ["Past Decisions", "Decision Outcomes", "Exceptions", "Lessons Learned"],
  "AI / System": ["AI Instructions", "Agent Policies", "Evaluation Rules", "Learning Patterns"],
};

export function buildKnowledge(d: CEOOperationalData, local: KnowledgeItem[]): KnowledgeItem[] {
  return [
    ...d.complianceItems.map((c): KnowledgeItem => ({
      id: `policy-${c.id}`, title: c.policy, type: "Policy", group: "Governance", summary: `Compliance status: ${c.status}`,
      body: `${c.policy}. Current status: ${c.status}. Last audit: ${c.lastAudit}.`, owner: "Compliance", updated: c.lastAudit,
      freshness: "Fresh", source: "Risk & Compliance", access: "Leadership", tags: ["compliance"], link: { to: "/ai-ceo/risk", label: "Risk & Compliance" },
    })),
    ...d.riskCategories.map((r): KnowledgeItem => ({
      id: `risk-${r.id}`, title: `${r.category} risk rule`, type: "Risk Rule", group: "Governance", summary: `${r.level} · score ${r.score}`,
      body: `${r.category} currently carries a ${r.level} risk level with ${r.issues} open issues (trend ${r.trend}).`, owner: "Risk", updated: "Current",
      freshness: "Fresh", source: "Risk register", access: "Leadership", tags: ["risk", r.level], link: { to: `/ai-ceo/risk/${r.id}`, label: "Open risk" },
    })),
    ...d.decisions.map((x): KnowledgeItem => ({
      id: `decision-${x.id}`, title: x.action, type: "Past Decision", group: "Decisions", summary: x.reasoning,
      body: `${x.reasoning}\n\nHistorical outcome: ${x.historicalOutcome}`, owner: x.requestedBy, updated: "On record",
      freshness: "Review Soon", source: "Decision Engine", access: "Founder", tags: [x.type], link: { to: `/ai-ceo/decision-engine/${x.id}`, label: "Open decision" },
    })),
    ...d.reports.map((r): KnowledgeItem => ({
      id: `report-${r.id}`, title: r.title, type: "Report", group: "Performance", summary: r.highlights.join(" · "),
      body: r.highlights.map((h) => `• ${h}`).join("\n"), owner: "Founder AI", updated: r.generatedAt, freshness: r.type === "daily" ? "Fresh" : "Review Soon",
      source: "AI Reports", access: "Leadership", tags: [r.type], link: { to: `/ai-ceo/reports/${r.id}`, label: "Open report" },
    })),
    ...d.learningLogs.map((l): KnowledgeItem => ({
      id: `lesson-${l.id}`, title: l.observation, type: "Lesson Learned", group: "Decisions", summary: l.outcome,
      body: `Observation: ${l.observation}\nSuggestion: ${l.suggestion}\nFounder decision: ${l.bossDecision}\nOutcome: ${l.outcome}`, owner: "Founder AI",
      updated: l.timestamp, freshness: "Fresh", source: "System Learning Log", access: "Founder", tags: ["learning"], link: { to: `/ai-ceo/learning/${l.id}`, label: "Open learning" },
    })),
    ...d.settings.map((s): KnowledgeItem => ({
      id: `ai-${s.category.toLowerCase().replace(/\W+/g, "-")}`, title: `${s.category} rules`, type: "AI Instruction", group: "AI / System",
      summary: `${s.settings.length} rules`, body: s.settings.map((x) => `• ${x.label}: ${x.value ? "on" : "off"}${x.locked ? " (locked)" : ""}`).join("\n"),
      owner: "Founder", updated: "Current", freshness: "Fresh", source: "Settings", access: "Founder", tags: ["ai"], link: { to: "/ai-ceo/settings", label: "Settings" },
    })),
    ...local,
  ];
}

export const LOCAL_KNOWLEDGE_KEY = "sv:founder:local-knowledge";
export const FAVORITES_KEY = "sv:founder:knowledge-favorites";

export function FreshnessBadge({ value }: { value: Freshness }) {
  const cls = value === "Fresh" ? "border-accent-emerald/40 text-accent-emerald" : value === "Review Soon" ? "border-accent-amber/40 text-accent-amber" : value === "Stale" ? "border-destructive/40 text-destructive" : "border-border text-muted-foreground";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium", cls)}>{value}<Info className="h-2.5 w-2.5" aria-hidden /></span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">Freshness indicates when the knowledge was last reviewed or updated. It does not guarantee accuracy.</TooltipContent>
    </Tooltip>
  );
}
