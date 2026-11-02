/**
 * API error taxonomy - NexusMarket.
 *
 * Source of truth: SDD/Adapters/Api-rest-endpoints.md (§9 Error Responses) and
 * SDD/Contract-alignment.md (§6 HTTP status policy).
 *
 * Only the status/code pairs documented by the REST contract are represented
 * here. Do not invent new public codes without updating the contract first.
 */

export type ApiErrorCode =
  | 'INVALID_REQUEST'
  | 'AUTHENTICATION_REQUIRED'
  | 'INVALID_CREDENTIALS'
  | 'FORBIDDEN'
  | 'RESOURCE_NOT_FOUND'
  | 'RESOURCE_ALREADY_EXISTS'
  | 'INVALID_DOMAIN_VALUE'
  | 'INTERNAL_ERROR';

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  INVALID_REQUEST: 400,
  AUTHENTICATION_REQUIRED: 401,
  INVALID_CREDENTIALS: 401,
  FORBIDDEN: 403,
  RESOURCE_NOT_FOUND: 404,
  RESOURCE_ALREADY_EXISTS: 409,
  INVALID_DOMAIN_VALUE: 422,
  INTERNAL_ERROR: 500,
};

/**
 * Transport-agnostic API error. Adapters throw it; the global error handler
 * renders it using the documented envelope.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    if (details !== undefined) {
      this.details = details;
    }
  }

  static invalidRequest(message: string, details?: unknown): ApiError {
    return new ApiError('INVALID_REQUEST', message, details);
  }

  static authenticationRequired(message = 'Missing or invalid JWT token'): ApiError {
    return new ApiError('AUTHENTICATION_REQUIRED', message);
  }

  static invalidCredentials(message = 'Email/password mismatch'): ApiError {
    return new ApiError('INVALID_CREDENTIALS', message);
  }

  static forbidden(message = 'Insufficient permissions for this operation'): ApiError {
    return new ApiError('FORBIDDEN', message);
  }

  static notFound(message: string): ApiError {
    return new ApiError('RESOURCE_NOT_FOUND', message);
  }

  static alreadyExists(message: string): ApiError {
    return new ApiError('RESOURCE_ALREADY_EXISTS', message);
  }

  static invalidDomainValue(message: string, details?: unknown): ApiError {
    return new ApiError('INVALID_DOMAIN_VALUE', message, details);
  }

  static internal(message = 'An unexpected error occurred'): ApiError {
    return new ApiError('INTERNAL_ERROR', message);
  }
}
