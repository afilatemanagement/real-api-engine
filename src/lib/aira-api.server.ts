/**
 * Client for the external Prisma-backed AIRA API.
 *
 * Prisma cannot run inside this app's edge server runtime, so all PostgreSQL /
 * Prisma access lives behind an HTTP API that you host. Configure:
 *   AIRA_API_URL    e.g. https://api.softwarevala.com
 *   AIRA_API_TOKEN  service token sent as `Authorization: Bearer …`
 *
 * Every helper degrades gracefully: when the API is not configured or is
 * unreachable, it reports `configured: false` / `ok: false` instead of throwing,
 * so the UI keeps rendering with seed data.
 */

export interface AiraResult<T> {
  configured: boolean;
  ok: boolean;
  data: T | null;
  error?: string;
}

function apiBase(): string | null {
  const raw = process.env['AIRA_API_URL'];
  if (!raw) return null;
  return raw.replace(/\/+$/, '');
}

export function isAiraApiConfigured(): boolean {
  return apiBase() !== null;
}

export async function airaFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<AiraResult<T>> {
  const base = apiBase();
  if (!base) {
    return { configured: false, ok: false, data: null, error: 'AIRA_API_URL is not configured' };
  }

  const token = process.env['AIRA_API_TOKEN'];
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';

  try {
    const response = await fetch(`${base}${path}`, {
      method: init.method ?? 'GET',
      headers,
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    });


    if (!response.ok) {
      const text = await response.text();
      console.error(`AIRA API ${init.method ?? 'GET'} ${path} failed [${response.status}]: ${text}`);
      return { configured: true, ok: false, data: null, error: `[${response.status}] ${text}` };
    }

    const data = (await response.json()) as T;
    return { configured: true, ok: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`AIRA API ${init.method ?? 'GET'} ${path} threw: ${message}`);
    return { configured: true, ok: false, data: null, error: message };
  }
}
