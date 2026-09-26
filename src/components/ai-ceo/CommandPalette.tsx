import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Brain, Clock, Database, FileText, History, Library, ShieldAlert, Sparkles } from "lucide-react";

import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut,
} from "@/components/ui/command";
import { ALL_FOUNDER_NAV } from "@/lib/founder-nav";
import { useCEOData } from "@/hooks/useCEOData";

const RECENT_KEY = "sv:founder:recent-searches";
const SUGGESTED = ["Pending decisions", "High risks", "Weekly report", "Revenue signals"];

const COMMANDS: { label: string; to: string; keywords?: string }[] = [
  { label: "Open Command Center", to: "/ai-ceo" },
  { label: "View Decisions", to: "/ai-ceo/decision-engine" },
  { label: "View Predictions", to: "/ai-ceo/predictions" },
  { label: "View Performance", to: "/ai-ceo/performance" },
  { label: "View Approvals", to: "/ai-ceo/approvals" },
  { label: "View Risks", to: "/ai-ceo/risk" },
  { label: "View Reports", to: "/ai-ceo/reports" },
  { label: "View Learning", to: "/ai-ceo/learning" },
  { label: "View Company Brain", to: "/ai-ceo/company-brain" },
  { label: "View Tasks", to: "/ai-ceo/tasks" },
  { label: "View Agents", to: "/ai-ceo/agents" },
  { label: "Start Research", to: "/ai-ceo/research" },
  { label: "Search Company Brain", to: "/ai-ceo/company-brain", keywords: "knowledge" },
];

/** One overlay serves as both Global Search and the Ctrl/Cmd+K command palette. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const { data, isLoading } = useCEOData();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try { setRecent(JSON.parse(sessionStorage.getItem(RECENT_KEY) ?? "[]")); } catch { /* ignore */ }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); onOpenChange(!open); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const records = useMemo(() => [
    ...data.decisions.map((d) => ({ id: `d-${d.id}`, icon: Brain, title: d.action, type: "Decision", desc: d.reasoning, to: "/ai-ceo/decision-engine", time: undefined as string | undefined })),
    ...data.reports.map((r) => ({ id: `r-${r.id}`, icon: FileText, title: r.title, type: "Report", desc: r.highlights[0] ?? r.status, to: "/ai-ceo/reports", time: r.generatedAt })),
    ...data.complianceItems.map((c) => ({ id: `p-${c.id}`, icon: Library, title: c.policy, type: "Policy", desc: `${c.status} · last audit ${c.lastAudit}`, to: "/ai-ceo/company-brain", time: undefined as string | undefined })),
    ...data.learningLogs.map((l) => ({ id: `l-${l.id}`, icon: Database, title: l.observation, type: "Learning", desc: l.outcome, to: "/ai-ceo/learning", time: undefined as string | undefined })),
    ...data.riskCategories.map((r) => ({ id: `k-${r.id}`, icon: ShieldAlert, title: r.category, type: "Risk", desc: `${r.level} · ${r.issues} open issues`, to: "/ai-ceo/risk", time: undefined as string | undefined })),
  ], [data]);

  const go = (to: string, label?: string) => {
    const term = (label ?? query).trim();
    if (term) {
      const next = [term, ...recent.filter((r) => r !== term)].slice(0, 5);
      setRecent(next);
      try { sessionStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    }
    onOpenChange(false);
    setQuery("");
    void navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search actions, decisions, insights..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results for “{query}”. Try a module name, decision or report.</CommandEmpty>
        {!query && recent.length > 0 && (
          <CommandGroup heading="Recent searches">
            {recent.map((r) => (
              <CommandItem key={r} value={`recent ${r}`} onSelect={() => setQuery(r)}>
                <History className="h-4 w-4" /> {r}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!query && (
          <CommandGroup heading="Suggested">
            {SUGGESTED.map((s) => (
              <CommandItem key={s} value={`suggested ${s}`} onSelect={() => setQuery(s.split(" ")[1] ?? s)}>
                <Sparkles className="h-4 w-4" /> {s}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandGroup heading="Actions">
          {COMMANDS.map((c) => (
            <CommandItem key={c.label} value={`${c.label} ${c.keywords ?? ""}`} onSelect={() => go(c.to, c.label)}>
              {c.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Modules">
          {ALL_FOUNDER_NAV.map((n) => (
            <CommandItem key={n.to + n.label} value={`${n.label} ${n.description}`} onSelect={() => go(n.to, n.label)}>
              <n.icon className="h-4 w-4" />
              <span>{n.label}</span>
              <span className="ml-auto truncate text-xs text-muted-foreground">{n.description}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        {query && (
          <CommandGroup heading={isLoading ? "Records · loading…" : "Records"}>
            {records.map((r) => (
              <CommandItem key={r.id} value={`${r.title} ${r.type} ${r.desc}`} onSelect={() => go(r.to)}>
                <r.icon className="h-4 w-4" />
                <div className="min-w-0">
                  <p className="truncate">{r.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.type} · {r.desc}</p>
                </div>
                {r.time && (
                  <CommandShortcut className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(r.time).toLocaleDateString()}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
