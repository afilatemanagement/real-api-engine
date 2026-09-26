import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Item = z.object({
  title: z.string().max(300),
  description: z.string().max(2000).optional().default(""),
  confidence: z.number().min(0).max(100).optional(),
  impact: z.string().max(40).optional(),
  impactArea: z.string().max(120).optional(),
  status: z.string().max(40).optional(),
});
const Body = z.object({
  suggestions: z.array(Item).max(50),
  approvals: z.array(Item).max(50),
});

const SYSTEM = `You are the AI CEO advisor for Software Vala. From the live suggestions and approval queue provided, pick the 3-5 highest-priority decisions for the CEO.
Rank by business impact, risk, urgency and confidence. For each output:
### <n>. <decision title>
**Recommend:** Approve | Review | Reject — **Priority:** High | Medium | Low
<one or two sentence rationale citing the given figures>
Finish with one line "**Bottom line:**" summary. Use only the data given; never invent figures. Keep the whole answer under 250 words.`;

const requestWindows = new Map<string, { count: number; resetAt: number }>();

export const Route = createFileRoute("/api/ceo-brief")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        if (origin && origin !== new URL(request.url).origin) {
          return Response.json({ error: "Request origin is not allowed." }, { status: 403 });
        }
        const client = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
        const now = Date.now();
        const window = requestWindows.get(client);
        if (window && window.resetAt > now && window.count >= 10) {
          return Response.json({ error: "Too many requests — please wait a minute and try again." }, { status: 429 });
        }
        requestWindows.set(client, window && window.resetAt > now ? { ...window, count: window.count + 1 } : { count: 1, resetAt: now + 60_000 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "AI is not configured." }, { status: 500 });
        let body: z.infer<typeof Body>;
        try {
          body = Body.parse(await request.json());
        } catch {
          return Response.json({ error: "Invalid input: provide suggestions and approvals lists." }, { status: 400 });
        }
        if (!body.suggestions.length && !body.approvals.length)
          return Response.json({ error: "Add at least one suggestion or approval." }, { status: 400 });

        const runId = request.headers.get("X-Lovable-AIG-Run-ID");
        try {
          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
            method: "POST",
            signal: request.signal,
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": apiKey,
              "X-Lovable-AIG-SDK": "fetch",
              ...(runId ? { "X-Lovable-AIG-Run-ID": runId } : {}),
            },
            body: JSON.stringify({
              model: "openai/gpt-6-astra",
              stream: true,
              store: false,
              reasoning: { effort: "low", summary: "auto" },
              include: ["reasoning.encrypted_content"],
              input: [
                { role: "system", content: SYSTEM },
                { role: "user", content: JSON.stringify(body) },
              ],
            }),
          });
          if (!upstream.ok) {
            const text = await upstream.text();
            console.error(`AI gateway failed [${upstream.status}]: ${text}`);
            let message = "AI summary failed.";
            if (upstream.status === 429) message = "Too many requests — please wait a moment and try again.";
            else if (upstream.status === 402) message = "AI credits are used up. Add credits to continue.";
            else {
              try { message = JSON.parse(text)?.error?.message ?? JSON.parse(text)?.message ?? message; } catch { /* keep */ }
            }
            return Response.json({ error: message }, { status: upstream.status });
          }
          const headers = new Headers({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform" });
          upstream.headers.forEach((v, k) => { if (k.toLowerCase().startsWith("x-lovable-aig-")) headers.set(k, v); });
          return new Response(upstream.body, { status: 200, headers });
        } catch (error) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          throw error;
        }
      },
    },
  },
});
