import axios, { type AxiosInstance } from 'axios';
import { clearSession, readSession } from '../auth/session';
import { toApiError } from './errors';

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:3000/api/v1';

/** Evento global emitido cuando el backend rechaza el token (401). */
export const UNAUTHORIZED_EVENT = 'nexusmarket:unauthorized';

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config) => {
  const session = readSession();
  if (session !== null) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error);
    if (apiError.status === 401 && readSession() !== null) {
      clearSession();
      globalThis.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(apiError);
  },
);
