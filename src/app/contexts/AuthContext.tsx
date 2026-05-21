import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';

export type UserRole = 'Admin' | 'HR' | 'Manager' | 'Employee';

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  // linked employee record if any
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

const STORAGE_KEY = 'dodoStaffSession';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Load previously stored session on mount and refresh tokens if possible
  useEffect(() => {
    const loadSession = async () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setIsReady(true);
        return;
      }

      try {
        const parsed = JSON.parse(raw) as AuthSession;

        // If the stored token is not a JWT, clear it (legacy format)
        if (parsed.token && parsed.token.split('.').length !== 3) {
          localStorage.removeItem(STORAGE_KEY);
          setIsReady(true);
          return;
        }

        // Try to refresh tokens if we have a refresh token
        if (parsed.refreshToken) {
          const res = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: parsed.refreshToken }),
          });

          if (!res.ok) {
            localStorage.removeItem(STORAGE_KEY);
            setIsReady(true);
            return;
          }

          const tokens = (await res.json()) as { accessToken: string; refreshToken: string; expiresIn: number };
          setSessionState({ ...parsed, ...tokens, token: tokens.accessToken });
          setIsReady(true);
          return;
        }

        setSessionState(parsed);
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
    setSessionState(s);
    if (!s) localStorage.removeItem(STORAGE_KEY);
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
