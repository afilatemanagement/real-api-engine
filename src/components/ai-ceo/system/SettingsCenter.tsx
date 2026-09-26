import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCEOData } from "@/hooks/useCEOData";

/** Founder preference surfaces, saved in this browser only (SETTINGS_API_REQUIRED). */
const KEY = "sv:founder:preferences";
type Prefs = Record<string, string | boolean>;
const DEFAULTS: Prefs = {
  timezone: "Asia/Kolkata", language: "English", dateFormat: "DD MMM YYYY", landing: "/ai-ceo", density: "Comfortable",
  responseStyle: "Concise", depth: "Standard", showConfidence: true, showSources: true, askClarify: true, showUncertainty: true,
  approvalThreshold: "Medium", riskThreshold: "High", escalate: "Immediately", stopVisible: true,
  nCritical: true, nRisk: true, nApproval: true, nDecision: true, nAutomation: true, nTask: true, nDaily: true, nWeekly: true,
  citationPref: "Always", reducedMotion: false, highContrast: false,
};
const SECTIONS: { id: string; label: string; items: [string, string, string[]?][] }[] = [
  { id: "general", label: "General", items: [["timezone", "Timezone", ["Asia/Kolkata", "UTC", "America/New_York", "Europe/London"]], ["language", "Language", ["English", "Hindi"]], ["dateFormat", "Date format", ["DD MMM YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]], ["landing", "Default landing page", ["/ai-ceo", "/ai-ceo/approvals", "/ai-ceo/chat"]]] },
  { id: "ai", label: "AI Behavior", items: [["responseStyle", "Response style", ["Concise", "Detailed"]], ["depth", "Explanation depth", ["Brief", "Standard", "Deep"]], ["showConfidence", "Show confidence"], ["showSources", "Show sources"], ["askClarify", "Ask clarifying questions"], ["showUncertainty", "Highlight uncertainty"]] },
  { id: "governance", label: "Decision Governance", items: [["approvalThreshold", "Require approval from risk level", ["Low", "Medium", "High"]], ["riskThreshold", "Alert from risk level", ["Medium", "High", "Critical"]], ["escalate", "Escalation behavior", ["Immediately", "Daily digest"]], ["stopVisible", "Show emergency stop"]] },
  { id: "notifications", label: "Notifications", items: [["nCritical", "Critical alerts"], ["nRisk", "Risk alerts"], ["nApproval", "Approval requests"], ["nDecision", "Decision updates"], ["nAutomation", "Automation failures"], ["nTask", "Task escalations"], ["nDaily", "Daily executive summary"], ["nWeekly", "Weekly operational report"]] },
  { id: "knowledge", label: "Knowledge", items: [["citationPref", "Citations in answers", ["Always", "When available", "Hidden"]]] },
  { id: "appearance", label: "Appearance", items: [["density", "Density", ["Comfortable", "Compact"]], ["reducedMotion", "Reduce motion"], ["highContrast", "High contrast focus rings"]] },
];

export function SettingsCenter() {
  const { data, isPersisted } = useCEOData();
  const [p, setP] = useState<Prefs>(DEFAULTS);
  useEffect(() => { try { setP({ ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }); } catch { /* ignore */ } }, []);
  const set = (k: string, v: string | boolean) => { const n = { ...p, [k]: v }; setP(n); try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* ignore */ } };
  const initial = typeof window !== "undefined" && window.location.hash === "#notifications" ? "notifications" : "general";
  return (
    <section className="bento-card p-5" aria-label="Founder AI settings">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div><h2 className="text-lg font-semibold">Founder AI Settings</h2><p className="text-xs text-muted-foreground">Preferences are saved in this browser. Organization-wide configuration needs the settings backend.</p></div>
        <Button size="sm" variant="ghost" onClick={() => { setP(DEFAULTS); localStorage.removeItem(KEY); toast.success("Preferences reset"); }}>Reset</Button>
      </div>
      <Tabs defaultValue={initial}>
        <TabsList className="flex h-auto flex-wrap">{[...SECTIONS.map((s) => [s.id, s.label]), ["security", "Security"], ["system", "System Information"]].map(([id, l]) => <TabsTrigger key={id} value={id!}>{l}</TabsTrigger>)}</TabsList>
        {SECTIONS.map((s) => (
          <TabsContent key={s.id} value={s.id} id={s.id} className="grid gap-3 sm:grid-cols-2">
            {s.items.map(([k, label, opts]) => (
              <div key={k} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <Label htmlFor={`pref-${k}`} className="text-sm">{label}</Label>
                {opts ? <Select value={String(p[k])} onValueChange={(v) => set(k, v)}><SelectTrigger id={`pref-${k}`} className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent>{opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
                  : <Switch id={`pref-${k}`} checked={Boolean(p[k])} onCheckedChange={(v) => set(k, v)} />}
              </div>))}
          </TabsContent>))}
        <TabsContent value="security" className="space-y-2 text-sm text-muted-foreground"><p>Session and sign-in details appear once authentication is connected.</p><p>AI action authorization: execution always requires your approval. <a href="/ai-ceo/security" className="text-primary-glow">Open Security & Permissions</a></p><p>Audit logging: awaiting backend (activity is recorded in this browser only).</p></TabsContent>
        <TabsContent value="system"><dl className="grid gap-2 text-sm sm:grid-cols-2">{[["AI system version", data.systemInfo.aiVersion], ["Model configuration", data.systemInfo.modelVersion], ["Training", data.systemInfo.lastTraining], ["Data source", isPersisted ? "Live connection" : "Realistic seed data (live connection not configured)"], ["Monitoring", "See System Status"], ["Last system evaluation", "Awaiting evaluation backend"]].map(([k, v]) => <div key={k} className="rounded-lg border border-border p-3"><dt className="text-[11px] text-muted-foreground">{k}</dt><dd>{v}</dd></div>)}</dl></TabsContent>
      </Tabs>
    </section>
  );
}
