/**
 * Backwards-compatible re-export.
 *
 * The canonical error type now lives in the domain layer
 * (`src/domain/errors/ApiError.ts`) so application services do not depend on
 * the HTTP infrastructure. Infrastructure code and tests may keep importing
 * this path.
 */
export { ApiError } from '../../../domain/errors/ApiError.js';
export type { ApiErrorCode } from '../../../domain/errors/ApiError.js';
