/**
 * Global error handler.
 *
 * Renders every failure using the envelope documented in
 * `SDD/Adapters/Api-rest-endpoints.md` §9:
 *
 *   { timestamp, status, code, message, path, requestId, details? }
 *
 * Application/domain errors are translated here so controllers and use cases
 * stay free of HTTP concerns.
 */
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { EmailAlreadyExistsError } from '../../../application/use-cases/CreateUserUseCase.js';
import { ProductNameAlreadyExistsError } from '../../../application/use-cases/CreateProductUseCase.js';
import { InvalidCredentialsError } from '../../../application/use-cases/LoginUseCase.js';
import { ApiError } from '../errors/ApiError.js';
import { ValidationError } from '../validation/validator.js';

interface BodyParserError extends Error {
  type?: string;
  status?: number;
  body?: unknown;
}

function isBodyParserError(error: unknown): error is BodyParserError {
  if (!(error instanceof Error)) {
    return false;
  }
  const candidate = error as BodyParserError;
  return (
    candidate.type === 'entity.parse.failed' ||
    (candidate instanceof SyntaxError && typeof candidate.status === 'number')
  );
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof ValidationError) {
    return new ApiError('INVALID_REQUEST', error.message, {
      field: error.field,
      error: error.message,
    });
  }
  if (error instanceof EmailAlreadyExistsError) {
    return ApiError.alreadyExists('Email already registered');
  }
  if (error instanceof ProductNameAlreadyExistsError) {
    return ApiError.alreadyExists(error.message);
  }
  if (error instanceof InvalidCredentialsError) {
    return ApiError.invalidCredentials();
  }
  if (isBodyParserError(error)) {
    return ApiError.invalidRequest('Malformed JSON request body');
  }
  return ApiError.internal();
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next): void => {
  const apiError = toApiError(error);

  if (apiError.status >= 500) {
    // Never leak internals to clients; keep the stack in server logs.
    console.error(`[${req.requestId ?? 'no-request-id'}] Unhandled error`, error);
  }

  const envelope: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    status: apiError.status,
    code: apiError.code,
    message: apiError.message,
    path: req.originalUrl,
    requestId: req.requestId ?? '',
  };

  if (apiError.details !== undefined) {
    envelope.details = apiError.details;
  }

  res.status(apiError.status).json(envelope);
};

/**
 * Fallback for unmatched routes. Kept separate from the error handler so the
 * 404 is produced through the same envelope.
 */
export const notFoundHandler: RequestHandler = (req, _res, next): void => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};
