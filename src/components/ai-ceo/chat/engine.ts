import type { CEOOperationalData } from "@/lib/ceo-types";

/**
 * Grounded answer composer. It only restates records already in the operational-data
 * contract, with citations — it does not invent analysis. AI_CHAT_API_REQUIRED to replace
 * with model reasoning over the same sources.
 */
export interface Citation { id: string; type: string; title: string; detail: string; href: string }
export interface Answer { summary: string; findings: string[]; citations: Citation[]; next: { label: string; href: string }[] }

function corpus(d: CEOOperationalData): (Citation & { text: string; weight: number })[] {
  return [
    ...d.observations.map((o) => ({ id: o.id, type: "Attention item", title: o.title, detail: o.detail, href: "/ai-ceo", text: `${o.title} ${o.detail} ${o.category} attention today overview`, weight: o.severity === "critical" ? 3 : o.severity === "warning" ? 2 : 1 })),
    ...d.decisions.map((x) => ({ id: x.id, type: "Decision", title: x.action, detail: `AI recommends ${x.aiDecision} (${x.confidence}% confidence). ${x.reasoning}`, href: `/ai-ceo/decision-engine/${x.id}`, text: `${x.action} ${x.reasoning} ${x.type} decision decisions review approve`, weight: x.aiDecision === "escalate" ? 3 : 2 })),
    ...d.riskCategories.map((r) => ({ id: r.id, type: "Risk", title: r.category, detail: `${r.level} risk, score ${r.score}, ${r.issues} open issues, trend ${r.trend}.`, href: `/ai-ceo/risk/${r.id}`, text: `${r.category} risk risks emerging compliance ${r.level}`, weight: r.level === "critical" ? 3 : r.level === "high" ? 2 : 1 })),
    ...d.predictions.map((p) => ({ id: p.id, type: "Prediction", title: p.title, detail: `${p.detail} (${p.timeline}, ${p.confidence}% confidence — an estimate, not a certainty).`, href: `/ai-ceo/predictions/${p.id}`, text: `${p.title} ${p.detail} trend trends forecast predict emerging`, weight: 2 })),
    ...d.rolePerformance.map((r) => ({ id: r.role, type: "KPI", title: `${r.role} · ${r.metric}`, detail: `Score ${r.score}, change ${r.change}, trend ${r.trend}.`, href: "/ai-ceo/performance", text: `${r.role} ${r.metric} performance changes kpi team`, weight: r.trend === "down" ? 2 : 1 })),
    ...d.reports.map((r) => ({ id: r.id, type: "Report", title: r.title, detail: r.highlights.join(" · "), href: `/ai-ceo/reports/${r.id}`, text: `${r.title} report summary ${r.type} ${r.highlights.join(" ")}`, weight: 1 })),
    ...d.learningLogs.map((l) => ({ id: l.id, type: "Learning", title: l.observation, detail: `Founder ${l.bossDecision} · ${l.outcome}`, href: `/ai-ceo/learning/${l.id}`, text: `${l.observation} ${l.outcome} learning lesson`, weight: 1 })),
  ];
}

const STOP = new Set(["the", "a", "an", "of", "to", "me", "my", "is", "are", "what", "show", "give", "and", "for", "on", "in", "about", "this", "that", "i", "should", "today's", "recent"]);

export function answer(question: string, d: CEOOperationalData, context?: string): Answer {
  const terms = `${question} ${context ?? ""}`.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOP.has(t));
  const scored = corpus(d)
    .map((c) => ({ c, s: terms.reduce((acc, t) => acc + (c.text.toLowerCase().includes(t) ? 1 : 0), 0) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s * 10 + b.c.weight - (a.s * 10 + a.c.weight))
    .slice(0, 4);
  if (scored.length === 0) {
    return { summary: "I couldn't find on-record operational data that matches this question.", findings: ["Try naming a module, team, risk, report or decision."], citations: [], next: [{ label: "Search Company Brain", href: "/ai-ceo/company-brain" }] };
  }
  const citations = scored.map(({ c }) => ({ id: c.id, type: c.type, title: c.title, detail: c.detail, href: c.href }));
  const types = [...new Set(citations.map((c) => c.type))];
  const next = [
    ...(types.includes("Decision") ? [{ label: "Review in Decision Engine", href: "/ai-ceo/decision-engine" }] : []),
    ...(types.includes("Risk") ? [{ label: "Open Risk & Compliance", href: "/ai-ceo/risk" }] : []),
    ...(types.includes("Prediction") ? [{ label: "Open Predictive Insights", href: "/ai-ceo/predictions" }] : []),
    { label: "Create a decision from this", href: "/ai-ceo/decision-engine" },
  ].slice(0, 3);
  return {
    summary: `Here ${citations.length === 1 ? "is the record" : `are ${citations.length} records`} on file most relevant to your question (${types.join(", ").toLowerCase()}).`,
    findings: citations.map((c) => `${c.title} — ${c.detail}`),
    citations,
    next,
  };
}
