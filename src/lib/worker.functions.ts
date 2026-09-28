import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Status = "queued" | "waiting_approval" | "approved" | "running" | "completed" | "failed" | "verified" | "rejected" | "cancelled";

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}
function label(claims: Record<string, unknown>) {
  return typeof claims["email"] === "string" ? (claims["email"] as string) : "Founder";
}
async function audit(db: Awaited<ReturnType<typeof admin>>, a: { task_id: string; actor_id: string | null; actor_label: string; action: string; from_status?: string | null; to_status?: string | null; detail?: Record<string, string | number | null> }) {
  const { error } = await db.from("worker_audit_log").insert({ ...a, detail: a.detail ?? {} });
  if (error) console.error("audit insert failed", error);
}
async function transition(taskId: string, allowed: Status[], to: Status, patch: Record<string, unknown> = {}) {
  const db = await admin();
  const { data: task, error } = await db.from("worker_tasks").select("*").eq("id", taskId).single();
  if (error || !task) throw new Error("Task not found");
  if (!allowed.includes(task.status as Status)) throw new Error(`Task is ${task.status}; this step is not allowed now`);
  const { data: upd, error: e2 } = await db.from("worker_tasks").update({ status: to, ...patch }).eq("id", taskId).eq("status", task.status).select().single();
  if (e2 || !upd) throw new Error("Task changed at the same time; refresh and try again");
  return { db, task, upd };
}

export const listWorkerTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const [t, r, e, v, a] = await Promise.all([
      sb.from("worker_tasks").select("*").order("created_at", { ascending: false }).limit(50),
      sb.from("worker_runs").select("*").order("started_at", { ascending: false }).limit(200),
      sb.from("task_evidence").select("*").order("created_at", { ascending: true }).limit(400),
      sb.from("task_verifications").select("*").order("created_at", { ascending: false }).limit(200),
      sb.from("worker_audit_log").select("*").order("created_at", { ascending: false }).limit(300),
    ]);
    const err = t.error ?? r.error ?? e.error ?? v.error ?? a.error;
    if (err) throw new Error(err.message);
    return { tasks: t.data, runs: r.data, evidence: e.data, verifications: v.data, audit: a.data };
  });

export const createWorkerTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    title: z.string().trim().min(3).max(200),
    instructions: z.string().trim().max(4000).default(""),
    agentId: z.string().trim().min(1).max(80).optional(),
    workerId: z.string().uuid().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    source: z.string().trim().max(80).default("Live Execution"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    let agentId = data.agentId ?? "";
    let workerName: string | null = null;
    if (data.workerId) {
      const { data: w } = await db.from("worker_profiles").select("*").eq("id", data.workerId).single();
      if (!w) throw new Error("Worker not found");
      if (!w.active) throw new Error(`${w.name} is switched off`);
      agentId = w.kind === "ai" ? (w.agent_id as string) : `human:${w.id}`;
      workerName = w.name;
    }
    if (!agentId) throw new Error("Pick a worker");
    // only risky work waits for Founder approval; the rest starts as soon as it is assigned
    const { agentById } = await import("@/components/ai-ceo/ops/catalog");
    const agentRisk = agentById(agentId)?.risk;
    const risky = data.priority === "HIGH" || data.priority === "CRITICAL" || agentRisk === "HIGH" || agentRisk === "CRITICAL";
    const status: Status = risky ? "waiting_approval" : "approved";
    const { data: row, error } = await db.from("worker_tasks").insert({
      title: data.title, instructions: data.instructions, agent_id: agentId, worker_id: data.workerId ?? null, priority: data.priority,
      source: data.source, requires_approval: risky, status, created_by: context.userId,
    }).select().single();
    if (error || !row) throw new Error(error?.message ?? "Could not create task");
    await audit(db, { task_id: row.id, actor_id: context.userId, actor_label: label(context.claims), action: workerName ? `assigned to ${workerName}` : "created", to_status: status, detail: { risky: risky ? "yes" : "no" } });
    return row;
  });

export const approveWorkerTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ taskId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { db, task } = await transition(data.taskId, ["waiting_approval", "queued"], "approved", { approved_by: context.userId, approved_at: new Date().toISOString() });
    await audit(db, { task_id: data.taskId, actor_id: context.userId, actor_label: label(context.claims), action: "approved", from_status: task.status, to_status: "approved" });
    return { ok: true };
  });

export const cancelWorkerTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ taskId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { db, task } = await transition(data.taskId, ["queued", "waiting_approval", "approved", "failed", "rejected"], "cancelled");
    await audit(db, { task_id: data.taskId, actor_id: context.userId, actor_label: label(context.claims), action: "cancelled", from_status: task.status, to_status: "cancelled" });
    return { ok: true };
  });

const MODEL = "openai/gpt-6-astra";

export const runWorkerTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ taskId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const who = label(context.claims);
    // failed / rejected tasks may be retried; they keep their earlier approval
    const { db, task, upd } = await transition(data.taskId, ["approved", "failed", "rejected"], "running");
    const revert = async (msg: string) => { await db.from("worker_tasks").update({ status: task.status }).eq("id", task.id); throw new Error(msg); };
    if (task.requires_approval && !upd.approved_by) await revert("Task has no Founder approval");
    let worker: { id: string; kind: string; name: string; max_concurrent: number; active: boolean } | null = null;
    if (task.worker_id) {
      const { data: w } = await db.from("worker_profiles").select("id, kind, name, max_concurrent, active").eq("id", task.worker_id).single();
      if (!w) await revert("Assigned worker no longer exists");
      worker = w!;
      if (!worker.active) await revert(`${worker.name} is switched off`);
      const { count } = await db.from("worker_tasks").select("id", { count: "exact", head: true }).eq("worker_id", worker.id).eq("status", "running").neq("id", task.id);
      if ((count ?? 0) >= worker.max_concurrent) await revert(`${worker.name} is at capacity (${worker.max_concurrent} running)`);
    }
    const human = worker?.kind === "human";
    await db.from("worker_tasks").update({ attempts: task.attempts + 1 }).eq("id", task.id);
    const { data: run, error: re } = await db.from("worker_runs").insert({ task_id: task.id, status: "running", model: human ? "human" : MODEL, started_by: context.userId }).select().single();
    if (re || !run) throw new Error("Could not start run");
    await audit(db, { task_id: task.id, actor_id: context.userId, actor_label: who, action: human ? `handed to ${worker!.name}` : "run_started", from_status: task.status, to_status: "running", detail: { run_id: run.id, attempt: task.attempts + 1 } });
    if (human) return { ok: true as const, human: true };

    const { loadCompanyContext } = await import("./worker-context.server");
    const ctx = await loadCompanyContext();
    await db.from("task_evidence").insert({ task_id: task.id, run_id: run.id, kind: "input_context", title: `Company data used (${ctx.source})`, content: ctx.text });

    const fail = async (msg: string) => {
      await db.from("worker_runs").update({ status: "failed", error: msg, finished_at: new Date().toISOString() }).eq("id", run.id);
      await db.from("worker_tasks").update({ status: "failed" }).eq("id", task.id);
      await audit(db, { task_id: task.id, actor_id: null, actor_label: worker?.name ?? `Worker ${task.agent_id}`, action: "run_failed", from_status: "running", to_status: "failed", detail: { run_id: run.id, error: msg } });
      return { ok: false as const, error: msg };
    };

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return fail("AI is not configured");
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
        body: JSON.stringify({
          model: MODEL, stream: true, store: false, reasoning: { effort: "low" },
          input: [
            { role: "system", content: `You are the "${worker?.name ?? task.agent_id}" operations worker for Software Vala's Founder AI. Carry out the assigned operational task using ONLY the company data provided. Never invent numbers; if data is missing, say so. Output markdown with sections: ## Result, ## Evidence used (cite record titles), ## Risks & open questions, ## Suggested next step. Under 350 words. You cannot take external actions; you produce analysis and a recommended action only.` },
            { role: "user", content: `TASK: ${task.title}\nPRIORITY: ${task.priority}\nINSTRUCTIONS: ${task.instructions || "(none)"}\n\nCOMPANY DATA:\n${ctx.text}` },
          ],
        }),
      });
      if (!res.ok) {
        const t = await res.text(); console.error("worker AI failed", res.status, t);
        return fail(res.status === 402 ? "AI credits are used up" : res.status === 429 ? "AI rate limit reached — retry shortly" : `AI request failed (${res.status})`);
      }
      let text = "";
      const reader = res.body!.getReader(); const dec = new TextDecoder(); let buf = "";
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let k; while ((k = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, k).trim(); buf = buf.slice(k + 1);
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim(); if (payload === "[DONE]") continue;
          try { const ev = JSON.parse(payload) as { type?: string; delta?: string }; if (ev.type === "response.output_text.delta" && ev.delta) text += ev.delta; } catch { /* partial */ }
        }
      }
      text = text.trim();
      if (!text) return fail("Worker returned an empty result");
      await db.from("task_evidence").insert({ task_id: task.id, run_id: run.id, kind: "output", title: "Worker result", content: text });
      await db.from("worker_runs").update({ status: "completed", finished_at: new Date().toISOString() }).eq("id", run.id);
      await db.from("worker_tasks").update({ status: "completed" }).eq("id", task.id);
      await audit(db, { task_id: task.id, actor_id: null, actor_label: worker?.name ?? `Worker ${task.agent_id}`, action: "run_completed", from_status: "running", to_status: "completed", detail: { run_id: run.id } });
      return { ok: true as const, human: false };
    } catch (e) {
      console.error(e);
      return fail("Worker could not reach the AI service");
    }
  });

export const verifyWorkerTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ taskId: z.string().uuid(), verdict: z.enum(["verified", "rejected"]), note: z.string().trim().max(2000).default("") }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.verdict === "rejected" && !data.note) throw new Error("Add a note explaining the rejection");
    const { db, task } = await transition(data.taskId, ["completed"], data.verdict);
    const { data: run } = await db.from("worker_runs").select("id").eq("task_id", task.id).order("started_at", { ascending: false }).limit(1).maybeSingle();
    await db.from("task_verifications").insert({ task_id: task.id, run_id: run?.id ?? null, verdict: data.verdict, note: data.note, verified_by: context.userId });
    if (data.note) await db.from("task_evidence").insert({ task_id: task.id, run_id: run?.id ?? null, kind: "note", title: `Founder ${data.verdict} note`, content: data.note });
    await audit(db, { task_id: task.id, actor_id: context.userId, actor_label: label(context.claims), action: data.verdict, from_status: "completed", to_status: data.verdict, detail: { run_id: run?.id ?? null } });
    return { ok: true };
  });

// ---------- Worker profiles ----------
export const listWorkerProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("worker_profiles").select("*").order("created_at");
    if (error) throw new Error(error.message);
    return { workers: data, me: context.userId };
  });

export const createAiWorker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ agentId: z.string().min(1).max(80), name: z.string().trim().min(2).max(80), maxConcurrent: z.number().int().min(1).max(20) }).parse(d))
  .handler(async ({ data, context }) => {
    const { agentById } = await import("@/components/ai-ceo/ops/catalog");
    const a = agentById(data.agentId);
    if (!a) throw new Error("Unknown worker role");
    const db = await admin();
    const { data: row, error } = await db.from("worker_profiles").insert({ kind: "ai", name: data.name, role: a.name, agent_id: a.id, skills: a.capabilities, max_concurrent: data.maxConcurrent, created_by: context.userId }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const joinAsHumanWorker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ name: z.string().trim().min(2).max(80), role: z.string().trim().max(80).default(""), skills: z.array(z.string().trim().min(1).max(60)).max(20).default([]), maxConcurrent: z.number().int().min(1).max(20).default(3) }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    const { data: row, error } = await db.from("worker_profiles").upsert({ kind: "human", name: data.name, role: data.role, skills: data.skills, max_concurrent: data.maxConcurrent, user_id: context.userId, email: label(context.claims), created_by: context.userId }, { onConflict: "user_id" }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const setWorkerActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    const { data: w } = await db.from("worker_profiles").select("created_by, user_id").eq("id", data.id).single();
    if (!w) throw new Error("Worker not found");
    if (w.created_by !== context.userId && w.user_id !== context.userId) throw new Error("Only the worker or the person who added them can change this");
    const { error } = await db.from("worker_profiles").update({ active: data.active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitWorkerResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ taskId: z.string().uuid(), result: z.string().trim().min(5).max(8000) }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    const { data: task } = await db.from("worker_tasks").select("*").eq("id", data.taskId).single();
    if (!task || !task.worker_id) throw new Error("Task not found");
    const { data: w } = await db.from("worker_profiles").select("*").eq("id", task.worker_id).single();
    if (!w || w.kind !== "human" || w.user_id !== context.userId) throw new Error("Only the assigned person can submit this result");
    const { upd } = await transition(task.id, ["running"], "completed");
    const { data: run } = await db.from("worker_runs").select("id").eq("task_id", task.id).eq("status", "running").order("started_at", { ascending: false }).limit(1).maybeSingle();
    await db.from("task_evidence").insert({ task_id: task.id, run_id: run?.id ?? null, kind: "output", title: `Result from ${w.name}`, content: data.result });
    if (run) await db.from("worker_runs").update({ status: "completed", finished_at: new Date().toISOString() }).eq("id", run.id);
    await audit(db, { task_id: task.id, actor_id: context.userId, actor_label: w.name, action: "result_submitted", from_status: "running", to_status: upd.status, detail: { run_id: run?.id ?? null } });
    return { ok: true };
  });
