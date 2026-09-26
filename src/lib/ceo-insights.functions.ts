import { createServerFn } from '@tanstack/react-start';

import type { CEOState, CEOSuggestion } from './ceo-types';

/**
 * Persistence for the AI CEO module, backed by the external Prisma API.
 * Endpoints expected on AIRA_API_URL:
 *   GET   /ai-ceo/state            -> { suggestions, lastRefresh }
 *   POST  /ai-ceo/refresh          -> { lastRefresh }
 *   GET   /ai-insights/boss-queue  -> { suggestions }
 *   POST  /ai-insights             <- ai_insights row
 *   PATCH /ai-insights/:id         <- { status, is_acknowledged }
 */

export const loadCeoState = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CEOState> => {
    const { airaFetch } = await import('./aira-api.server');
    const result = await airaFetch<{ suggestions: CEOSuggestion[]; lastRefresh: string | null }>(
      '/ai-ceo/state',
    );
    if (!result.ok || !result.data) return { persisted: false, suggestions: [], lastRefresh: null };
    return {
      persisted: true,
      suggestions: result.data.suggestions ?? [],
      lastRefresh: result.data.lastRefresh ?? null,
    };
  },
);

export const recordRefresh = createServerFn({ method: 'POST' })
  .inputValidator((input: { at: string }) => ({ at: String(input?.at ?? new Date().toISOString()) }))
  .handler(async ({ data }): Promise<{ persisted: boolean; lastRefresh: string }> => {
    const { airaFetch } = await import('./aira-api.server');
    const result = await airaFetch<{ lastRefresh: string }>('/ai-ceo/refresh', {
      method: 'POST',
      body: { lastRefresh: data.at },
    });
    return {
      persisted: result.ok,
      lastRefresh: result.data?.lastRefresh ?? data.at,
    };
  });

export const sendSuggestionToBoss = createServerFn({ method: 'POST' })
  .inputValidator((input: { suggestion: CEOSuggestion }) => {
    if (!input?.suggestion?.id) throw new Error('suggestion is required');
    return { suggestion: input.suggestion };
  })
  .handler(async ({ data }): Promise<{ persisted: boolean; error?: string }> => {
    const { airaFetch } = await import('./aira-api.server');
    const s = data.suggestion;
    const result = await airaFetch('/ai-insights', {
      method: 'POST',
      body: {
        id: s.id,
        issue_detected: s.title,
        suggested_action: s.description,
        confidence_score: s.confidence,
        scope: s.impactArea,
        scope_value: s.type,
        related_role: 'boss_owner',
        is_acknowledged: false,
        status: 'pending',
        created_at: s.createdAt,
      },
    });
    return { persisted: result.ok, ...(result.error ? { error: result.error } : {}) };
  });

export const loadBossQueue = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ persisted: boolean; suggestions: CEOSuggestion[] }> => {
    const { airaFetch } = await import('./aira-api.server');
    const result = await airaFetch<{ suggestions: CEOSuggestion[] }>('/ai-insights/boss-queue');
    return { persisted: result.ok, suggestions: result.data?.suggestions ?? [] };
  },
);

export const decideSuggestion = createServerFn({ method: 'POST' })
  .inputValidator((input: { id: string; decision: 'approved' | 'rejected' }) => {
    if (!input?.id) throw new Error('id is required');
    if (input.decision !== 'approved' && input.decision !== 'rejected') {
      throw new Error('decision must be approved or rejected');
    }
    return { id: input.id, decision: input.decision };
  })
  .handler(async ({ data }): Promise<{ persisted: boolean; error?: string }> => {
    const { airaFetch } = await import('./aira-api.server');
    const result = await airaFetch(`/ai-insights/${encodeURIComponent(data.id)}`, {
      method: 'PATCH',
      body: { status: data.decision, is_acknowledged: true },
    });
    return { persisted: result.ok, ...(result.error ? { error: result.error } : {}) };
  });
