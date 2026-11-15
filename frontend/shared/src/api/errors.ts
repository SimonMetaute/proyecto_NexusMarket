import axios from 'axios';
import type { ApiErrorDetails, ApiErrorEnvelope } from './types';

/**
 * Error de API normalizado.
 * - `status === 0` → fallo de red o timeout (sin respuesta del backend).
 * - `isTimeout` → la petición no obtuvo respuesta a tiempo (resultado desconocido).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorDetails;
  readonly requestId?: string;
  readonly isNetwork: boolean;
  readonly isTimeout: boolean;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    details?: ApiErrorDetails;
    requestId?: string;
    isNetwork?: boolean;
    isTimeout?: boolean;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
    this.requestId = params.requestId;
    this.isNetwork = params.isNetwork ?? false;
    this.isTimeout = params.isTimeout ?? false;
  }

  get isDomainError(): boolean {
    return this.status === 404 || this.status === 422;
  }

  get field(): string | undefined {
    return this.details?.field;
  }
}

const FALLBACK_MESSAGES: Record<number, string> = {
  400: 'La solicitud no es válida.',
  401: 'Tu sesión no es válida o expiró. Inicia sesión de nuevo.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  409: 'El recurso ya existe.',
  422: 'La operación no cumple una regla de negocio.',
  500: 'El servidor no pudo procesar la solicitud.',
};

const FALLBACK_CODES: Record<number, string> = {
  400: 'INVALID_REQUEST',
  401: 'AUTHENTICATION_REQUIRED',
  403: 'FORBIDDEN',
  404: 'RESOURCE_NOT_FOUND',
  409: 'RESOURCE_ALREADY_EXISTS',
  422: 'INVALID_DOMAIN_VALUE',
  500: 'INTERNAL_ERROR',
};

function isEnvelope(data: unknown): data is Partial<ApiErrorEnvelope> {
  return typeof data === 'object' && data !== null;
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const response = error.response;
    const isTimeout =
      error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';

    if (response === undefined) {
      return new ApiError({
        status: 0,
        code: isTimeout ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
        message: isTimeout
          ? 'El servidor tardó demasiado en responder. El resultado es desconocido.'
          : 'No se pudo conectar con el servidor. Verifica que el backend esté activo.',
        isNetwork: true,
        isTimeout,
      });
    }

    const data: unknown = response.data;
    const envelope = isEnvelope(data) ? data : undefined;
    const status = response.status;

    return new ApiError({
      status,
      code:
        typeof envelope?.code === 'string'
          ? envelope.code
          : FALLBACK_CODES[status] ?? 'API_ERROR',
      message:
        typeof envelope?.message === 'string' && envelope.message.length > 0
          ? envelope.message
          : FALLBACK_MESSAGES[status] ?? 'Ocurrió un error inesperado.',
      details: envelope?.details,
      requestId:
        typeof envelope?.requestId === 'string' ? envelope.requestId : undefined,
    });
  }

  return new ApiError({
    status: 0,
    code: 'UNKNOWN_ERROR',
    message:
      error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
  });
}

export function errorMessage(error: unknown): string {
  return toApiError(error).message;
}
