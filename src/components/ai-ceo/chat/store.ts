import { useCallback, useEffect, useState } from "react";
import type { Answer } from "./engine";

/** Browser-only conversation store (localStorage). CHAT_HISTORY_API_REQUIRED for server persistence. */
export interface ChatMessage { id: string; role: "user" | "assistant"; text: string; answer?: Answer; status?: "completed" | "failed" | "interrupted"; feedback?: "up" | "down"; attachments?: string[]; at: string }
export interface Thread { id: string; title: string; context?: string; archived?: boolean; updatedAt: string; messages: ChatMessage[] }

const KEY = "sv:founder:chat-threads";
const EVT = "founder-chat-threads";

export function readThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
function writeThreads(t: Thread[]) {
  try { localStorage.setItem(KEY, JSON.stringify(t.slice(0, 100))); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVT));
}
export function createThread(context?: string): Thread {
  const t: Thread = { id: `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, title: "New conversation", updatedAt: new Date().toISOString(), messages: [], ...(context ? { context } : {}) };
  writeThreads([t, ...readThreads()]);
  return t;
}

export function useThreads() {
  const [threads, setThreads] = useState<Thread[]>([]);
  useEffect(() => {
    const load = () => setThreads(readThreads());
    load();
    window.addEventListener(EVT, load);
    window.addEventListener("storage", load);
    return () => { window.removeEventListener(EVT, load); window.removeEventListener("storage", load); };
  }, []);
  const update = useCallback((id: string, fn: (t: Thread) => Thread) => {
    writeThreads(readThreads().map((t) => (t.id === id ? { ...fn(t), updatedAt: new Date().toISOString() } : t)));
  }, []);
  const remove = useCallback((id: string) => writeThreads(readThreads().filter((t) => t.id !== id)), []);
  return { threads, update, remove };
}

export function dayBucket(iso: string) {
  const d = new Date(iso); const now = new Date();
  const days = Math.floor((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000);
  return days <= 0 ? "Today" : days === 1 ? "Yesterday" : days < 7 ? "This Week" : "Earlier";
}
