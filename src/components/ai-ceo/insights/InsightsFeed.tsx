import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, FlaskConical, Lightbulb, RefreshCw, Search, X } from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardSkeleton } from "@/components/feedback/Skeletons";
import { useCEOData } from "@/hooks/useCEOData";
import { dataSourceStatus } from "@/components/ai-ceo/DataSourceStatus";
import { SeverityBadge } from "@/components/ai-ceo/governance/shared";
import { useSessionMap } from "@/components/ai-ceo/governance/state";
import { Confidence, KindChip, insightView } from "./shared";

export const INSIGHT_STATE_KEY = "sv:founder:insight-state";
export type InsightState = "watch" | "dismissed";

export function InsightsFeed() {
  const { data, isPersisted, isLoading } = useCEOData();
  const [state, setState] = useSessionMap<InsightState | "">(INSIGHT_STATE_KEY);
  const [q, setQ] = useState("");
  const [horizon, setHorizon] = useState("all");
  const [kind, setKind] = useState("all");
  const [conf, setConf] = useState("all");
  const [showDismissed, setShowDismissed] = useState(false);

  const all = data.predictions.map((p) => ({ p, v: insightView(p) }));
  const feed = all
    .filter(({ p }) => showDismissed || state[p.id] !== "dismissed")
    .filter(({ p }) => !q || `${p.title} ${p.detail}`.toLowerCase().includes(q.toLowerCase()))
    .filter(({ p }) => horizon === "all" || p.timeline === horizon)
    .filter(({ v }) => kind === "all" || v.kind === kind)
    .filter(({ p }) => conf === "all" || (conf === "high" ? p.confidence >= 80 : p.confidence < 80));
  const horizons = [...new Set(data.predictions.map((p) => p.timeline))];
  const summary = [
    { label: "Emerging Risks", n: all.filter((x) => x.v.kind === "Risk").length, desc: "Signals trending the wrong way", set: () => setKind("Risk") },
    { label: "Emerging Opportunities", n: all.filter((x) => x.v.kind === "Opportunity").length, desc: "Upside worth acting on", set: () => setKind("Opportunity") },
    { label: "Anomalies", n: all.filter((x) => x.v.kind === "Anomaly").length, desc: "Unusual patterns detected", set: () => setKind("Anomaly") },
    { label: "High-Confidence", n: all.filter((x) => x.p.confidence >= 80).length, desc: "80% confidence or more", set: () => setConf("high") },
    { label: "Requires Attention", n: all.filter((x) => x.v.severity === "HIGH").length, desc: "High-severity insights", set: () => setKind("all") },
    { label: "Watching", n: Object.values(state).filter((s) => s === "watch").length, desc: "Insights you follow", set: () => undefined },
  ];
  const clear = () => { setQ(""); setHorizon("all"); setKind("all"); setConf("all"); };

  return (
    <PageShell>
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Lightbulb className="h-3.5 w-3.5" /> Founder AI · Predict</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Predictive Insights</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Forward-looking intelligence for emerging operational risks, opportunities, and trends.</p>
          <p className="mt-2 text-[11px] text-muted-foreground">{dataSourceStatus(isPersisted, "prediction feed")} · Predictions are estimates, not guaranteed outcomes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}><RefreshCw className="h-4 w-4" /> Refresh</Button>
          <Button size="sm" asChild><Link to="/ai-ceo/predictions/scenarios"><FlaskConical className="h-4 w-4" /> Scenario Analysis</Link></Button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {summary.map((s) => (
          <button key={s.label} onClick={s.set} className="bento-card p-4 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <p className="text-xl font-semibold tabular-nums">{isLoading ? "—" : s.n}</p>
            <p className="text-xs font-medium">{s.label}</p>
            <p className="text-[11px] text-muted-foreground">{s.desc}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search insights..." aria-label="Search insights" className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0" />
        </div>
        <Select value={horizon} onValueChange={setHorizon}>
          <SelectTrigger className="h-9 w-[150px]" aria-label="Time horizon"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Any horizon</SelectItem>{horizons.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="h-9 w-[150px]" aria-label="Insight type"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All types</SelectItem>{["Risk", "Opportunity", "Anomaly"].map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={conf} onValueChange={setConf}>
          <SelectTrigger className="h-9 w-[160px]" aria-label="Confidence"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Any confidence</SelectItem><SelectItem value="high">High (80%+)</SelectItem><SelectItem value="low">Below 80%</SelectItem></SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => setShowDismissed((s) => !s)} aria-pressed={showDismissed}>{showDismissed ? "Hide dismissed" : "Show dismissed"}</Button>
        {(q || horizon !== "all" || kind !== "all" || conf !== "all") && <Button variant="ghost" size="sm" onClick={clear}><X className="h-4 w-4" /> Clear</Button>}
      </div>

      {isLoading ? <div className="grid gap-3 md:grid-cols-2"><CardSkeleton /><CardSkeleton /></div> : feed.length === 0 ? (
        <div className="bento-card p-10 text-center text-sm text-muted-foreground">{all.length === 0 ? "No predictive insights yet." : "No insights match these filters."}</div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2" aria-label="Insight feed">
          {feed.map(({ p, v }) => {
            const s = state[p.id];
            return (
              <li key={p.id} className={`bento-card flex flex-col gap-3 p-4 ${s === "dismissed" ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge level={v.severity} /><KindChip kind="Prediction" />
                  <span className="text-[11px] text-muted-foreground">{v.kind} · {v.signalType} · {p.timeline}</span>
                  {s === "watch" && <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-primary-glow"><Eye className="h-3 w-3" /> Watching</span>}
                </div>
                <div>
                  <Link to="/ai-ceo/predictions/$id" params={{ id: p.id }} className="font-medium hover:text-primary-glow focus-visible:outline-none focus-visible:underline">{p.title}</Link>
                  <p className="mt-1 text-sm text-muted-foreground">{p.detail}</p>
                </div>
                <p className="text-xs text-muted-foreground">Expected direction: <b className="text-foreground">{v.direction}</b> · Evidence: 1 signal</p>
                <Confidence value={p.confidence} />
                <div className="mt-auto flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" asChild><Link to="/ai-ceo/predictions/$id" params={{ id: p.id }}>View Insight</Link></Button>
                  <Button size="sm" variant="ghost" asChild><Link to="/ai-ceo/decision-engine">Open Decision</Link></Button>
                  <Button size="sm" variant="ghost" onClick={() => setState(p.id, s === "watch" ? "" : "watch")} aria-pressed={s === "watch"}>{s === "watch" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {s === "watch" ? "Unwatch" : "Watch"}</Button>
                  <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground" onClick={() => setState(p.id, s === "dismissed" ? "" : "dismissed")}>{s === "dismissed" ? "Restore" : "Dismiss"}</Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <section aria-label="Forecast horizons">
        <h2 className="mb-2 text-sm font-semibold">Forecast by horizon</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {([["Next 7 days", data.timelinePredictions.sevenDays], ["Next 30 days", data.timelinePredictions.thirtyDays], ["Next quarter", data.timelinePredictions.quarter]] as const).map(([label, items]) => (
            <div key={label} className="bento-card p-4">
              <div className="mb-2 flex items-center justify-between"><p className="text-sm font-medium">{label}</p><KindChip kind="Forecast" /></div>
              <ul className="space-y-2">{items.map((t) => <li key={t.label} className="flex items-center justify-between gap-2 text-sm"><span className="text-muted-foreground">{t.label}</span><span className="text-right"><b>{t.prediction}</b> <span className="text-[11px] text-muted-foreground">· {t.confidence}%</span></span></li>)}</ul>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
