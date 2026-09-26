import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import {
  decideSuggestion,
  loadBossQueue,
  loadCeoState,
  recordRefresh,
  sendSuggestionToBoss,
} from '@/lib/ceo-insights.functions';
import {
  CEO_SEED_DATA,
  generateSeedSuggestions,
} from '@/lib/ceo-seed';
import { loadCEOOperationalData } from '@/lib/ceo-data.functions';
import type {
  ActivityEvent,
  AIObservation,
  CEOSuggestion,
  EcosystemMetrics,
} from '@/lib/ceo-types';
import { useCEOStreaming } from '@/components/ai-ceo/CEOStreamingContext';

export type { ActivityEvent, AIObservation, CEOSuggestion, EcosystemMetrics };

export function useCEOSuggestions() {
  const { streamingOn } = useCEOStreaming();
  const [suggestions, setSuggestions] = useState<CEOSuggestion[]>([]);
  const [ecosystemMetrics, setEcosystemMetrics] = useState<EcosystemMetrics | null>(null);
  const [observations, setObservations] = useState<AIObservation[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Null until hydrated from the database so server and client HTML match
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isPersisted, setIsPersisted] = useState(false);

  // Load persisted state; fall back to seed data when the API isn't connected
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [state, operational] = await Promise.all([loadCeoState(), loadCEOOperationalData()]);
      if (cancelled) return;

      setIsPersisted(state.persisted && operational.persisted);
      setSuggestions(
        state.persisted && state.suggestions.length ? state.suggestions : generateSeedSuggestions(),
      );
      const data = operational.persisted && operational.data ? operational.data : CEO_SEED_DATA;
      setEcosystemMetrics(data.metrics);
      setObservations(data.observations);
      setActivityEvents(data.activityEvents);
      setIsLoading(false);

      // Persist and reuse the refresh timestamp so it survives reloads
      const now = new Date().toISOString();
      const refreshed = await recordRefresh({ data: { at: now } });
      if (cancelled) return;
      setLastRefresh(new Date(refreshed.persisted ? refreshed.lastRefresh : (state.lastRefresh ?? now)));
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-refresh ecosystem metrics every 30 seconds and persist the timestamp
  useEffect(() => {
    if (!streamingOn) return;
    const interval = setInterval(() => {
      const at = new Date().toISOString();
      void recordRefresh({ data: { at } }).then((result) => {
        setLastRefresh(new Date(result.persisted ? result.lastRefresh : at));
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [streamingOn]);

  // Send suggestion to the Boss review queue (persisted as an ai_insights row)
  const sendToBoss = useCallback(
    async (suggestionId: string) => {
      const suggestion = suggestions.find((s) => s.id === suggestionId);
      if (!suggestion) return false;

      const result = await sendSuggestionToBoss({ data: { suggestion } });
      if (!result.persisted) {
        toast.error('Suggestion was not sent', {
          description: result.error ?? 'Connect the AIRA API and try again.',
        });
        return false;
      }

      setSuggestions((prev) =>
        prev.map((s) => (s.id === suggestionId ? { ...s, status: 'reviewed' as const } : s)),
      );

      toast.success('Suggestion sent to Boss', {
        description: result.persisted
          ? `"${suggestion.title}" is now visible in the Boss dashboard`
          : `"${suggestion.title}" was not persisted`,
      });

      return true;
    },
    [suggestions],
  );

  // Suggestions awaiting the Boss decision
  const getBossSuggestions = useCallback(async (): Promise<CEOSuggestion[]> => {
    const result = await loadBossQueue();
    return result.suggestions
      .filter((s) => s.status === 'pending')
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 10);
  }, []);

  // Acknowledge suggestion (Boss action)
  const acknowledgeSuggestion = useCallback(
    async (suggestionId: string, decision: 'approved' | 'rejected') => {
      const result = await decideSuggestion({ data: { id: suggestionId, decision } });
      if (!result.persisted) {
        toast.error('Decision was not saved', {
          description: result.error ?? 'Connect the AIRA API and try again.',
        });
        return false;
      }

      setSuggestions((prev) =>
        prev.map((s) => (s.id === suggestionId ? { ...s, status: decision } : s)),
      );

      toast.success(`Suggestion ${decision}`, {
        description: 'CEO will be notified of your decision',
      });

      return true;
    },
    [],
  );

  // Filter observations by category
  const getObservationsByCategory = useCallback(
    (category: 'change' | 'attention' | 'revenue') =>
      observations.filter((obs) => obs.category === category),
    [observations],
  );

  // Filter activity events by type
  const getEventsByType = useCallback(
    (type?: ActivityEvent['type']) => (!type ? activityEvents : activityEvents.filter((evt) => evt.type === type)),
    [activityEvents],
  );

  return {
    suggestions,
    ecosystemMetrics,
    observations,
    activityEvents,
    isLoading,
    isPersisted,
    lastRefresh,
    sendToBoss,
    getBossSuggestions,
    acknowledgeSuggestion,
    getObservationsByCategory,
    getEventsByType
  };
}
