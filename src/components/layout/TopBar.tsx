import { Bell, Menu, Radio, Search, Settings, Shield } from "lucide-react";
import { Link } from "@tanstack/react-router";

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
          <div className="flex max-w-xl items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              placeholder="Search actions, decisions, insights…"
              aria-label="Search actions, decisions, insights"
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex-1 sm:hidden" />

        <nav className="flex items-center gap-1" aria-label="Global actions">
          <button
            onClick={onStreamingToggle}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
              streamingOn
                ? "border-accent-emerald/40 bg-accent-emerald/15 text-accent-emerald"
                : "border-destructive/40 bg-destructive/15 text-destructive",
            )}
            aria-pressed={streamingOn}
          >
            <Radio className={cn("h-3.5 w-3.5", streamingOn && "animate-pulse")} />
            <span className="hidden sm:inline">{streamingOn ? "MONITORING" : "PAUSED"}</span>
          </button>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className={ICON_BTN} aria-label="Notifications">
                <Bell className="h-[18px] w-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Notifications</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className={cn(ICON_BTN, "hidden sm:grid")} aria-label="Risk & Compliance">
                <Shield className="h-[18px] w-[18px]" />
              </button>
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
    </header>
  );
}
