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
