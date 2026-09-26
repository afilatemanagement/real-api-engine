import { Bell, Menu, Radio, Search, Settings, Shield } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { CommandPalette } from "@/components/ai-ceo/CommandPalette";
import { NotificationDrawer } from "@/components/ai-ceo/system/NotificationViews";
import { useNotifications } from "@/components/ai-ceo/system/notifications";
import { useCEOData } from "@/hooks/useCEOData";
import { useState } from "react";

import { cn } from "@/lib/utils";
import softwareValaLogo from "@/assets/software-vala-logo.jpg.asset.json";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ICON_BTN =
  "icon3d relative grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground " +
  "transition-[transform,box-shadow,color,background-color] duration-200 " +
  "hover:text-foreground active:scale-[0.96] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-background";

interface TopBarProps {
  onOpenMenu: () => void;
  streamingOn: boolean;
  onStreamingToggle: () => void;
}

export function TopBar({ onOpenMenu, streamingOn, onStreamingToggle }: TopBarProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { unread } = useNotifications();
  const { isPersisted, isLoading } = useCEOData();
  const monitor = !streamingOn
    ? { label: "OFFLINE", hint: "Monitoring paused", cls: "border-destructive/40 bg-destructive/15 text-destructive" }
    : isLoading
      ? { label: "CONNECTING", hint: "Checking live connection", cls: "border-border bg-surface text-muted-foreground" }
      : isPersisted
        ? { label: "ACTIVE", hint: "Live connection active", cls: "border-accent-emerald/40 bg-accent-emerald/15 text-accent-emerald" }
        : { label: "AWAITING", hint: "Awaiting live connection — showing realistic seed data", cls: "border-accent-amber/40 bg-accent-amber/15 text-accent-amber" };
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-1.5 px-3 lg:px-5">
        <button className={cn(ICON_BTN, "lg:hidden")} onClick={onOpenMenu} aria-label="Open menu">
          <Menu className="h-[18px] w-[18px]" />
        </button>

        <Link to="/ai-ceo" className="mr-1 flex shrink-0 items-center gap-2 lg:hidden" aria-label="Home">
          <img
            src={softwareValaLogo.url}
            alt="Software Vala"
            className="h-8 w-8 rounded-full border border-border bg-background object-cover"
          />
        </Link>

        <div className="hidden min-w-0 flex-1 sm:block">
          <button
            onClick={() => setPaletteOpen(true)}
            aria-label="Open global search"
            className="flex w-full max-w-xl items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 truncate">Search actions, decisions, insights...</span>
            <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
          </button>
        </div>
        <button className={cn(ICON_BTN, "sm:hidden")} onClick={() => setPaletteOpen(true)} aria-label="Open global search">
          <Search className="h-[18px] w-[18px]" />
        </button>

        <div className="flex-1 sm:hidden" />

        <nav className="flex items-center gap-1" aria-label="Global actions">
          <button
            onClick={onStreamingToggle}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
              monitor.cls,
            )}
            aria-pressed={streamingOn}
            aria-label={`Monitoring: ${monitor.hint}. Click to ${streamingOn ? "pause" : "resume"}.`}
            title={monitor.hint}
          >
            <Radio className={cn("h-3.5 w-3.5", streamingOn && "animate-pulse")} />
            <span className="hidden sm:inline">{monitor.label}</span>
          </button>

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => setNotifOpen(true)} className={ICON_BTN} aria-label={`Notifications, ${unread} unread`}>
                <Bell className="h-[18px] w-[18px]" />
                {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{unread > 9 ? "9+" : unread}</span>}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Notifications</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/ai-ceo/risk" className={cn(ICON_BTN, "hidden sm:grid")} aria-label="Risk & Compliance">
                <Shield className="h-[18px] w-[18px]" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom">Risk &amp; Compliance</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/ai-ceo/settings" className={ICON_BTN} aria-label="Settings">
                <Settings className="h-[18px] w-[18px]" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom">Settings</TooltipContent>
          </Tooltip>
        </nav>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <NotificationDrawer open={notifOpen} onOpenChange={setNotifOpen} />
    </header>
  );
}
