import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ShieldAlert, X } from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardSkeleton } from "@/components/feedback/Skeletons";
import { useCEOData } from "@/hooks/useCEOData";
import { dataSourceStatus } from "@/components/ai-ceo/DataSourceStatus";
import { SeverityBadge, riskSeverity, type Severity } from "./shared";

const ORDER: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export function RiskRegister() {
  const navigate = useNavigate();
  const { data, isPersisted, isLoading } = useCEOData();
  const [q, setQ] = useState("");
  const [sev, setSev] = useState("all");
  const risks = data.riskCategories
    .filter((r) => !q || r.category.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => sev === "all" || riskSeverity(r) === sev)
    .sort((a, b) => ORDER.indexOf(riskSeverity(a)) - ORDER.indexOf(riskSeverity(b)));
  const all = data.riskCategories;
  const stats = [
    { label: "Open risks", value: String(all.reduce((s, r) => s + r.issues, 0)) },
    { label: "Critical risks", value: String(all.filter((r) => r.level === "critical").length) },
    { label: "High risks", value: String(all.filter((r) => r.level === "high").length) },
    { label: "Overdue mitigations", value: null },
    { label: "Exceptions", value: null },
  ];

  return (
    <PageShell>
      <section>
        <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><ShieldAlert className="h-3.5 w-3.5" /> Founder AI · Risk control</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Risk & Compliance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monitor operational risks, exceptions and compliance signals.</p>
        <p className="mt-2 text-[11px] text-muted-foreground">{dataSourceStatus(isPersisted, "risk register")}</p>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="bento-card p-4">
            <p className="text-xl font-semibold tabular-nums">{s.value ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{s.label}{s.value === null && " · awaiting data"}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search risks..." aria-label="Search risks" className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0" />
        </div>
        <Select value={sev} onValueChange={setSev}>
          <SelectTrigger className="h-9 w-[150px]" aria-label="Filter by severity"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All severities</SelectItem>{ORDER.map((s) => <SelectItem key={s} value={s}>{s.toLowerCase()}</SelectItem>)}</SelectContent>
        </Select>
        {(q || sev !== "all") && <Button size="sm" variant="ghost" onClick={() => { setQ(""); setSev("all"); }}><X className="h-4 w-4" /> Clear</Button>}
      </div>

      <section aria-label="Risk register">
        <h2 className="mb-2 text-sm font-semibold">Risk register</h2>
        {isLoading ? <CardSkeleton /> : risks.length === 0 ? (
          <div className="bento-card p-10 text-center text-sm text-muted-foreground">{all.length === 0 ? "No active risks." : "No risks match these filters."}</div>
        ) : (
          <>
            <div className="bento-card hidden overflow-hidden md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs text-muted-foreground">
                  <tr><th className="p-3 font-medium">Risk</th><th className="p-3 font-medium">Severity</th><th className="p-3 font-medium">Score</th><th className="p-3 font-medium">Open issues</th><th className="p-3 font-medium">Trend</th><th className="p-3 font-medium">Owner</th></tr>
                </thead>
                <tbody>
                  {risks.map((r) => (
                    <tr key={r.id} tabIndex={0} role="link" onClick={() => navigate({ to: "/ai-ceo/risk/$id", params: { id: r.id } })}
                      onKeyDown={(e) => { if (e.key === "Enter") void navigate({ to: "/ai-ceo/risk/$id", params: { id: r.id } }); }}
                      className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/30 focus-visible:bg-muted/40 focus-visible:outline-none">
                      <td className="p-3 font-medium">{r.category}</td>
                      <td className="p-3"><SeverityBadge level={riskSeverity(r)} /></td>
                      <td className="p-3 tabular-nums">{r.score}</td>
                      <td className="p-3 tabular-nums">{r.issues}</td>
                      <td className="p-3 text-muted-foreground">{r.trend}</td>
                      <td className="p-3 text-muted-foreground">Unassigned</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="space-y-2 md:hidden">
              {risks.map((r) => (
                <li key={r.id}>
                  <Link to="/ai-ceo/risk/$id" params={{ id: r.id }} className="bento-card block p-4">
                    <div className="flex items-center justify-between"><span className="font-medium">{r.category}</span><SeverityBadge level={riskSeverity(r)} /></div>
                    <p className="mt-1 text-xs text-muted-foreground">Score {r.score} · {r.issues} open issues · {r.trend}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-label="Compliance">
        <h2 className="mb-2 text-sm font-semibold">Compliance signals</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.complianceItems.map((c) => (
            <div key={c.id} className="bento-card p-3 text-sm"><p className="font-medium">{c.policy}</p><p className="text-xs text-muted-foreground">{c.status} · last audit {c.lastAudit}</p></div>
          ))}
        </div>
      </section>

      <section aria-label="Operational exceptions">
        <h2 className="mb-2 text-sm font-semibold">Operational Exceptions</h2>
        <div className="bento-card p-8 text-center text-sm text-muted-foreground">No operational exceptions recorded yet. Missed SLAs, unexpected costs and policy conflicts will appear here when connected.</div>
      </section>
    </PageShell>
  );
}
