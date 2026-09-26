export interface CEOSuggestion {
  id: string;
  type: 'growth' | 'risk' | 'cost' | 'efficiency' | 'product' | 'compliance';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  impactArea: string;
  status: 'pending' | 'approved' | 'rejected' | 'reviewed';
  createdAt: string;
  source: 'AI-CEO' | 'System' | 'Analytics';
}

export interface EcosystemMetrics {
  systemActivityRate: number;
  deploymentFrequency: number;
  errorVelocity: number;
  activeUsers: number;
  transactionsToday: number;
  apiLatency: number;
}

export interface AIObservation {
  id: string;
  category: 'change' | 'attention' | 'revenue';
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
}

export interface ActivityEvent {
  id: string;
  type: 'risk' | 'revenue' | 'operations' | 'security' | 'compliance';
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  impact: 'positive' | 'negative' | 'neutral';
}


/** Persisted AI CEO state returned by the Prisma-backed API. */
export interface CEOState {
  /** false when AIRA_API_URL is not configured yet — callers fall back to seed data. */
  persisted: boolean;
  suggestions: CEOSuggestion[];
  lastRefresh: string | null;
  data?: CEOOperationalData;
}

export interface LiveAction {
  id: string; actor: string; action: string; role: string; location: string;
  impact: 'low' | 'medium' | 'high' | 'critical'; risk: number; time: string;
}

export interface DecisionItem {
  id: string; action: string; requestedBy: string; type: string;
  aiDecision: 'approve' | 'delay' | 'reject' | 'escalate'; confidence: number;
  reasoning: string; historicalOutcome: string;
}

export interface RiskCategory {
  id: string; category: string; level: 'low' | 'medium' | 'high' | 'critical';
  score: number; issues: number; trend: string; icon: 'shield' | 'file' | 'money' | 'clock' | 'lock';
}

export interface ComplianceItem { id: string; policy: string; status: string; lastAudit: string }
export interface RolePerformance { role: string; score: number; trend: string; metric: string; change: string }
export interface ProductivityMetric { metric: string; value: string; trend: string; target: string }
export interface CorrectiveAction { team: string; issue: string; action: string; priority: 'high' | 'medium' }
export interface PredictionItem {
  id: string; title: string; type: 'positive' | 'negative' | 'warning'; timeline: string;
  confidence: number; detail: string; icon: 'money' | 'server' | 'users' | 'warning' | 'zap';
}
export interface TimelinePrediction { label: string; prediction: string; confidence: number }
export interface ReportItem {
  id: string; title: string; type: 'daily' | 'weekly' | 'monthly'; generatedAt: string;
  status: string; recipients: string[]; highlights: string[];
}
export interface UpcomingReport { title: string; scheduled: string }
export interface LearningLog {
  id: string; observation: string; suggestion: string; bossDecision: string;
  outcome: string; timestamp: string; learned: boolean;
}
export interface LearningStats {
  totalObservations: number; accuracyRate: number; improvementThisMonth: number; decisionsAnalyzed: number;
}
export interface SettingCategory {
  category: string; icon: 'eye' | 'bell' | 'shield' | 'globe';
  settings: Array<{ label: string; value: boolean; locked: boolean }>;
}

export interface CEOOperationalData {
  metrics: EcosystemMetrics;
  observations: AIObservation[];
  activityEvents: ActivityEvent[];
  liveActions: LiveAction[];
  decisions: DecisionItem[];
  riskCategories: RiskCategory[];
  complianceItems: ComplianceItem[];
  preventiveSuggestions: string[];
  rolePerformance: RolePerformance[];
  productivityMetrics: ProductivityMetric[];
  correctiveActions: CorrectiveAction[];
  predictions: PredictionItem[];
  timelinePredictions: Record<'sevenDays' | 'thirtyDays' | 'quarter', TimelinePrediction[]>;
  reports: ReportItem[];
  upcomingReports: UpcomingReport[];
  learningLogs: LearningLog[];
  learningStats: LearningStats;
  settings: SettingCategory[];
  systemInfo: { aiVersion: string; modelVersion: string; lastTraining: string };
}

/** Shape of an `ai_insights` row in the Prisma schema. */
export interface AiInsightRecord {
  id?: string;
  issue_detected: string;
  suggested_action: string;
  confidence_score: number;
  scope: string;
  scope_value: string;
  related_role: string;
  is_acknowledged: boolean;
  status?: CEOSuggestion['status'];
  created_at?: string;
}
