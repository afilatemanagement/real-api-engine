import { Link } from "@tanstack/react-router";
import {
  Archive, ArrowRight, Ban, CheckCircle2, CircleDashed, CirclePause, CirclePlay, Clock, Cog, Hand, Inbox, Loader2, Lock,
  Map as MapIcon, PlusCircle, RotateCcw, ShieldCheck, Siren, Sparkles, UserCheck, XCircle, type LucideIcon,
} from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { DetailSection } from "@/components/ai-ceo/governance/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Canonical lifecycle vocabulary for Founder AI UI. Single reference for engineering integration. */
type State = { icon: LucideIcon; label: string; meaning: string; action: string; tone: string };
const OK = "text-accent-emerald", RUN = "text-primary-glow", WAIT = "text-accent-amber", BAD = "text-destructive", MUTED = "text-muted-foreground";

export const AGENT_LIFECYCLE: State[] = [
  { icon: PlusCircle, label: "Created", meaning: "Defined in the policy catalog, not yet configured.", action: "Configure permissions", tone: MUTED },
  { icon: Cog, label: "Configured", meaning: "Permissions and capabilities set; not deployed.", action: "Review in Security", tone: MUTED },
  { icon: CircleDashed, label: "Available", meaning: "Ready to accept proposed work.", action: "Assign task", tone: OK },
  { icon: Inbox, label: "Assigned", meaning: "Work proposed to this agent.", action: "Open queue", tone: RUN },
  { icon: Loader2, label: "Working", meaning: "Executing an authorized task.", action: "Monitor / Pause", tone: RUN },
  { icon: Clock, label: "Waiting", meaning: "Waiting on approval or dependency.", action: "Review approval", tone: WAIT },
  { icon: Ban, label: "Blocked", meaning: "Cannot continue without intervention.", action: "Resolve / Reassign", tone: BAD },
  { icon: CirclePause, label: "Paused", meaning: "Stopped by the Founder or global stop.", action: "Resume", tone: WAIT },
  { icon: CheckCircle2, label: "Completed", meaning: "Work finished, not yet verified.", action: "Verify", tone: OK },
  { icon: XCircle, label: "Failed", meaning: "Run failed or stopped.", action: "Retry / Reassign / Escalate", tone: BAD },
  { icon: ShieldCheck, label: "Verified", meaning: "Outcome confirmed by a human.", action: "Record learning", tone: OK },
  { icon: Archive, label: "Archived", meaning: "Retired from the workforce.", action: "View history", tone: MUTED },
];
export const TASK_LIFECYCLE: State[] = [
  { icon: PlusCircle, label: "Created", meaning: "Drafted in a plan or task form.", action: "Set priority & agent", tone: MUTED },
  { icon: Inbox, label: "Queued", meaning: "In the queue, waiting on a dependency.", action: "Check dependency", tone: WAIT },
  { icon: UserCheck, label: "Assigned", meaning: "Worker proposed; not accepted.", action: "Reassign if needed", tone: RUN },
  { icon: Hand, label: "Accepted", meaning: "Worker acknowledged (needs execution backend).", action: "Monitor", tone: RUN },
  { icon: CirclePlay, label: "Running", meaning: "In progress under authorization.", action: "Pause / Stop", tone: RUN },
  { icon: Clock, label: "Waiting", meaning: "Held at an approval gate.", action: "Approve / Reject", tone: WAIT },
  { icon: Ban, label: "Blocked", meaning: "Stopped by dependency or pause.", action: "Resolve", tone: BAD },
  { icon: CheckCircle2, label: "Completed", meaning: "Result produced.", action: "Start verification", tone: OK },
  { icon: Loader2, label: "Verification", meaning: "Result being checked.", action: "Verify", tone: RUN },
  { icon: ShieldCheck, label: "Verified", meaning: "Outcome confirmed.", action: "Close / learn", tone: OK },
  { icon: XCircle, label: "Failed", meaning: "Did not produce a valid result.", action: "Retry / Reassign", tone: BAD },
  { icon: RotateCcw, label: "Retry", meaning: "Queued for another attempt.", action: "Monitor", tone: WAIT },
  { icon: Siren, label: "Escalated", meaning: "Raised to the Founder.", action: "Decide", tone: BAD },
  { icon: XCircle, label: "Cancelled", meaning: "Stopped permanently.", action: "Carry forward or archive", tone: MUTED },
];

const GOVERNANCE = [
  { icon: Sparkles, title: "AI recommendation", body: "Founder AI, Morning AI and workers only propose, with evidence and confidence." },
  { icon: UserCheck, title: "Human approval", body: "The Founder approves; High/Critical work always needs explicit authorization." },
  { icon: Lock, title: "Authorized execution", body: "Only approved work may run. No execution backend is connected — nothing runs today." },
  { icon: ShieldCheck, title: "Verification", body: "A human confirms outcomes before they count as verified and feed learning." },
];
const ORCH = [
  ["Morning AI", "/ai-ceo/morning"], ["Plan", "/ai-ceo/morning/plan"], ["Assign", "/ai-ceo/morning/plan"], ["Worker", "/ai-ceo/workers"],
  ["Execute", "/ai-ceo/morning/execution"], ["Verify", "/ai-ceo/morning/execution"], ["Outcome", "/ai-ceo/activity"], ["Learning", "/ai-ceo/learning"],
] as const;
const SYSTEMS = [
  ["Founder AI", "CEO / Operations Intelligence", "This product"], ["Morning AI", "Daily Operational Orchestrator", "Inside Founder AI"],
  ["Worker Agents", "Specialized Operational Workforce", "Inside Founder AI"], ["AI Monitoring", "Observation / Detection", "Inside Founder AI"],
  ["AI Developer", "Separate Development System", "Not part of Founder AI"], ["AI API Manager", "AI Provider / API / Billing", "Not part of Founder AI"],
];
const FAILURE = ["Failure", "Explanation", "Impact", "Evidence", "Suggested action", "Retry / Reassign / Escalate", "Verification"];

function StateGrid({ states }: { states: State[] }) {
  return <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{states.map((s) => <div key={s.label} className="flex gap-3 rounded-lg border border-border p-3">
    <s.icon className={cn("mt-0.5 h-4 w-4 shrink-0", s.tone)} aria-hidden />
    <div className="min-w-0"><p className={cn("text-sm font-medium", s.tone)}>{s.label}</p><p className="text-xs text-muted-foreground">{s.meaning}</p><p className="mt-1 text-[11px]">Action: {s.action}</p></div>
  </div>)}</div>;
}
function Chain({ items }: { items: readonly (readonly [string, string] | string)[] }) {
  return <ol className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center">{items.map((it, i) => {
    const [label, to] = typeof it === "string" ? [it, null] : it;
    return <li key={i} className="inline-flex items-center gap-1 text-xs">
      {to ? <Link to={to} className="rounded-md border border-border px-2 py-1 hover:border-primary/50 hover:text-primary-glow">{label}</Link> : <span className="rounded-md border border-border px-2 py-1">{label}</span>}
      {i < items.length - 1 && <ArrowRight className="h-3 w-3 rotate-90 text-muted-foreground sm:rotate-0" aria-hidden />}
    </li>;
  })}</ol>;
}

export function SystemMap() {
  return <PageShell>
    <section><p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><MapIcon className="h-3.5 w-3.5" /> Founder AI · System</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">System Map & Lifecycles</h1>
      <p className="mt-1 text-sm text-muted-foreground">How Founder AI, Morning AI and Worker Agents fit together, and what every status means.</p></section>
    <DetailSection title="Product boundaries"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{SYSTEMS.map(([n, r, w]) => <div key={n} className={cn("rounded-lg border p-3", w.startsWith("Not") ? "border-dashed border-border opacity-70" : "border-border")}><p className="text-sm font-medium">{n}</p><p className="text-xs text-muted-foreground">{r}</p><p className="mt-1 text-[11px]">{w}</p></div>)}</div></DetailSection>
    <DetailSection title="Governance separation"><ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{GOVERNANCE.map((g, i) => <li key={g.title} className="rounded-lg border border-border p-3"><p className="inline-flex items-center gap-2 text-sm font-medium"><span className="text-[10px] text-muted-foreground">{i + 1}</span><g.icon className="h-4 w-4 text-primary-glow" aria-hidden />{g.title}</p><p className="mt-1 text-xs text-muted-foreground">{g.body}</p></li>)}</ol>
      <p className="mt-2 text-[11px] text-muted-foreground">No agent has unrestricted autonomous authority. Execute always requires authorization.</p></DetailSection>
    <DetailSection title="Orchestration — every stage links to its screen"><Chain items={ORCH} /></DetailSection>
    <DetailSection title="Failure handling — no silent failures"><Chain items={FAILURE} /><p className="mt-2 text-[11px] text-muted-foreground">Surfaces in Worker Agents → Failures, Live Execution → Exceptions, and Execution Activity → Escalations.</p></DetailSection>
    <Tabs defaultValue="agent"><TabsList><TabsTrigger value="agent">Agent lifecycle</TabsTrigger><TabsTrigger value="task">Task lifecycle</TabsTrigger></TabsList>
      <TabsContent value="agent"><StateGrid states={AGENT_LIFECYCLE} /></TabsContent>
      <TabsContent value="task"><StateGrid states={TASK_LIFECYCLE} /><p className="mt-2 text-[11px] text-muted-foreground">Accepted, Running and automated Verification require the execution backend; in preview, the Founder advances these manually.</p></TabsContent>
    </Tabs>
  </PageShell>;
}
