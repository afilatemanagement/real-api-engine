import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Archive, CalendarClock, Copy, Download, FileText, Plus, Search, Share2 } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardSkeleton } from "@/components/feedback/Skeletons";
import { useCEOData } from "@/hooks/useCEOData";
import { dataSourceStatus } from "@/components/ai-ceo/DataSourceStatus";
import { useSessionMap } from "@/components/ai-ceo/governance/state";
import type { ReportItem } from "@/lib/ceo-types";

const ARCHIVE_KEY = "sv:founder:report-archive";
export const REPORT_TYPES = ["Executive Brief", "Operations Review", "Performance Review", "Risk Review", "Decision Review", "Customer Operations", "Marketplace Operations", "Finance Operations", "Team Operations", "Custom Report"];
const AREAS = ["Sales", "Support", "Franchises", "Resellers", "Finance", "Compliance", "Infrastructure"];
const METRICS = ["Active users", "Transactions", "Deploys", "Error rate", "API latency", "Resolution time", "Conversion"];
const SECTIONS = ["Executive Summary", "Key Findings", "Performance", "Trends", "Risks", "Opportunities", "Decisions", "Recommended Actions", "Evidence", "Appendix"];

export function downloadReport(r: ReportItem) {
  const text = `${r.title}\n${r.type} report · ${r.generatedAt} · ${r.status}\nRecipients: ${r.recipients.join(", ")}\n\n${r.highlights.map((h) => `• ${h}`).join("\n")}\n`;
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url; a.download = `${r.id}.txt`; a.click();
  URL.revokeObjectURL(url);
}

export function ReportsWorkspace() {
  const { data, isPersisted, isLoading } = useCEOData();
  const [archived, setArchived] = useSessionMap<boolean>(ARCHIVE_KEY);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [building, setBuilding] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const list = data.reports
    .filter((r) => showArchived || !archived[r.id])
    .filter((r) => type === "all" || r.type === type)
    .filter((r) => !q || `${r.title} ${r.highlights.join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  const cards = [
    { label: "Daily reports", n: data.reports.filter((r) => r.type === "daily").length, t: "daily" },
    { label: "Weekly reports", n: data.reports.filter((r) => r.type === "weekly").length, t: "weekly" },
    { label: "Monthly reports", n: data.reports.filter((r) => r.type === "monthly").length, t: "monthly" },
    { label: "Scheduled", n: data.upcomingReports.length, t: "all" },
  ];

  return (
    <PageShell>
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><FileText className="h-3.5 w-3.5" /> Founder AI · Knowledge</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">AI Reports</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Executive and operational reports generated from authorized company information.</p>
          <p className="mt-2 text-[11px] text-muted-foreground">{dataSourceStatus(isPersisted, "report archive")}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setScheduling(true)}><CalendarClock className="h-4 w-4" /> Schedule</Button>
          <Button size="sm" onClick={() => setBuilding(true)}><Plus className="h-4 w-4" /> Create Report</Button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => <button key={c.label} onClick={() => setType(c.t)} className="bento-card p-4 text-left hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><p className="text-xl font-semibold tabular-nums">{c.n}</p><p className="text-xs text-muted-foreground">{c.label}</p></button>)}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reports..." aria-label="Search reports" className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-9 w-[150px]" aria-label="Report period"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All periods</SelectItem><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent>
        </Select>
        <Button size="sm" variant="ghost" onClick={() => setShowArchived((s) => !s)} aria-pressed={showArchived}>{showArchived ? "Hide archived" : "Show archived"}</Button>
      </div>

      {isLoading ? <CardSkeleton /> : list.length === 0 ? <div className="bento-card p-10 text-center text-sm text-muted-foreground">No reports match.</div> : (
        <ul className="space-y-2" aria-label="Reports">
          {list.map((r) => (
            <li key={r.id} className={`bento-card grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center ${archived[r.id] ? "opacity-60" : ""}`}>
              <div className="min-w-0">
                <Link to="/ai-ceo/reports/$id" params={{ id: r.id }} className="font-medium hover:text-primary-glow focus-visible:outline-none focus-visible:underline">{r.title}</Link>
                <p className="text-xs text-muted-foreground">{r.type} · {r.generatedAt} · {r.status}{archived[r.id] ? " · archived" : ""} · to {r.recipients.join(", ")}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">{r.highlights.join(" · ")}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="secondary" asChild><Link to="/ai-ceo/reports/$id" params={{ id: r.id }}>Open</Link></Button>
                <Button size="icon" variant="ghost" aria-label="Share" onClick={() => { void navigator.clipboard?.writeText(`${window.location.origin}/ai-ceo/reports/${r.id}`); toast.success("Report link copied"); }}><Share2 className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" aria-label="Download" onClick={() => downloadReport(r)}><Download className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" aria-label="Duplicate" onClick={() => setBuilding(true)}><Copy className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" aria-label={archived[r.id] ? "Unarchive" : "Archive"} onClick={() => { setArchived(r.id, !archived[r.id]); toast.success(archived[r.id] ? "Restored" : "Archived for this session"); }}><Archive className="h-4 w-4" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section aria-label="Upcoming reports">
        <h2 className="mb-2 text-sm font-semibold">Upcoming reports</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{data.upcomingReports.map((u) => <div key={u.title} className="bento-card p-3 text-sm"><p className="font-medium">{u.title}</p><p className="text-xs text-muted-foreground">{u.scheduled}</p></div>)}</div>
      </section>

      <ReportBuilder open={building} onOpenChange={setBuilding} />
      <ScheduleDialog open={scheduling} onOpenChange={setScheduling} />
    </PageShell>
  );
}

function Multi({ options, value, onChange, label }: { options: string[]; value: string[]; onChange: (v: string[]) => void; label: string }) {
  return (
    <fieldset className="grid gap-2 sm:grid-cols-2"><legend className="sr-only">{label}</legend>
      {options.map((o) => (
        <Label key={o} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2.5 text-sm font-normal">
          <Checkbox checked={value.includes(o)} onCheckedChange={(c) => onChange(c ? [...value, o] : value.filter((x) => x !== o))} /> {o}
        </Label>
      ))}
    </fieldset>
  );
}

const STEPS = ["Type", "Business areas", "Metrics", "Period", "Sections", "Review"];
function ReportBuilder({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [step, setStep] = useState(0);
  const [cfg, setCfg] = useState({ type: "", areas: [] as string[], metrics: [] as string[], period: "", sections: ["Executive Summary", "Key Findings"] });
  const [ready, setReady] = useState(false);
  const ok = [!!cfg.type, cfg.areas.length > 0, cfg.metrics.length > 0, !!cfg.period, cfg.sections.length > 0, true][step];
  const close = () => { onOpenChange(false); setTimeout(() => { setStep(0); setReady(false); setCfg({ type: "", areas: [], metrics: [], period: "", sections: ["Executive Summary", "Key Findings"] }); }, 200); };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ready ? "Report configuration ready" : "Create Report"}</DialogTitle>
          <DialogDescription>{ready ? "Your configuration is saved for this session. Reports generate once the reporting source is connected." : `Step ${step + 1} of ${STEPS.length} · ${STEPS[step]}`}</DialogDescription>
        </DialogHeader>
        {!ready && <ol className="flex gap-1" aria-hidden>{STEPS.map((s, i) => <li key={s} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />)}</ol>}
        {ready ? null : step === 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">{REPORT_TYPES.map((t) => <Button key={t} variant={cfg.type === t ? "default" : "outline"} className="justify-start" onClick={() => setCfg((c) => ({ ...c, type: t }))}>{t}</Button>)}</div>
        ) : step === 1 ? <Multi label="Business areas" options={AREAS} value={cfg.areas} onChange={(areas) => setCfg((c) => ({ ...c, areas }))} />
          : step === 2 ? <Multi label="Metrics" options={METRICS} value={cfg.metrics} onChange={(metrics) => setCfg((c) => ({ ...c, metrics }))} />
          : step === 3 ? (
            <Select value={cfg.period} onValueChange={(period) => setCfg((c) => ({ ...c, period }))}>
              <SelectTrigger aria-label="Period"><SelectValue placeholder="Select a period" /></SelectTrigger>
              <SelectContent>{["Today", "Last 7 days", "Last 30 days", "This quarter"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          ) : step === 4 ? <Multi label="Sections" options={SECTIONS} value={cfg.sections} onChange={(sections) => setCfg((c) => ({ ...c, sections }))} />
          : (
            <dl className="space-y-2 text-sm">
              {([["Type", cfg.type], ["Areas", cfg.areas.join(", ")], ["Metrics", cfg.metrics.join(", ")], ["Period", cfg.period], ["Sections", cfg.sections.join(", ")]] as const).map(([k, v]) => <div key={k}><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></div>)}
            </dl>
          )}
        <DialogFooter className="gap-2">
          {ready ? <Button onClick={close}>Done</Button> : <>
            <Button variant="outline" onClick={() => (step === 0 ? close() : setStep((s) => s - 1))}>{step === 0 ? "Cancel" : "Back"}</Button>
            {step < STEPS.length - 1
              ? <Button disabled={!ok} onClick={() => setStep((s) => s + 1)}>Next</Button>
              : <Button onClick={() => { try { const x = JSON.parse(sessionStorage.getItem("sv:founder:report-configs") ?? "[]"); sessionStorage.setItem("sv:founder:report-configs", JSON.stringify([cfg, ...x].slice(0, 10))); } catch { /* ignore */ } setReady(true); }}>Create</Button>}
          </>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScheduleDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [f, setF] = useState({ frequency: "", time: "08:00", recipients: "", type: "" });
  const [touched, setTouched] = useState(false);
  const valid = f.frequency && f.type && f.recipients.trim();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Schedule a report</DialogTitle><DialogDescription>Configuration only — the schedule becomes active once reporting is connected.</DialogDescription></DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5"><Label>Report type *</Label><Select value={f.type} onValueChange={(type) => setF((s) => ({ ...s, type }))}><SelectTrigger aria-label="Report type"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{REPORT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Frequency *</Label><Select value={f.frequency} onValueChange={(frequency) => setF((s) => ({ ...s, frequency }))}><SelectTrigger aria-label="Frequency"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{["Daily", "Weekly", "Monthly", "Custom"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="s-time">Time</Label><Input id="s-time" type="time" value={f.time} onChange={(e) => setF((s) => ({ ...s, time: e.target.value }))} /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="s-rec">Recipients *</Label><Input id="s-rec" placeholder="Founder, COO" value={f.recipients} onChange={(e) => setF((s) => ({ ...s, recipients: e.target.value }))} /></div>
          {touched && !valid && <p className="text-xs text-destructive" role="alert">Choose a type, frequency and recipients.</p>}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => { setTouched(true); if (!valid) return; toast.success("Schedule configured", { description: "Not active yet — it starts once reporting is connected." }); onOpenChange(false); }}>Save schedule</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
