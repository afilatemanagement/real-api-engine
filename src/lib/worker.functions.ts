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
    agentId: z.string().trim().min(1).max(80),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    source: z.string().trim().max(80).default("Live Execution"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    const status: Status = "waiting_approval"; // every worker task needs Founder approval before it runs
    const { data: row, error } = await db.from("worker_tasks").insert({
      title: data.title, instructions: data.instructions, agent_id: data.agentId, priority: data.priority,
      source: data.source, requires_approval: true, status, created_by: context.userId,
    }).select().single();
    if (error || !row) throw new Error(error?.message ?? "Could not create task");
    await audit(db, { task_id: row.id, actor_id: context.userId, actor_label: label(context.claims), action: "created", to_status: status });
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
    if (!upd.approved_by) {
      await db.from("worker_tasks").update({ status: task.status }).eq("id", task.id);
      throw new Error("Task has no Founder approval");
    }
    await db.from("worker_tasks").update({ attempts: task.attempts + 1 }).eq("id", task.id);
    const { data: run, error: re } = await db.from("worker_runs").insert({ task_id: task.id, status: "running", model: MODEL, started_by: context.userId }).select().single();
    if (re || !run) throw new Error("Could not start run");
    await audit(db, { task_id: task.id, actor_id: context.userId, actor_label: who, action: "run_started", from_status: task.status, to_status: "running", detail: { run_id: run.id, attempt: task.attempts + 1 } });

    const { loadCompanyContext } = await import("./worker-context.server");
    const ctx = await loadCompanyContext();
    await db.from("task_evidence").insert({ task_id: task.id, run_id: run.id, kind: "input_context", title: `Company data used (${ctx.source})`, content: ctx.text });

    const fail = async (msg: string) => {
      await db.from("worker_runs").update({ status: "failed", error: msg, finished_at: new Date().toISOString() }).eq("id", run.id);
      await db.from("worker_tasks").update({ status: "failed" }).eq("id", task.id);
      await audit(db, { task_id: task.id, actor_id: null, actor_label: `Worker ${task.agent_id}`, action: "run_failed", from_status: "running", to_status: "failed", detail: { run_id: run.id, error: msg } });
      return { ok: false as const, error: msg };
    };

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return fail("AI is not configured");
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
        body: JSON.stringify({
          model: MODEL, store: false, reasoning: { effort: "low" },
          input: [
            { role: "system", content: `You are the "${task.agent_id}" operations worker for Software Vala's Founder AI. Carry out the assigned operational task using ONLY the company data provided. Never invent numbers; if data is missing, say so. Output markdown with sections: ## Result, ## Evidence used (cite record titles), ## Risks & open questions, ## Suggested next step. Under 350 words. You cannot take external actions; you produce analysis and a recommended action only.` },
            { role: "user", content: `TASK: ${task.title}\nPRIORITY: ${task.priority}\nINSTRUCTIONS: ${task.instructions || "(none)"}\n\nCOMPANY DATA:\n${ctx.text}` },
          ],
        }),
      });
      if (!res.ok) {
        const t = await res.text(); console.error("worker AI failed", res.status, t);
        return fail(res.status === 402 ? "AI credits are used up" : res.status === 429 ? "AI rate limit reached — retry shortly" : `AI request failed (${res.status})`);
      }
      const json = (await res.json()) as { output_text?: string; output?: { type: string; content?: { type: string; text?: string }[] }[] };
      const text = json.output_text ?? (json.output ?? []).filter((o) => o.type === "message").flatMap((o) => o.content ?? []).map((c) => c.text ?? "").join("\n").trim();
      if (!text) return fail("Worker returned an empty result");
      await db.from("task_evidence").insert({ task_id: task.id, run_id: run.id, kind: "output", title: "Worker result", content: text });
      await db.from("worker_runs").update({ status: "completed", finished_at: new Date().toISOString() }).eq("id", run.id);
      await db.from("worker_tasks").update({ status: "completed" }).eq("id", task.id);
      await audit(db, { task_id: task.id, actor_id: null, actor_label: `Worker ${task.agent_id}`, action: "run_completed", from_status: "running", to_status: "completed", detail: { run_id: run.id } });
      return { ok: true as const };
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
