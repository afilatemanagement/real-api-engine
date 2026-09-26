import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SeverityBadge } from "@/components/ai-ceo/governance/shared";
import { AGENTS, CAPABILITIES, CATEGORIES, RISK_TIER_INFO, type RiskTier } from "./catalog";
import { useOps } from "./store";
import { AssignTaskDialog, Pill, PreviewNotice, agentStatus } from "./ui";

const STATUSES = ["Available", "Working", "Waiting", "Paused", "Needs Approval", "Error", "Offline"];

export function AgentDirectory() {
  const [s, update] = useOps();
  const [q, setQ] = useState(""); const [cat, setCat] = useState("all"); const [st, setSt] = useState("all");
  const [cap, setCap] = useState("all"); const [risk, setRisk] = useState("all");
  const [assign, setAssign] = useState<string | null>(null);
  const list = AGENTS.filter((a) => !q || `${a.name} ${a.purpose}`.toLowerCase().includes(q.toLowerCase()))
    .filter((a) => cat === "all" || a.category === cat)
    .filter((a) => cap === "all" || a.capabilities.includes(cap))
    .filter((a) => risk === "all" || a.risk === risk)
    .filter((a) => st === "all" || agentStatus(a, s.tasks, s.paused, s.killSwitch) === st);
  const togglePause = (id: string, name: string) => {
    const on = s.paused.includes(id);
    update((x) => ({ ...x, paused: on ? x.paused.filter((p) => p !== id) : [...x.paused, id] }), { kind: "Control", text: `${name} ${on ? "resumed" : "paused"}`, agentId: id });
    toast.success(`${name} ${on ? "resumed" : "paused"} (preview)`);
  };
  const sel = (v: string, set: (v: string) => void, label: string, opts: string[]) => (
    <Select value={v} onValueChange={set}><SelectTrigger className="h-9 w-[160px]" aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="all">All {label.toLowerCase()}</SelectItem>{opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
  );

  return (
    <PageShell>
      <section>
        <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Bot className="h-3.5 w-3.5" /> Founder AI · Operations</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Operations Agents</h1>
        <p className="mt-1 text-sm text-muted-foreground">Specialized AI agents coordinated by Founder AI to support authorized operational workflows.</p>
        <div className="mt-2"><PreviewNotice /></div>
      </section>

      <div className="flex flex-wrap gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search agents..." aria-label="Search agents" className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0" />
        </div>
        {sel(cat, setCat, "Categories", CATEGORIES)}
        {sel(st, setSt, "Statuses", STATUSES)}
        {sel(cap, setCap, "Capabilities", Object.keys(CAPABILITIES))}
        {sel(risk, setRisk, "Risk levels", ["LOW", "MEDIUM", "HIGH", "CRITICAL"])}
        <Select value="founder" onValueChange={() => undefined}><SelectTrigger className="h-9 w-[130px]" aria-label="Owner"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="founder">Owner: Founder</SelectItem></SelectContent></Select>
        <Button variant="outline" size="sm" className="h-9" onClick={() => toast.info("Live agent status needs the execution backend — showing policy catalog.")}><RefreshCw className="mr-1 h-3.5 w-3.5" />Refresh</Button>
      </div>

      <details className="bento-card p-4 text-xs text-muted-foreground">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">Risk tiers explained</summary>
        <ul className="mt-2 grid gap-2 sm:grid-cols-4">{(Object.keys(RISK_TIER_INFO) as RiskTier[]).map((t) => <li key={t} className="space-y-1"><SeverityBadge level={t} /><p>{RISK_TIER_INFO[t]}</p></li>)}</ul>
      </details>

      {list.length === 0 ? <p className="bento-card p-8 text-center text-sm text-muted-foreground">No agents match these filters.</p> : CATEGORIES.filter((c) => list.some((a) => a.category === c)).map((c) => (
        <section key={c} aria-label={c}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {list.filter((a) => a.category === c).map((a) => {
              const status = agentStatus(a, s.tasks, s.paused, s.killSwitch);
              const mine = s.tasks.filter((t) => t.agentId === a.id);
              const open = mine.filter((t) => t.status !== "Completed" && t.status !== "Cancelled").length;
              const last = s.events.find((e) => e.agentId === a.id);
              return (
                <article key={a.id} className="bento-card flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div><Link to="/ai-ceo/agents/$agentId" params={{ agentId: a.id }} className="font-semibold hover:underline">{a.name}</Link><p className="text-[11px] text-muted-foreground">{a.category}</p></div>
                    <div className="flex flex-col items-end gap-1"><Pill value={status} /><SeverityBadge level={a.risk} /></div>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.purpose}</p>
                  <div className="flex flex-wrap gap-1">{a.capabilities.slice(0, 4).map((c2) => <span key={c2} className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px]">{c2}</span>)}{a.capabilities.length > 4 && <span className="text-[10px] text-muted-foreground">+{a.capabilities.length - 4}</span>}</div>
                  <p className="text-[11px] text-muted-foreground">Workload: {open} open preview task{open === 1 ? "" : "s"} · Last activity: {last ? last.text : "none recorded"}</p>
                  <div className="mt-auto flex flex-wrap gap-1.5">
                    <Button asChild size="sm" variant="outline"><Link to="/ai-ceo/agents/$agentId" params={{ agentId: a.id }}>Open</Link></Button>
                    <Button size="sm" variant="outline" onClick={() => setAssign(a.id)}>Assign Task</Button>
                    <Button asChild size="sm" variant="ghost"><Link to="/ai-ceo/activity" search={{ agent: a.id }}>Activity</Link></Button>
                    <Button size="sm" variant="ghost" onClick={() => togglePause(a.id, a.name)}>{s.paused.includes(a.id) ? "Resume" : "Pause"}</Button>
                    <Button asChild size="sm" variant="ghost"><Link to="/ai-ceo/agents/$agentId" params={{ agentId: a.id }} hash="permissions">Configure</Link></Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
      {assign && <AssignTaskDialog open onOpenChange={(o) => !o && setAssign(null)} agentId={assign} />}
    </PageShell>
  );
}
