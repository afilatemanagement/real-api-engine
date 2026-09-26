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
}).passthrough();

export const loadCEOOperationalData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ persisted: boolean; data: CEOOperationalData | null; error?: string }> => {
    const { airaFetch } = await import('./aira-api.server');
    const result = await airaFetch<CEOOperationalData>('/ai-ceo/operational-data');
    if (!result.ok || !result.data) return { persisted: false, data: null, ...(result.error ? { error: result.error } : {}) };
    const parsed = operationalDataSchema.safeParse(result.data);
    if (!parsed.success) return { persisted: false, data: null, error: 'AIRA returned an invalid operational data payload' };
    return { persisted: true, data: result.data };
  },
);