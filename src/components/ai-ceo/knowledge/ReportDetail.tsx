import { useState } from "react";
import { ChevronDown, ChevronRight, Download, FileSearch, Share2 } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCEOData } from "@/hooks/useCEOData";
import { dataSourceStatus } from "@/components/ai-ceo/DataSourceStatus";
import { BackLink, EvidencePanel, Unavailable } from "@/components/ai-ceo/governance/shared";
import { downloadReport } from "./ReportsWorkspace";

export function ReportDetail({ id }: { id: string }) {
  const { data, isPersisted, isLoading } = useCEOData();
  const [open, setOpen] = useState<Record<string, boolean>>({ "Executive Summary": true, "Key Findings": true });
  const [evidence, setEvidence] = useState<string | null>(null);
  const r = data.reports.find((x) => x.id === id);
  if (!r) return <PageShell><BackLink to="/ai-ceo/reports" label="AI Reports" /><div className="bento-card p-10 text-center text-sm text-muted-foreground">{isLoading ? "Loading report…" : "This report isn't available."}</div></PageShell>;
  const source = dataSourceStatus(isPersisted, "report archive");
  const risks = data.riskCategories.filter((x) => x.level === "high" || x.level === "critical");
  const sections: { title: string; body: React.ReactNode; evidence: number }[] = [
    { title: "Executive Summary", body: <p>{r.title} for the {r.type} period, delivered {r.generatedAt} to {r.recipients.join(", ")}.</p>, evidence: 1 },
    { title: "Key Findings", body: <ul className="space-y-1">{r.highlights.map((h) => <li key={h}>• {h}</li>)}</ul>, evidence: r.highlights.length },
    { title: "Risks", body: risks.length ? <ul className="space-y-1">{risks.map((x) => <li key={x.id}>• {x.category} — {x.level}, {x.issues} open issues</li>)}</ul> : <p>No elevated risks.</p>, evidence: risks.length },
    { title: "Recommended Actions", body: <ul className="space-y-1">{data.preventiveSuggestions.slice(0, 3).map((p) => <li key={p}>• {p}</li>)}</ul>, evidence: 0 },
    { title: "Trends & Opportunities", body: <Unavailable>Trend analysis will appear when historical data is connected.</Unavailable>, evidence: 0 },
    { title: "Appendix", body: <p className="text-xs">Source: {source}. Status: {r.status}.</p>, evidence: 0 },
  ];

  return (
    <PageShell>
      <BackLink to="/ai-ceo/reports" label="AI Reports" />
      <header className="space-y-2">
        <p className="text-xs text-muted-foreground">{r.type} report · {r.generatedAt} · {r.status}</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{r.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => downloadReport(r)}><Download className="h-4 w-4" /> Download</Button>
          <Button size="sm" variant="outline" onClick={() => { void navigator.clipboard?.writeText(window.location.href); toast.success("Report link copied"); }}><Share2 className="h-4 w-4" /> Share</Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(Object.fromEntries(sections.map((s) => [s.title, true])))}>Expand all</Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen({})}>Collapse all</Button>
        </div>
      </header>
      <div className="space-y-2">
        {sections.map((s) => (
          <section key={s.title} className="bento-card">
            <button className="flex w-full items-center justify-between gap-2 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl" aria-expanded={!!open[s.title]} onClick={() => setOpen((o) => ({ ...o, [s.title]: !o[s.title] }))}>
              <span className="flex items-center gap-2 font-medium">{open[s.title] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}{s.title}</span>
            </button>
            {open[s.title] && (
              <div className="space-y-3 px-4 pb-4 text-sm text-muted-foreground">
                {s.body}
                {s.evidence > 0 && <Button size="sm" variant="ghost" onClick={() => setEvidence(s.title)}><FileSearch className="h-4 w-4" /> {s.evidence} supporting source{s.evidence > 1 ? "s" : ""}</Button>}
              </div>
            )}
          </section>
        ))}
      </div>
      <Sheet open={!!evidence} onOpenChange={(o) => !o && setEvidence(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader><SheetTitle>Evidence · {evidence}</SheetTitle><SheetDescription>Sources behind this section.</SheetDescription></SheetHeader>
          <div className="mt-4">
            <EvidencePanel items={(evidence === "Risks" ? risks.map((x) => ({ source: "Risk register", title: x.category, summary: `${x.level}, score ${x.score}`, freshness: isPersisted ? "Live" : "Seed snapshot" })) : r.highlights.map((h) => ({ source, title: r.title, summary: h, freshness: r.generatedAt })))} />
          </div>
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}
