import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  Brain,
  CheckSquare,
  Database,
  FileText,
  LayoutDashboard,
  Lightbulb,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldAlert,
  TrendingUp,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import softwareValaLogo from "@/assets/software-vala-logo.jpg.asset.json";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "sv:sidebar:collapsed";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

const primary: NavItem[] = [
  { label: "Dashboard", to: "/ai-ceo", icon: LayoutDashboard },
];

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Intelligence",
    items: [
      { label: "Live Action Monitor", to: "/ai-ceo/live-monitor", icon: Activity },
      { label: "Decision Engine", to: "/ai-ceo/decision-engine", icon: Brain },
      { label: "Predictive Insights", to: "/ai-ceo/predictions", icon: Lightbulb },
      { label: "Performance Intelligence", to: "/ai-ceo/performance", icon: TrendingUp },
    ],
  },
  {
    label: "Governance",
    items: [
      { label: "Approval Suggestions", to: "/ai-ceo/approvals", icon: CheckSquare },
      { label: "Risk & Compliance", to: "/ai-ceo/risk", icon: ShieldAlert },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { label: "AI Reports", to: "/ai-ceo/reports", icon: FileText },
      { label: "System Learning Log", to: "/ai-ceo/learning", icon: Database },
    ],
  },
];

const bottomItems: NavItem[] = [
  { label: "Settings", to: "/ai-ceo/settings", icon: Settings },
];

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () =>
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });

  return { collapsed, toggleCollapsed, mobileOpen, setMobileOpen };
}

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AppSidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: AppSidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [query, setQuery] = useState("");

  const isActive = (to: string) =>
    to === "/ai-ceo" ? pathname === "/ai-ceo" || pathname === "/ai-ceo/" : pathname.startsWith(to);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return groups
      .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [query]);

  const ItemLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.to);
    return (
      <Link
        to={item.to}
        onClick={onCloseMobile}
        title={item.label}
        aria-current={active ? "page" : undefined}
        data-active={active ? "true" : undefined}
        className={cn(
          "group/item relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors duration-150",
          collapsed && "justify-center px-0",
          active
            ? "bg-primary/18 font-medium text-foreground"
            : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
        )}
      >
        {active && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-primary" />
        )}
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  const content = (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2 border-b border-border px-3",
          collapsed && "justify-center px-0",
        )}
      >
        <Link to="/ai-ceo" className="flex min-w-0 items-center gap-2" onClick={onCloseMobile}>
          <img
            src={softwareValaLogo.url}
            alt="Software Vala"
            className="h-10 w-10 shrink-0 rounded-full border border-border bg-background object-cover"
          />
          {!collapsed && (
            <span className="truncate text-sm font-semibold tracking-tight">Software Vala</span>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={onToggleCollapsed}
            className="ml-auto hidden h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground lg:grid"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onCloseMobile}
          className="ml-auto grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {collapsed && (
        <button
          onClick={onToggleCollapsed}
          className="mx-auto mt-3 hidden h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground lg:grid"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      {!collapsed && (
        <div className="shrink-0 px-3 pt-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a module…"
              aria-label="Find a module"
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-3 overflow-y-auto px-2 py-3" aria-label="AI CEO navigation">
        <div className="space-y-0.5">
          {primary.map((item) => (
            <ItemLink key={item.to} item={item} />
          ))}
        </div>

        {filtered && filtered.length === 0 && !collapsed && (
          <p className="px-2.5 py-6 text-center text-xs text-muted-foreground">
            No module matches “{query}”.
          </p>
        )}

        {(filtered ?? groups).map((group) => {
          if (collapsed) {
            return (
              <div key={group.label} className="space-y-0.5 border-t border-border/60 pt-2">
                {group.items.map((item) => (
                  <ItemLink key={item.to} item={item} />
                ))}
              </div>
            );
          }
          return (
            <div key={group.label}>
              <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </div>
              <div className="mt-0.5 space-y-0.5">
                {group.items.map((item) => (
                  <ItemLink key={item.to} item={item} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-0.5 border-t border-border px-2 py-2">
        {bottomItems.map((item) => (
          <ItemLink key={item.to} item={item} />
        ))}
        {!collapsed && (
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
            <Bot className="h-7 w-7 shrink-0 text-primary-glow" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">AI CEO v2.0</p>
              <p className="truncate text-[10px] text-muted-foreground">Observer · Advisor</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-background/80 backdrop-blur-xl transition-[width] duration-200 lg:flex",
          collapsed ? "w-[72px]" : "w-[264px]",
        )}
      >
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-label="Close menu overlay"
          />
          <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-border bg-background shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
