import type { CEOOperationalData } from "./ceo-types";
import { CEO_SEED_DATA } from "./ceo-seed";
import { airaFetch } from "./aira-api.server";

/** Compact company context for a worker run: live AIRA data when configured, otherwise the realistic seed (labelled). */
export async function loadCompanyContext(): Promise<{ source: string; text: string }> {
  let d: CEOOperationalData = CEO_SEED_DATA;
  let source = "example data — live AIRA not connected";
  const r = await airaFetch<CEOOperationalData>("/ai-ceo/operational-data");
  if (r.ok && r.data && Array.isArray(r.data.decisions)) { d = r.data; source = "live AIRA data"; }
  const lines = [
    `Metrics: ${JSON.stringify(d.metrics)}`,
    "Observations:", ...d.observations.map((o) => `- [${o.severity}] ${o.title}: ${o.detail}`),
    "Decisions:", ...d.decisions.map((x) => `- ${x.action} (AI: ${x.aiDecision}, ${x.confidence}%): ${x.reasoning}`),
    "Risks:", ...d.riskCategories.map((x) => `- ${x.category}: ${x.level}, score ${x.score}, ${x.issues} issues, trend ${x.trend}`),
    "Corrective actions:", ...d.correctiveActions.map((x) => `- ${x.team}: ${x.issue} → ${x.action} (${x.priority})`),
    "Compliance:", ...d.complianceItems.map((x) => `- ${x.policy}: ${x.status} (last audit ${x.lastAudit})`),
    "Predictions:", ...d.predictions.map((x) => `- ${x.title} (${x.confidence}%, ${x.timeline}): ${x.detail}`),
  ];
  return { source, text: lines.join("\n").slice(0, 12000) };
}
