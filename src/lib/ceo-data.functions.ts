import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import type { CEOOperationalData } from './ceo-types';

const operationalDataSchema = z.object({
  metrics: z.object({
    systemActivityRate: z.number(), deploymentFrequency: z.number(), errorVelocity: z.number(),
    activeUsers: z.number(), transactionsToday: z.number(), apiLatency: z.number(),
  }),
  observations: z.array(z.object({ id: z.string(), category: z.enum(['change', 'attention', 'revenue']), title: z.string(), detail: z.string(), severity: z.enum(['info', 'warning', 'critical']), timestamp: z.string() })),
  activityEvents: z.array(z.object({ id: z.string(), type: z.enum(['risk', 'revenue', 'operations', 'security', 'compliance']), actor: z.string(), action: z.string(), target: z.string(), timestamp: z.string(), impact: z.enum(['positive', 'negative', 'neutral']) })),
  liveActions: z.array(z.object({ id: z.string(), actor: z.string(), action: z.string(), role: z.string(), location: z.string(), impact: z.enum(['low', 'medium', 'high', 'critical']), risk: z.number().min(0).max(100), time: z.string() })),
  decisions: z.array(z.object({ id: z.string(), action: z.string(), requestedBy: z.string(), type: z.string(), aiDecision: z.enum(['approve', 'delay', 'reject', 'escalate']), confidence: z.number().min(0).max(100), reasoning: z.string(), historicalOutcome: z.string() })),
  riskCategories: z.array(z.object({ id: z.string(), category: z.string(), level: z.enum(['low', 'medium', 'high', 'critical']), score: z.number().min(0).max(100), issues: z.number(), trend: z.string(), icon: z.enum(['shield', 'file', 'money', 'clock', 'lock']) })),
  complianceItems: z.array(z.object({ id: z.string(), policy: z.string(), status: z.string(), lastAudit: z.string() })),
  preventiveSuggestions: z.array(z.string()),
  rolePerformance: z.array(z.object({ role: z.string(), score: z.number(), trend: z.string(), metric: z.string(), change: z.string() })),
  productivityMetrics: z.array(z.object({ metric: z.string(), value: z.string(), trend: z.string(), target: z.string() })),
  correctiveActions: z.array(z.object({ team: z.string(), issue: z.string(), action: z.string(), priority: z.enum(['high', 'medium']) })),
  predictions: z.array(z.object({ id: z.string(), title: z.string(), type: z.enum(['positive', 'negative', 'warning']), timeline: z.string(), confidence: z.number(), detail: z.string(), icon: z.enum(['money', 'server', 'users', 'warning', 'zap']) })),
  timelinePredictions: z.object({ sevenDays: z.array(z.object({ label: z.string(), prediction: z.string(), confidence: z.number() })), thirtyDays: z.array(z.object({ label: z.string(), prediction: z.string(), confidence: z.number() })), quarter: z.array(z.object({ label: z.string(), prediction: z.string(), confidence: z.number() })) }),
  reports: z.array(z.object({ id: z.string(), title: z.string(), type: z.enum(['daily', 'weekly', 'monthly']), generatedAt: z.string(), status: z.string(), recipients: z.array(z.string()), highlights: z.array(z.string()) })),
  upcomingReports: z.array(z.object({ title: z.string(), scheduled: z.string() })),
  learningLogs: z.array(z.object({ id: z.string(), observation: z.string(), suggestion: z.string(), bossDecision: z.string(), outcome: z.string(), timestamp: z.string(), learned: z.boolean() })),
  learningStats: z.object({ totalObservations: z.number(), accuracyRate: z.number(), improvementThisMonth: z.number(), decisionsAnalyzed: z.number() }),
  settings: z.array(z.object({ category: z.string(), icon: z.enum(['eye', 'bell', 'shield', 'globe']), settings: z.array(z.object({ label: z.string(), value: z.boolean(), locked: z.boolean() })) })),
  systemInfo: z.object({ aiVersion: z.string(), modelVersion: z.string(), lastTraining: z.string() }),
});

export const loadCEOOperationalData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ persisted: boolean; data: CEOOperationalData | null; error?: string }> => {
    const { airaFetch } = await import('./aira-api.server');
    const result = await airaFetch<CEOOperationalData>('/ai-ceo/operational-data');
    if (!result.ok || !result.data) return { persisted: false, data: null, ...(result.error ? { error: result.error } : {}) };
    const parsed = operationalDataSchema.safeParse(result.data);
    if (!parsed.success) return { persisted: false, data: null, error: 'AIRA returned an invalid operational data payload' };
    return { persisted: true, data: parsed.data as CEOOperationalData };
  },
);