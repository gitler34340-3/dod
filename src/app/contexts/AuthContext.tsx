import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';

export type UserRole = 'Admin' | 'HR' | 'Manager' | 'Employee';

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  employeeId?: string;
}

export interface AuthSession {
  user: SessionUser;
  accessToken: string;
  refreshToken?: string;
  token?: string;
}

interface AuthContextType {
  session: AuthSession | null;
  user: SessionUser | null;
  token: string | null;
  isHr: boolean;
  isReady: boolean;
  logout: () => void;
  setSession: (s: AuthSession | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { API_URL } from '@/app/api/config';

const STORAGE_KEY = 'dodoStaffSession';

function getAccessToken(session: AuthSession): string | null {
  return session.accessToken || session.token || null;
}

function isJwtValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1])) as { exp?: number };
    if (!payload.exp) return true;
    return payload.exp * 1000 > Date.now() + 10_000;
  } catch {
    return false;
  }
}

function normalizeSession(raw: AuthSession): AuthSession | null {
  const accessToken = getAccessToken(raw);
  if (!accessToken || !raw.user) return null;
  return { ...raw, accessToken, token: accessToken };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setIsReady(true);
        return;
      }

      try {
        const parsed = normalizeSession(JSON.parse(raw) as AuthSession);
        if (!parsed) {
          localStorage.removeItem(STORAGE_KEY);
          setIsReady(true);
          return;
        }

        const accessToken = getAccessToken(parsed)!;

        if (parsed.refreshToken) {
          try {
            const res = await fetch(`${API_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: parsed.refreshToken }),
            });

            if (res.ok) {
              const tokens = (await res.json()) as {
                accessToken: string;
                refreshToken: string;
                expiresIn: number;
              };
              setSessionState({
                ...parsed,
                ...tokens,
                token: tokens.accessToken,
              });
              setIsReady(true);
              return;
            }
          } catch {
            // fall through to access token check
          }
        }

        if (isJwtValid(accessToken)) {
          setSessionState(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsReady(true);
      }
    };

    loadSession();
  }, []);

  useEffect(() => {
    if (!session) return;
    const stored = { ...session, token: session.accessToken || session.token };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, [session]);

  const user = session?.user ?? null;
  const token = (session?.accessToken || session?.token) ?? null;
  const isHr = useMemo(
    () => !!user && ['Admin', 'HR', 'Manager'].includes(user.role),
    [user],
  );

  const setSession = (s: AuthSession | null) => {
    if (!s) {
      setSessionState(null);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const normalized = normalizeSession(s);
    setSessionState(normalized);
  };

  const logout = () => {
    setSessionState(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value: AuthContextType = {
    session,
    user,
    token,
    isHr,
    isReady,
    logout,
    setSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
