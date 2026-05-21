import type { AuthSession } from '@/app/contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export type ApiError = { status: number; message: string };

function getTokenFromStorage(): string | null {
  try {
    const raw = localStorage.getItem('dodoStaffSession');
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<AuthSession>;
    return (s.accessToken || s.token) ?? null;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const authToken = token ?? getTokenFromStorage();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    let msg = text || res.statusText || 'Request failed';
    try {
      const json = JSON.parse(text) as { message?: string | string[] };
      if (json?.message) msg = Array.isArray(json.message) ? json.message[0] : json.message;
    } catch {
      // ignore
    }
    throw { status: res.status, message: msg } satisfies ApiError;
  }
  return (await res.json()) as T;
}

