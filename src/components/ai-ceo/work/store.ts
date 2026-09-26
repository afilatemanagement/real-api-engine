import { useCallback, useEffect, useState } from "react";

/**
 * Session-only prototype state for Research and Projects.
 * RESEARCH_API_REQUIRED / PROJECTS_API_REQUIRED / FILES_API_REQUIRED:
 * no web research, file processing or AI runs; nothing persists beyond this tab.
 */
export type ResearchStage = "Question" | "Sources" | "Findings" | "Synthesis" | "Decision";
export const STAGES: ResearchStage[] = ["Question", "Sources", "Findings", "Synthesis", "Decision"];
export interface Source { id: string; kind: "Operational record" | "External link" | "Note" | "File"; title: string; detail: string; href?: string }
export interface Finding { id: string; text: string; sourceIds: string[]; confidence: "Low" | "Medium" | "High" }
export interface Comment { id: string; at: string; author: string; text: string }
export interface Research {
  id: string; question: string; scope: string; priority: "LOW" | "MEDIUM" | "HIGH"; stage: ResearchStage;
  sources: Source[]; findings: Finding[]; synthesis: string; handoff?: string; projectId?: string;
  comments: Comment[]; createdAt: string;
}
export interface Milestone { id: string; title: string; due?: string; done: boolean }
export interface Project {
  id: string; name: string; objective: string; owner: string; status: "Planning" | "Active" | "At Risk" | "On Hold" | "Completed";
  milestones: Milestone[]; taskIds: string[]; riskIds: string[]; decisionIds: string[]; researchIds: string[];
  reportIds: string[]; knowledge: string[]; files: { id: string; name: string; size: number; at: string }[];
  comments: Comment[]; createdAt: string;
}
export interface WorkEvent { id: string; at: string; scope: string; text: string }
interface WorkState { research: Research[]; projects: Project[]; events: WorkEvent[] }

const KEY = "sv:founder:work-preview";
const EMPTY: WorkState = { research: [], projects: [], events: [] };
const read = (): WorkState => { try { return { ...EMPTY, ...JSON.parse(sessionStorage.getItem(KEY) ?? "{}") }; } catch { return EMPTY; } };
export const wid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

export function useWork() {
  const [s, setS] = useState<WorkState>(EMPTY);
  useEffect(() => { const l = () => setS(read()); l(); window.addEventListener("work:update", l); return () => window.removeEventListener("work:update", l); }, []);
  const update = useCallback((fn: (s: WorkState) => WorkState, event?: { scope: string; text: string }) => {
    let n = fn(read());
    if (event) n = { ...n, events: [{ id: wid("ev"), at: new Date().toISOString(), ...event }, ...n.events].slice(0, 300) };
    try { sessionStorage.setItem(KEY, JSON.stringify(n)); } catch { /* ignore */ }
    window.dispatchEvent(new Event("work:update"));
  }, []);
  return [s, update] as const;
}

export const MENTIONABLE = ["Founder", "Finance Operations Agent", "Risk Agent", "Compliance Agent", "Research Agent", "Operations Monitor"];
