import { useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Unavailable } from "@/components/ai-ceo/governance/shared";
import type { AgentDef } from "./catalog";
import { uid, useOps, type RunStatus, type TaskStatus } from "./store";
import { Pill, PreviewNotice } from "./ui";

const STEPS = ["Gather context", "Plan steps", "Approval gate", "Perform authorized step", "Verify outcome", "Record result"];

/**
 * Agent run workspace. Founder advances each step manually — a controlled
 * preview of the governed run lifecycle; no agent work is performed.
 */
export function RunWorkspace({ agent }: { agent: AgentDef }) {
  const [s, update] = useOps();
  const tasks = s.tasks.filter((t) => t.agentId === agent.id && t.status !== "Completed" && t.status !== "Cancelled");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<RunStatus>("Queued");
  const task = tasks.find((t) => t.id === taskId);
  const setTask = (st: TaskStatus) => task && update((x) => ({ ...x, tasks: x.tasks.map((t) => t.id === task.id ? { ...t, status: st } : t) }));
  const log = (text: string, rs: RunStatus) => update((x) => ({ ...x, runs: [{ id: uid("run"), taskId: task?.id, agentId: agent.id, status: rs, steps: STEPS.slice(0, step + 1), at: new Date().toISOString() }, ...x.runs] }), { kind: "Run", text, agentId: agent.id });

  if (s.killSwitch) return <Unavailable>Global stop is active. Resume operations from Execution Activity to run agents.</Unavailable>;
  if (s.paused.includes(agent.id)) return <Unavailable>This agent is paused. Resume it to start a run.</Unavailable>;
  if (!task) return (
    <div className="space-y-3">
      <PreviewNotice>Run preview: you step through the governed lifecycle. No work is performed by an agent.</PreviewNotice>
      {tasks.length === 0 ? <Unavailable>No open tasks. Assign a task to this agent first.</Unavailable> : (
        <ul className="space-y-2">{tasks.map((t) => (
          <li key={t.id} className="bento-card flex items-center justify-between p-3"><span className="text-sm">{t.title} <Pill value={t.status} /></span>
            <Button size="sm" disabled={t.status === "Waiting Approval"} title={t.status === "Waiting Approval" ? "Approve the task in Task Center first" : undefined} onClick={() => { setTaskId(t.id); setStep(0); setStatus("Running"); }}>Start run</Button></li>))}</ul>)}
    </div>
  );

  const next = () => {
    const n = step + 1;
    if (STEPS[n] === "Approval gate") { setStep(n); setStatus("Waiting Approval"); setTask("Waiting Approval"); toast.info("Run paused at approval gate"); return; }
    if (STEPS[n] === "Verify outcome") setStatus("Verifying");
    if (n >= STEPS.length) { setStatus("Completed"); setTask("Completed"); log(`Run completed: ${task.title}`, "Completed"); toast.success("Run completed (preview)"); setTaskId(null); return; }
    setStep(n);
  };
  const approve = () => { setStatus("Running"); setTask("In Progress"); setStep(step + 1); log(`Founder approved run step for "${task.title}"`, "Running"); };

  return (
    <div className="bento-card space-y-4 p-5">
      <div className="flex items-center justify-between"><p className="font-semibold">{task.title}</p><Pill value={status} /></div>
      <ol className="space-y-2">{STEPS.map((st, i) => (
        <li key={st} className="flex items-center gap-2 text-sm">
          {i < step ? <CheckCircle2 className="h-4 w-4 text-accent-emerald" /> : i === step ? <Loader2 className="h-4 w-4 text-primary-glow" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
          <span className={i > step ? "text-muted-foreground" : ""}>{st}</span>
        </li>))}</ol>
      <div className="flex flex-wrap gap-2">
        {status === "Waiting Approval" ? <Button onClick={approve}>Approve step</Button> : status === "Paused" ? <Button onClick={() => setStatus("Running")}>Resume</Button> : status === "Failed" || status === "Stopped" ? <Button onClick={() => { setStep(0); setStatus("Running"); log(`Retried run for "${task.title}"`, "Running"); }}>Retry</Button> : <Button onClick={next}>Next step</Button>}
        {status === "Running" && <Button variant="outline" onClick={() => setStatus("Paused")}>Pause</Button>}
        <Button variant="outline" onClick={() => { setStatus("Failed"); log(`Run failed at "${STEPS[step]}" (marked by Founder)`, "Failed"); }}>Mark failed</Button>
        <Button variant="destructive" onClick={() => { setStatus("Stopped"); setTask("Blocked"); log(`Run stopped: ${task.title}`, "Stopped"); toast.success("Run stopped"); }}>Stop</Button>
      </div>
    </div>
  );
}
