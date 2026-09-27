import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DetailSection } from "@/components/ai-ceo/governance/shared";
import { AGENTS, agentById } from "@/components/ai-ceo/ops/catalog";
import { usePlan } from "./orchestration-store";
import { approveWorkerTask, cancelWorkerTask, createWorkerTask, listWorkerTasks, runWorkerTask, verifyWorkerTask } from "@/lib/worker.functions";

const TONE: Record<string, string> = { waiting_approval: "bg-warning/15 text-warning", approved: "bg-primary/15 text-primary", running: "bg-primary/15 text-primary", completed: "bg-accent text-foreground", verified: "bg-success/15 text-success", failed: "bg-destructive/15 text-destructive", rejected: "bg-destructive/15 text-destructive", cancelled: "bg-muted text-muted-foreground", queued: "bg-muted text-muted-foreground" };
const LBL: Record<string, string> = { waiting_approval: "Waiting approval", approved: "Approved", running: "Running", completed: "Awaiting verification", verified: "Verified", failed: "Failed", rejected: "Rejected", cancelled: "Cancelled", queued: "Queued" };
const when = (s: string) => new Date(s).toLocaleString();

function useSignedIn() {
  const [s, set] = useState<"loading" | "in" | "out">("loading");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => set(data.user ? "in" : "out"));
    const { data } = supabase.auth.onAuthStateChange((_e, sess) => set(sess ? "in" : "out"));
    return () => data.subscription.unsubscribe();
  }, []);
  return s;
}

export function WorkerBackend() {
  const auth = useSignedIn();
  if (auth === "loading") return <DetailSection title="Live worker runs"><p className="text-sm text-muted-foreground">Checking sign-in…</p></DetailSection>;
  if (auth === "out") return <DetailSection title="Live worker runs"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Sign in to approve, run and verify real worker tasks. Everything is saved with a full audit history.</p><Button asChild size="sm"><Link to="/auth" search={{ redirect: "/ai-ceo/morning/execution" }}>Sign in to run</Link></Button></div></DetailSection>;
  return <Board />;
}

function Board() {
  const qc = useQueryClient();
  const list = useServerFn(listWorkerTasks);
  const q = useQuery({ queryKey: ["worker-tasks"], queryFn: () => list(), refetchInterval: 5000 });
  const done = () => qc.invalidateQueries({ queryKey: ["worker-tasks"] });
  const onErr = (e: Error) => toast.error(e.message);
  const create = useServerFn(createWorkerTask), approve = useServerFn(approveWorkerTask), run = useServerFn(runWorkerTask), verify = useServerFn(verifyWorkerTask), cancel = useServerFn(cancelWorkerTask);
  const mCreate = useMutation({ mutationFn: create, onSuccess: () => { toast.success("Task sent for your approval"); setTitle(""); setIns(""); done(); }, onError: onErr });
  const mApprove = useMutation({ mutationFn: approve, onSuccess: done, onError: onErr });
  const mRun = useMutation({ mutationFn: run, onSuccess: (r) => { r.ok ? toast.success("Worker finished — review and verify") : toast.error(`Run failed: ${r.error}`); done(); }, onError: (e: Error) => { onErr(e); done(); } });
  const mVerify = useMutation({ mutationFn: verify, onSuccess: done, onError: onErr });
  const mCancel = useMutation({ mutationFn: cancel, onSuccess: done, onError: onErr });
  const [title, setTitle] = useState(""); const [ins, setIns] = useState(""); const [agent, setAgent] = useState(AGENTS[0]?.id ?? ""); const [prio, setPrio] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [plan] = usePlan();
  const [open, setOpen] = useState<string | null>(null);

  const d = q.data;
  const counts = (d?.tasks ?? []).reduce<Record<string, number>>((a, t) => ({ ...a, [t.status]: (a[t.status] ?? 0) + 1 }), {});

  return <DetailSection title="Live worker runs">
    <p className="mb-3 text-xs text-muted-foreground">Saved records. Workers produce analysis and recommendations from your company data using AI; they do not send emails or change outside systems.</p>
    <div className="mb-4 flex flex-wrap gap-2 text-xs">{Object.entries(LBL).filter(([k]) => counts[k]).map(([k, l]) => <span key={k} className={`rounded-full px-2 py-0.5 ${TONE[k]}`}>{l}: {counts[k]}</span>)}</div>

    <form className="mb-4 grid gap-2 rounded-lg border p-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); mCreate.mutate({ data: { title, instructions: ins, agentId: agent, priority: prio, source: "Live Execution" } }); }}>
      <Input placeholder="Task title, e.g. Review payment-risk escalation" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} />
      <div className="flex gap-2">
        <Select value={agent} onValueChange={setAgent}><SelectTrigger className="flex-1"><SelectValue /></SelectTrigger><SelectContent>{AGENTS.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select>
        <Select value={prio} onValueChange={(v) => setPrio(v as typeof prio)}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent>{(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
      </div>
      <Textarea className="sm:col-span-2" placeholder="Instructions for the worker (optional)" value={ins} onChange={(e) => setIns(e.target.value)} />
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={mCreate.isPending}>Create task</Button>
        {plan.tasks.length > 0 && <Button type="button" size="sm" variant="outline" disabled={mCreate.isPending} onClick={() => plan.tasks.forEach((t) => mCreate.mutate({ data: { title: t.title, instructions: t.requirement, agentId: t.agentId ?? agent, priority: t.priority, source: "Morning work plan" } }))}>Send {plan.tasks.length} plan tasks</Button>}
      </div>
    </form>

    {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
    {q.error && <p className="text-sm text-destructive">Couldn't load tasks: {(q.error as Error).message}</p>}
    {d && d.tasks.length === 0 && <p className="text-sm text-muted-foreground">No worker tasks yet. Create one above.</p>}
    <div className="space-y-2">{d?.tasks.map((t) => {
      const ev = d.evidence.filter((e) => e.task_id === t.id); const au = d.audit.filter((a) => a.task_id === t.id); const ver = d.verifications.filter((v) => v.task_id === t.id); const runs = d.runs.filter((r) => r.task_id === t.id);
      const busy = (m: { isPending: boolean; variables?: { data: { taskId?: string } } }) => m.isPending && m.variables?.data.taskId === t.id;
      return <div key={t.id} className="rounded-lg border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><p className="font-medium">{t.title}</p><p className="text-xs text-muted-foreground">{agentById(t.agent_id)?.name ?? t.agent_id} · {t.priority} · {t.source} · attempts {t.attempts}</p></div>
          <span className={`rounded-full px-2 py-0.5 text-xs ${TONE[t.status]}`}>{busy(mRun) ? "Running…" : LBL[t.status]}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {t.status === "waiting_approval" && <Button size="sm" disabled={busy(mApprove)} onClick={() => mApprove.mutate({ data: { taskId: t.id } })}>Approve</Button>}
          {(t.status === "approved" || t.status === "failed" || t.status === "rejected") && <Button size="sm" disabled={busy(mRun)} onClick={() => mRun.mutate({ data: { taskId: t.id } })}>{t.status === "approved" ? "Run" : "Retry"}</Button>}
          {t.status === "completed" && <>
            <Input className="h-8 w-64" placeholder="Verification note (required to reject)" value={notes[t.id] ?? ""} onChange={(e) => setNotes({ ...notes, [t.id]: e.target.value })} />
            <Button size="sm" disabled={mVerify.isPending} onClick={() => mVerify.mutate({ data: { taskId: t.id, verdict: "verified", note: notes[t.id] ?? "" } })}>Verify</Button>
            <Button size="sm" variant="outline" disabled={mVerify.isPending} onClick={() => mVerify.mutate({ data: { taskId: t.id, verdict: "rejected", note: notes[t.id] ?? "" } })}>Reject</Button>
          </>}
          {["waiting_approval", "approved", "failed", "rejected"].includes(t.status) && <Button size="sm" variant="ghost" onClick={() => mCancel.mutate({ data: { taskId: t.id } })}>Cancel</Button>}
          <Button size="sm" variant="ghost" onClick={() => setOpen(open === t.id ? null : t.id)}>{open === t.id ? "Hide" : "Evidence & history"} ({ev.length})</Button>
        </div>
        {runs[0]?.error && <p className="mt-2 text-xs text-destructive">Last run failed: {runs[0].error}. Retry, or cancel the task.</p>}
        {open === t.id && <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="space-y-2"><p className="text-xs font-semibold">Evidence</p>{ev.length === 0 && <p className="text-xs text-muted-foreground">None yet.</p>}{ev.map((e) => <details key={e.id} open={e.kind === "output"} className="rounded border p-2"><summary className="cursor-pointer text-xs font-medium">{e.title} · {when(e.created_at)}</summary><pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap text-xs">{e.content}</pre></details>)}</div>
          <div className="space-y-2"><p className="text-xs font-semibold">Verification</p>{ver.length === 0 ? <p className="text-xs text-muted-foreground">Not verified yet.</p> : ver.map((v) => <p key={v.id} className="text-xs">{v.verdict} · {when(v.created_at)}{v.note ? ` — ${v.note}` : ""}</p>)}
            <p className="pt-2 text-xs font-semibold">Audit history</p><ol className="space-y-1">{au.map((a) => <li key={a.id} className="text-xs text-muted-foreground">{when(a.created_at)} · {a.actor_label} · {a.action}{a.to_status ? ` → ${LBL[a.to_status] ?? a.to_status}` : ""}</li>)}</ol></div>
        </div>}
      </div>;
    })}</div>
  </DetailSection>;
}
