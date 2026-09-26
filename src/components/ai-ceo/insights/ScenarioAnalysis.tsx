import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { BackLink, DetailSection } from "@/components/ai-ceo/governance/shared";
import { ForecastChart, KindChip, type SeriesPoint } from "./shared";

const PARAMS = [
  { key: "demand", label: "Demand change" },
  { key: "workload", label: "Workload change" },
  { key: "conversion", label: "Conversion change" },
  { key: "resources", label: "Resource availability" },
  { key: "cost", label: "Operating cost" },
  { key: "volume", label: "Customer volume" },
] as const;
type Key = (typeof PARAMS)[number]["key"];
type Params = Record<Key, number>;
const ZERO: Params = { demand: 0, workload: 0, conversion: 0, resources: 0, cost: 0, volume: 0 };
const PRESETS: Record<string, Params> = {
  Baseline: ZERO,
  Optimistic: { demand: 10, workload: -5, conversion: 8, resources: 5, cost: -5, volume: 10 },
  Conservative: { demand: -10, workload: 10, conversion: -5, resources: -10, cost: 8, volume: -8 },
};

/**
 * Deterministic UI preview: an index (baseline = 100) moved by the chosen parameters.
 * SCENARIO_ENGINE_REQUIRED — not a forecast of real Software Vala figures.
 */
function project(p: Params): SeriesPoint[] {
  const net = (p.demand + p.conversion + p.volume + p.resources - p.workload - p.cost) / 6;
  return ["M1", "M2", "M3", "M4", "M5", "M6"].map((label, i) => ({
    label,
    forecast: 100,
    scenario: Math.round((100 + net * (i + 1) * 0.5) * 10) / 10,
  }));
}

export function ScenarioAnalysis() {
  const [preset, setPreset] = useState("Baseline");
  const [params, setParams] = useState<Params>(ZERO);
  const [compare, setCompare] = useState(true);
  const series = useMemo(() => project(params), [params]);
  const end = series.at(-1)?.scenario ?? 100;
  const delta = Math.round((end - 100) * 10) / 10;

  const apply = (name: string) => { setPreset(name); setParams(PRESETS[name] ?? ZERO); };

  return (
    <PageShell>
      <BackLink to="/ai-ceo/predictions" label="Predictive Insights" />
      <header>
        <div className="flex items-center gap-2"><KindChip kind="Scenario" /><KindChip kind="Assumption" /></div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Scenario Analysis</h1>
        <p className="mt-1 text-sm text-muted-foreground">Explore “what if” changes. This is an illustrative preview indexed to 100 — not a prediction of real results.</p>
      </header>

      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Scenario">
        {[...Object.keys(PRESETS), "Custom"].map((name) => (
          <Button key={name} size="sm" role="radio" aria-checked={preset === name} variant={preset === name ? "default" : "outline"} onClick={() => (name === "Custom" ? setPreset("Custom") : apply(name))}>{name}</Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <DetailSection title="Parameters">
          <div className="space-y-5">
            {PARAMS.map((p) => (
              <div key={p.key} className="space-y-2">
                <div className="flex justify-between text-xs"><Label>{p.label}</Label><span className="tabular-nums text-foreground">{params[p.key] > 0 ? "+" : ""}{params[p.key]}%</span></div>
                <Slider min={-20} max={20} step={1} value={[params[p.key]]} aria-label={p.label}
                  onValueChange={([val]) => { setPreset("Custom"); setParams((s) => ({ ...s, [p.key]: val ?? 0 })); }} />
              </div>
            ))}
          </div>
        </DetailSection>
        <div className="space-y-4">
          <DetailSection title="Scenario vs baseline">
            <ForecastChart data={compare ? series : series.map(({ forecast: _f, ...rest }) => rest)} />
          </DetailSection>
          <div className="grid gap-4 sm:grid-cols-3">
            <DetailSection title="Expected impact"><p className="text-xl font-semibold text-foreground tabular-nums">{delta > 0 ? "+" : ""}{delta}</p><p className="text-xs">index points by M6</p></DetailSection>
            <DetailSection title="Risk exposure"><p className="text-foreground">{params.workload > 5 || params.resources < -5 ? "Elevated" : "Contained"}</p><p className="text-xs">From workload and resource inputs</p></DetailSection>
            <DetailSection title="Operational implication"><p className="text-xs">{params.workload > 5 ? "Capacity may become constrained." : "Current capacity appears sufficient."}</p></DetailSection>
          </div>
          <p className="text-xs text-muted-foreground">Assumptions: equal weighting of all parameters, linear effect over six months. Confidence: not applicable to illustrative previews.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setCompare((c) => !c)} aria-pressed={compare}>{compare ? "Hide baseline" : "Compare"}</Button>
            <Button variant="ghost" size="sm" onClick={() => apply("Baseline")}>Reset</Button>
            <Button variant="secondary" size="sm" onClick={() => {
              try { const s = JSON.parse(sessionStorage.getItem("sv:founder:scenarios") ?? "[]"); sessionStorage.setItem("sv:founder:scenarios", JSON.stringify([{ preset, params, at: new Date().toISOString() }, ...s].slice(0, 10))); } catch { /* ignore */ }
              toast.success("Scenario saved for this session");
            }}>Save Scenario</Button>
            <Button size="sm" asChild><Link to="/ai-ceo/decision-engine">Add to Decision</Link></Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
