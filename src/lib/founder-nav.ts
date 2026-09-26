import {
  Activity, Bot, Brain, CheckSquare, Database, FileText, LayoutDashboard, Lightbulb,
  Library, ListTodo, MessageSquare, Microscope, Settings, ShieldAlert, TrendingUp, Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Single source of truth for Founder AI navigation (sidebar, command palette, search). */
export interface FounderNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  description: string;
}

export const FOUNDER_NAV_GROUPS: { label: string; items: FounderNavItem[] }[] = [
  {
    label: "Primary",
    items: [
      { label: "Command Center", to: "/ai-ceo", icon: LayoutDashboard, description: "Executive operational overview" },
      { label: "Ask Founder AI", to: "/ai-ceo/chat", icon: MessageSquare, description: "Ask questions about your operations" },
      { label: "Decision Engine", to: "/ai-ceo/decision-engine", icon: Brain, description: "AI decision recommendations" },
      { label: "Predictive Insights", to: "/ai-ceo/predictions", icon: Lightbulb, description: "Forecasts and early signals" },
      { label: "Performance Intelligence", to: "/ai-ceo/performance", icon: TrendingUp, description: "Team and KPI performance" },
      { label: "Live Action Monitor", to: "/ai-ceo/live-monitor", icon: Activity, description: "Real-time operational actions" },
    ],
  },
  {
    label: "Governance",
    items: [
      { label: "Approval Suggestions", to: "/ai-ceo/approvals", icon: CheckSquare, description: "Items awaiting Founder approval" },
      { label: "Risk & Compliance", to: "/ai-ceo/risk", icon: ShieldAlert, description: "Risk exposure and policy status" },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { label: "AI Reports", to: "/ai-ceo/reports", icon: FileText, description: "Generated executive reports" },
      { label: "System Learning Log", to: "/ai-ceo/learning", icon: Database, description: "What Founder AI has learned" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Company Brain", to: "/ai-ceo/company-brain", icon: Library, description: "Company knowledge and context" },
      { label: "Tasks", to: "/ai-ceo/tasks", icon: ListTodo, description: "Operational tasks and owners" },
      { label: "Automations", to: "/ai-ceo/automations", icon: Workflow, description: "Governed operational automations" },
      { label: "Agents", to: "/ai-ceo/agents", icon: Bot, description: "Operational AI agents" },
      { label: "Research", to: "/ai-ceo/research", icon: Microscope, description: "Market and business research" },
      { label: "Activity", to: "/ai-ceo/activity", icon: Activity, description: "Important operational events" },
    ],
  },
];

export const FOUNDER_SETTINGS: FounderNavItem = {
  label: "Settings", to: "/ai-ceo/settings", icon: Settings, description: "Founder AI preferences",
};

export const ALL_FOUNDER_NAV: FounderNavItem[] = [
  ...FOUNDER_NAV_GROUPS.flatMap((g) => g.items),
  FOUNDER_SETTINGS,
];
