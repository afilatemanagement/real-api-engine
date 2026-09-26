import { useEffect, useRef, useState } from "react";
import { Sparkles, Square, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CEOSuggestion } from "@/lib/ceo-types";

const toItem = (s: CEOSuggestion) => ({
  title: s.title,
  description: s.description,
  confidence: s.confidence,
  impact: s.impact,
  impactArea: s.impactArea,
  status: s.status,
});

// Light markdown: headings, bold, paragraphs
function renderLine(line: string, i: number) {
  const parts = line.replace(/^###\s*/, "").split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={j} className="text-foreground">{p.slice(2, -2)}</strong> : p,
  );
  if (line.startsWith("###")) return <h4 key={i} className="mt-3 font-semibold text-foreground">{parts}</h4>;
  if (!line.trim()) return null;
  return <p key={i} className="text-sm text-muted-foreground">{parts}</p>;
}

export function DecisionBrief({ suggestions }: { suggestions: CEOSuggestion[] }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fillLive = () => {
    const live = suggestions.filter((s) => s.status === "pending");
    const queue = suggestions.filter((s) => s.status === "reviewed");
    setInput(JSON.stringify({ suggestions: live.map(toItem), approvals: queue.map(toItem) }, null, 2));
  };

  useEffect(() => {
    if (!input && suggestions.length) fillLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions.length]);

  const run = async () => {
    setError(null);
    let payload: unknown;
    try {
      payload = JSON.parse(input);
    } catch {
      setError("Data must be valid JSON with \"suggestions\" and \"approvals\" lists.");
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setOutput("");
    setLoading(true);
    setThinking(true);
    try {
      const res = await fetch("/api/ceo-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const frames = buf.split("\n\n");
        buf = frames.pop() ?? "";
        for (const f of frames) {
          const data = f.split("\n").find((l) => l.startsWith("data:"))?.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const ev = JSON.parse(data);
            if (ev.type === "response.output_text.delta") {
              setThinking(false);
              setOutput((o) => o + ev.delta);
            } else if (ev.type === "response.failed" || ev.type === "error") {
              throw new Error(ev.response?.error?.message ?? ev.message ?? "AI summary failed.");
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setError((e as Error).message);
    } finally {
      setLoading(false);
      setThinking(false);
      abortRef.current = null;
    }
  };

  return (
    <Card className="card3d premium-halo enter-soft rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-glow" />
          AI Decision Brief
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={fillLive} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-1" /> Use live data
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2 min-w-0">
        <div className="space-y-2 min-w-0">
          <p className="text-xs text-muted-foreground">Suggestions and approval queue (edit or paste your own)</p>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="h-64 font-mono text-xs"
            aria-label="Suggestions and approval queue data"
          />
          {loading ? (
            <Button variant="outline" onClick={() => abortRef.current?.abort()} className="w-full">
              <Square className="w-4 h-4 mr-2" /> Stop
            </Button>
          ) : (
            <Button onClick={run} className="w-full" disabled={!input.trim()}>
              <Sparkles className="w-4 h-4 mr-2" /> Summarize top decisions
            </Button>
          )}
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 h-[19.5rem] overflow-auto min-w-0">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!error && thinking && <p className="text-sm text-muted-foreground animate-pulse">Analyzing priorities…</p>}
          {!error && !thinking && !output && (
            <p className="text-sm text-muted-foreground">Your prioritized decisions with rationale will appear here.</p>
          )}
          {output && <div className="space-y-1">{output.split("\n").map(renderLine)}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
