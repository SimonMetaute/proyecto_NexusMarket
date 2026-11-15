import type { LoginResponse, Role } from '../api/types';

export const SESSION_STORAGE_KEY = 'nexusmarket.session';

export interface Session {
  token: string;
  user: LoginResponse['user'];
  expiresIn: number;
  expiresAt: number;
}

interface JwtPayload {
  exp?: number;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '=',
    );
    const json = globalThis.atob(padded);
    const parsed: unknown = JSON.parse(json);
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as JwtPayload)
      : null;
  } catch {
    return null;
  }
}

export function buildSession(response: LoginResponse): Session {
  const payload = decodeJwtPayload(response.token);
  const expiresAt =
    typeof payload?.exp === 'number'
      ? payload.exp * 1000
      : Date.now() + response.expiresIn * 1000;

  return {
    token: response.token,
    user: response.user,
    expiresIn: response.expiresIn,
    expiresAt,
  };
}

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<Session>;
  return (
    typeof candidate.token === 'string' &&
    candidate.token.length > 0 &&
    typeof candidate.expiresAt === 'number' &&
    typeof candidate.user === 'object' &&
    candidate.user !== null &&
    typeof candidate.user.userId === 'string' &&
    typeof candidate.user.role === 'string'
  );
}

export function readSession(): Session | null {
  const raw = globalThis.localStorage.getItem(SESSION_STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isSession(parsed)) {
      globalThis.localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    if (parsed.expiresAt <= Date.now()) {
      globalThis.localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    globalThis.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function writeSession(session: Session): void {
  globalThis.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  globalThis.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function hasRole(session: Session | null, roles: readonly Role[]): boolean {
  return session !== null && roles.includes(session.user.role);
}
