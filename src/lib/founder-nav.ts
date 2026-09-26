import {
  Map, Users, Sunrise, Activity, BarChart3, Bell, Bot, Files, Gauge, HelpCircle, KeyRound, MessagesSquare, Radar, Brain, CheckSquare, Database, FileText, FolderKanban, LayoutDashboard, Lightbulb,
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
    label: "Core",
    items: [
      { label: "Command Center", to: "/ai-ceo", icon: LayoutDashboard, description: "Executive operational overview" },
      { label: "Morning AI", to: "/ai-ceo/morning", icon: Sunrise, description: "Daily operating picture and priorities" },
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
      { label: "Company Brain", to: "/ai-ceo/company-brain", icon: Library, description: "Company knowledge and context" },
      { label: "AI Reports", to: "/ai-ceo/reports", icon: FileText, description: "Generated executive reports" },
      { label: "System Learning Log", to: "/ai-ceo/learning", icon: Database, description: "What Founder AI has learned" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Ask Founder AI", to: "/ai-ceo/chat", icon: MessageSquare, description: "Ask questions about your operations" },
      { label: "Research Center", to: "/ai-ceo/research", icon: Microscope, description: "Operational research and evidence" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Worker Agents", to: "/ai-ceo/workers", icon: Users, description: "Operational workforce, queue and failures" },
      { label: "Operations Agents", to: "/ai-ceo/agents", icon: Bot, description: "Operational AI agents" },
      { label: "Tasks & Work Queue", to: "/ai-ceo/tasks", icon: ListTodo, description: "Operational tasks and owners" },
      { label: "Automations", to: "/ai-ceo/automations", icon: Workflow, description: "Governed operational automations" },
      { label: "Execution Activity", to: "/ai-ceo/activity", icon: Activity, description: "Escalations, monitoring and history" },
    ],
  },
  {
    label: "Workspaces",
    items: [
      { label: "Projects", to: "/ai-ceo/projects", icon: FolderKanban, description: "Operational initiatives and milestones" },
      { label: "Artifacts & Files", to: "/ai-ceo/files", icon: Files, description: "Files across projects and research" },
      { label: "Collaboration", to: "/ai-ceo/collaboration", icon: MessagesSquare, description: "Comments and mentions" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Notifications", to: "/ai-ceo/notifications", icon: Bell, description: "Alerts and updates" },
      { label: "Usage & Cost", to: "/ai-ceo/usage", icon: BarChart3, description: "AI consumption and cost" },
      { label: "AI Evaluation", to: "/ai-ceo/evaluation", icon: Gauge, description: "AI quality monitoring" },
      { label: "Security & Permissions", to: "/ai-ceo/security", icon: KeyRound, description: "Permissions and security events" },
      { label: "System Map", to: "/ai-ceo/system-map", icon: Map, description: "Lifecycles, governance and boundaries" },
      { label: "System Status", to: "/ai-ceo/status", icon: Radar, description: "Service availability" },
      { label: "Help & Shortcuts", to: "/ai-ceo/help", icon: HelpCircle, description: "Shortcuts and guidance" },
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
