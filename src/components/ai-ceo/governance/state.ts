import { useCallback, useEffect, useState } from "react";

/**
 * Session-only governance UI state (decision/approval outcomes, drafts).
 * APPROVAL_WRITE_API_REQUIRED: replace with confirmed AIRA writes in a later phase.
 */
export function useSessionMap<T>(key: string) {
  const [map, setMap] = useState<Record<string, T>>({});
  useEffect(() => {
    const load = () => {
      try { setMap(JSON.parse(sessionStorage.getItem(key) ?? "{}")); } catch { /* ignore */ }
    };
    load();
    window.addEventListener(`session:${key}`, load);
    return () => window.removeEventListener(`session:${key}`, load);
  }, [key]);
  const set = useCallback((id: string, value: T) => {
    let current: Record<string, T> = {};
    try { current = JSON.parse(sessionStorage.getItem(key) ?? "{}"); } catch { /* ignore */ }
    try { sessionStorage.setItem(key, JSON.stringify({ ...current, [id]: value })); } catch { /* ignore */ }
    window.dispatchEvent(new Event(`session:${key}`));
  }, [key]);
  return [map, set] as const;
}

export interface ApprovalOutcome { outcome: "APPROVED" | "REJECTED" | "DELEGATED"; note?: string; at: string }
export const APPROVAL_KEY = "sv:founder:approval-outcomes";
