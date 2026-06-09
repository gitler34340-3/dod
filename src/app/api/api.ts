import type { AuthSession } from '@/app/contexts/AuthContext';
import { API_URL } from '@/app/api/config';

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

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (error) {
    const networkError = new Error(
      'Не удалось отправить запрос. Проверьте соединение с сервером и размер файла (крупные видео могут не пройти в текущем режиме загрузки).',
    ) as Error & { status?: number };
    networkError.status = 0;
    throw networkError;
  }
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

