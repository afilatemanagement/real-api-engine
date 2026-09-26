import { useCallback, useEffect, useState } from "react";
import type { RiskTier } from "./catalog";

/**
 * Session-only prototype state for operations execution UI.
 * TASKS_API_REQUIRED / AUTOMATIONS_API_REQUIRED / EXECUTION_API_REQUIRED:
 * nothing here is persisted or executed; it is UI preview state for this tab.
 */
export type TaskStatus = "Queued" | "In Progress" | "Waiting Approval" | "Blocked" | "Completed" | "Cancelled";
export interface OpsTask {
  id: string; title: string; description: string; agentId: string; priority: RiskTier;
  status: TaskStatus; source: string; dependsOn: string[]; createdAt: string; due?: string;
}
export type Trigger = "Schedule" | "KPI threshold" | "Risk level change" | "New decision" | "Manual";
export interface Automation {
  id: string; name: string; trigger: Trigger; triggerDetail: string; conditions: string[];
  agentId: string; action: string; approval: "None" | "Founder" | "Founder + second reviewer";
  verification: string; retries: number; state: "Draft" | "Paused" | "Configured"; createdAt: string;
}
export type RunStatus = "Queued" | "Running" | "Waiting Approval" | "Verifying" | "Completed" | "Failed" | "Stopped" | "Paused";
export interface RunRecord { id: string; automationId?: string; taskId?: string; agentId: string; status: RunStatus; steps: string[]; at: string }
export interface OpsEvent { id: string; at: string; kind: string; text: string; agentId?: string }

interface OpsState {
  tasks: OpsTask[]; automations: Automation[]; runs: RunRecord[]; events: OpsEvent[];
  paused: string[]; killSwitch: boolean; resolvedEscalations: string[];
}
const KEY = "sv:founder:ops-preview";
const EMPTY: OpsState = { tasks: [], automations: [], runs: [], events: [], paused: [], killSwitch: false, resolvedEscalations: [] };

function read(): OpsState {
  try { return { ...EMPTY, ...JSON.parse(sessionStorage.getItem(KEY) ?? "{}") }; } catch { return EMPTY; }
}
export const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

export function useOps() {
  const [s, setS] = useState<OpsState>(EMPTY);
  useEffect(() => {
    const load = () => setS(read());
    load();
    window.addEventListener("ops:update", load);
    return () => window.removeEventListener("ops:update", load);
  }, []);
  const update = useCallback((fn: (s: OpsState) => OpsState, event?: Omit<OpsEvent, "id" | "at">) => {
    let next = fn(read());
    if (event) next = { ...next, events: [{ id: uid("ev"), at: new Date().toISOString(), ...event }, ...next.events].slice(0, 200) };
    try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
    window.dispatchEvent(new Event("ops:update"));
  }, []);
  return [s, update] as const;
}
