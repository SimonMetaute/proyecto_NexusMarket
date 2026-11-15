import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { UNAUTHORIZED_EVENT } from '../api/client';
import { login as loginRequest, logout as logoutRequest } from '../api/endpoints';
import type { Role } from '../api/types';
import {
  buildSession,
  clearSession,
  readSession,
  writeSession,
  type Session,
} from './session';

interface AuthContextValue {
  session: Session | null;
  login: (email: string, password: string) => Promise<Session>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession());

  useEffect(() => {
    const onUnauthorized = (): void => setSession(null);
    globalThis.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return (): void =>
      globalThis.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<Session> => {
      const response = await loginRequest({ email, password });
      const next = buildSession(response);
      writeSession(next);
      setSession(next);
      return next;
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutRequest();
    } catch {
      // El token puede estar revocado o expirado: la sesión local se limpia igual.
    } finally {
      clearSession();
      setSession(null);
    }
  }, []);

  const hasRole = useCallback(
    (...roles: Role[]): boolean =>
      session !== null && roles.includes(session.user.role),
    [session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ session, login, logout, hasRole }),
    [session, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return context;
}
