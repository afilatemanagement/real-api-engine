import { Info } from "lucide-react";
import {
  Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from "recharts";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { PredictionItem, ProductivityMetric, RolePerformance } from "@/lib/ceo-types";
import { cn } from "@/lib/utils";
import type { Severity } from "@/components/ai-ceo/governance/shared";

/* ---------- Confidence (reusable) ---------- */
export function Confidence({ value, freshness, className }: { value: number; freshness?: string; className?: string }) {
  const band = value >= 80 ? "High" : value >= 60 ? "Medium" : "Low";
  return (
    <span className={cn("inline-flex items-center gap-2 text-xs", className)}>
      <span className="relative h-1.5 w-14 overflow-hidden rounded-full bg-muted" aria-hidden>
        <span className="absolute inset-y-0 left-0 rounded-full bg-primary-glow" style={{ width: `${value}%` }} />
      </span>
      <span className="text-foreground">{band} confidence</span>
      <span className="text-muted-foreground">· {value}%{freshness ? ` · ${freshness}` : ""}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" aria-label="What confidence means" className="text-muted-foreground hover:text-foreground"><Info className="h-3 w-3" /></button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">Confidence represents the system's assessment based on available evidence and may change as new data arrives.</TooltipContent>
      </Tooltip>
    </span>
  );
}

/** Label chips distinguishing Observed / Forecast / Prediction / Scenario / Assumption. */
export function KindChip({ kind }: { kind: "Observed" | "Forecast" | "Prediction" | "Scenario" | "Assumption" }) {
  const cls = kind === "Observed" ? "border-accent-emerald/40 text-accent-emerald" : kind === "Scenario" || kind === "Assumption" ? "border-accent-pink/40 text-accent-pink" : "border-primary/40 text-primary-glow";
  return <span className={cn("inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider", cls)}>{kind}</span>;
}

/* ---------- Insight view-model (presentation mapping of contract fields only) ---------- */
const TYPE_BY_ICON: Record<PredictionItem["icon"], string> = {
  money: "Revenue signal", server: "Capacity", users: "Resource signal", warning: "Customer signal", zap: "Performance signal",
};
export function insightView(p: PredictionItem) {
  const kind = p.type === "positive" ? "Opportunity" : p.type === "negative" ? "Risk" : "Anomaly";
  const severity: Severity = p.type === "negative" ? "HIGH" : p.type === "warning" ? (p.confidence >= 80 ? "HIGH" : "MEDIUM") : "LOW";
  const direction = p.type === "positive" ? "Improving" : "Deteriorating";
  return { kind, signalType: TYPE_BY_ICON[p.icon], severity, direction };
}

/* ---------- KPI view-model ---------- */
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
export interface KpiView { id: string; label: string; value: string; change?: string; target?: string; trend: string; group: string; owner?: string }
export function kpiViews(prod: ProductivityMetric[], roles: RolePerformance[]): KpiView[] {
  return [
    ...prod.map((p) => ({ id: slug(p.metric), label: p.metric, value: p.value, target: p.target, trend: p.trend, group: "Productivity" })),
    ...roles.map((r) => ({ id: slug(`${r.role}-${r.metric}`), label: `${r.metric}`, value: `${r.score}`, change: r.change, trend: r.trend, group: "Team performance", owner: r.role })),
  ];
}
export const trendLabel = (t: string) => (t === "up" ? "Improving" : t === "down" ? "Declining" : "Stable");

/* ---------- Forecast chart (observed vs forecast vs confidence band) ---------- */
export interface SeriesPoint { label: string; observed?: number; forecast?: number; low?: number; high?: number; scenario?: number }
export function ForecastChart({ data, height = 260, emptyText = "Historical series will appear when connected." }: { data: SeriesPoint[]; height?: number; emptyText?: string }) {
  if (data.length === 0) {
    return <div className="grid place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground" style={{ height }}>{emptyText}</div>;
  }
  const band = data.map((d) => ({ ...d, band: d.low !== undefined && d.high !== undefined ? [d.low, d.high] : undefined }));
  return (
    <div style={{ height }} role="img" aria-label="Chart comparing observed values, forecast and confidence range">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={band} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
          <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
          <RTooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area dataKey="band" name="Confidence range" fill="var(--primary)" fillOpacity={0.12} stroke="none" />
          <Line dataKey="observed" name="Observed" stroke="var(--accent-emerald)" strokeWidth={2} dot={false} />
          <Line dataKey="forecast" name="Forecast" stroke="var(--primary-glow)" strokeWidth={2} strokeDasharray="6 4" dot={false} />
          <Line dataKey="scenario" name="Scenario" stroke="var(--accent-pink)" strokeWidth={2} strokeDasharray="2 3" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
