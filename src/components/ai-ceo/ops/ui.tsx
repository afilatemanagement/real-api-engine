import { useState, type ReactNode } from "react";
import { FlaskConical } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AGENTS, type Access, type AgentDef, type AgentStatus, type RiskTier } from "./catalog";
import { uid, useOps, type OpsTask } from "./store";

export function PreviewNotice({ children }: { children?: ReactNode }) {
  return (
    <p className="inline-flex items-start gap-2 rounded-lg border border-accent-amber/40 bg-accent-amber/10 px-3 py-2 text-[11px] text-accent-amber">
      <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{children ?? "Prototype preview: agents are not deployed. Nothing here runs or is saved beyond this browser tab until the operations execution backend is connected."}</span>
    </p>
  );
}

const TONE: Record<string, string> = {
  Available: "text-accent-emerald border-accent-emerald/40", Completed: "text-accent-emerald border-accent-emerald/40", Configured: "text-accent-emerald border-accent-emerald/40",
  Working: "text-primary-glow border-primary/40", Running: "text-primary-glow border-primary/40", "In Progress": "text-primary-glow border-primary/40", Verifying: "text-primary-glow border-primary/40",
  "Needs Approval": "text-accent-amber border-accent-amber/40", "Waiting Approval": "text-accent-amber border-accent-amber/40", Waiting: "text-accent-amber border-accent-amber/40", Queued: "text-accent-amber border-accent-amber/40", Paused: "text-accent-amber border-accent-amber/40", Draft: "text-muted-foreground border-border",
  Error: "text-destructive border-destructive/40", Failed: "text-destructive border-destructive/40", Blocked: "text-destructive border-destructive/40", Stopped: "text-destructive border-destructive/40", Cancelled: "text-muted-foreground border-border",
  Offline: "text-muted-foreground border-border",
};
export function Pill({ value }: { value: string }) {
  return <span className={cn("inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium tracking-wide", TONE[value] ?? "border-border text-muted-foreground")}>{value}</span>;
}
export function AccessPill({ a }: { a: Access }) {
  const m = { allowed: ["Allowed", "text-accent-emerald border-accent-emerald/40"], approval: ["Requires approval", "text-accent-amber border-accent-amber/40"], restricted: ["Restricted", "text-destructive border-destructive/40"] }[a];
  return <span className={cn("inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium", m[1])}>{m[0]}</span>;
}

/** Preview status: "Offline" (not deployed) unless session preview work exists. */
export function agentStatus(agent: AgentDef, tasks: OpsTask[], paused: string[], kill: boolean): AgentStatus {
  if (kill || paused.includes(agent.id)) return "Paused";
  const mine = tasks.filter((t) => t.agentId === agent.id);
  if (mine.some((t) => t.status === "Waiting Approval")) return "Needs Approval";
  if (mine.some((t) => t.status === "In Progress")) return "Working";
  if (mine.some((t) => t.status === "Queued")) return "Waiting";
  return "Offline";
}

export function AssignTaskDialog({ open, onOpenChange, agentId, preset }: {
  open: boolean; onOpenChange: (o: boolean) => void; agentId?: string; preset?: { title: string; description: string; source: string; priority?: RiskTier };
}) {
  const [, update] = useOps();
  const [title, setTitle] = useState(preset?.title ?? "");
  const [desc, setDesc] = useState(preset?.description ?? "");
  const [agent, setAgent] = useState(agentId ?? AGENTS[0]!.id);
  const [priority, setPriority] = useState<RiskTier>(preset?.priority ?? "MEDIUM");
  const [due, setDue] = useState("");
  const submit = () => {
    if (!title.trim()) { toast.error("Add a task title"); return; }
    const high = priority === "HIGH" || priority === "CRITICAL";
    const task: OpsTask = {
      id: uid("task"), title: title.trim(), description: desc.trim(), agentId: agent, priority,
      status: high ? "Waiting Approval" : "Queued", source: preset?.source ?? "Manual", dependsOn: [],
      createdAt: new Date().toISOString(), ...(due ? { due } : {}),
    };
    update((s) => ({ ...s, tasks: [task, ...s.tasks] }), { kind: "Task", text: `Task "${task.title}" assigned (${task.status})`, agentId: agent });
    toast.success(high ? "Task created — waiting for your approval" : "Task queued (preview)");
    onOpenChange(false); setTitle(""); setDesc("");
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign task</DialogTitle>
          <DialogDescription>High and critical tasks always wait for your approval. Preview only — not sent to an agent.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label htmlFor="t-title">Title</Label><Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label htmlFor="t-desc">Instructions</Label><Textarea id="t-desc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Agent</Label>
              <Select value={agent} onValueChange={setAgent}><SelectTrigger aria-label="Agent"><SelectValue /></SelectTrigger>
                <SelectContent>{AGENTS.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as RiskTier)}><SelectTrigger aria-label="Priority"><SelectValue /></SelectTrigger>
                <SelectContent>{(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((p) => <SelectItem key={p} value={p}>{p.toLowerCase()}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div><Label htmlFor="t-due">Due date (optional)</Label><Input id="t-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Assign</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
