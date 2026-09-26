import { useCallback, useEffect, useState } from "react";
import type { RiskTier } from "@/components/ai-ceo/ops/catalog";

/** Session-only Morning AI work plan (UI preview). Nothing is executed or persisted server-side. */
export type MsgKind = "Instruction" | "Clarification" | "Handoff" | "Result" | "Exception" | "Escalation";
export interface PlanMsg { id: string; at: string; kind: MsgKind; from: string; to: string; text: string }
export interface PlanTask {
  id: string; title: string; requirement: string; agentId?: string; priority: RiskTier; dependsOn: string[];
  deadline?: string; approval: boolean; verification: string[]; handoffTo?: string; handoffReason?: string;
  opsTaskId?: string; deferred?: boolean; messages: PlanMsg[];
}
export interface Plan { objective: string; priority: RiskTier; expectedOutcome: string; tasks: PlanTask[]; learnings: string[] }
const KEY = "sv:founder:morning-plan";
const EMPTY: Plan = { objective: "", priority: "HIGH", expectedOutcome: "", tasks: [], learnings: [] };
const read = (): Plan => { try { return { ...EMPTY, ...JSON.parse(sessionStorage.getItem(KEY) ?? "{}") }; } catch { return EMPTY; } };

export function usePlan() {
  const [p, setP] = useState<Plan>(EMPTY);
  useEffect(() => { const l = () => setP(read()); l(); window.addEventListener("plan:update", l); return () => window.removeEventListener("plan:update", l); }, []);
  const update = useCallback((fn: (p: Plan) => Plan) => {
    try { sessionStorage.setItem(KEY, JSON.stringify(fn(read()))); } catch { /* ignore */ }
    window.dispatchEvent(new Event("plan:update"));
  }, []);
  return [p, update] as const;
}
