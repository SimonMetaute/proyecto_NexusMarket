/**
 * Manual request validation helpers.
 *
 * The project does not currently ship a schema validation library, so the
 * adapter layer validates DTOs with these small, explicit helpers. Every
 * failure is a `ValidationError`, which the global error handler renders as
 * `400 INVALID_REQUEST` with the offending `field` in `details`
 * (SDD/Adapters/Api-rest-endpoints.md §9).
 *
 * Keeping validation here guarantees that controllers never forward raw
 * `req.body` into an application service.
 */

export class ValidationError extends Error {
  readonly field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export type RequestBody = Record<string, unknown>;

export interface StringOptions {
  minLength?: number;
  maxLength?: number;
}

function readField(body: RequestBody, field: string): unknown {
  return body[field];
}

function isAbsent(value: unknown): boolean {
  return value === undefined || value === null;
}

export function requireObject(value: unknown, label = 'body'): RequestBody {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError(label, 'Request body must be a JSON object.');
  }
  return value as RequestBody;
}

export function requireString(
  body: RequestBody,
  field: string,
  options: StringOptions = {},
): string {
  const value = readField(body, field);
  if (typeof value !== 'string') {
    throw new ValidationError(field, 'Required field missing or not a string.');
  }

  const trimmed = value.trim();
  if (options.minLength !== undefined && trimmed.length < options.minLength) {
    throw new ValidationError(
      field,
      `Must contain at least ${options.minLength} character(s).`,
    );
  }
  if (options.maxLength !== undefined && trimmed.length > options.maxLength) {
    throw new ValidationError(
      field,
      `Must contain at most ${options.maxLength} character(s).`,
    );
  }

  return trimmed;
}

export function optionalString(
  body: RequestBody,
  field: string,
  options: StringOptions = {},
): string | undefined {
  if (isAbsent(readField(body, field))) {
    return undefined;
  }
  return requireString(body, field, options);
}

export function requireEmail(body: RequestBody, field = 'email'): string {
  const email = requireString(body, field, { maxLength: 255 }).toLowerCase();
  // Pragmatic RFC 5322 subset: local@domain.tld without whitespace.
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_PATTERN.test(email)) {
    throw new ValidationError(field, 'Must be a valid email address.');
  }
  return email;
}

export function requirePassword(
  body: RequestBody,
  field = 'password',
  minLength = 8,
): string {
  return requireString(body, field, { minLength, maxLength: 128 });
}

export function requireNumber(body: RequestBody, field: string): number {
  const value = readField(body, field);
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ValidationError(field, 'Required field missing or not a number.');
  }
  return value;
}

export function optionalNumber(body: RequestBody, field: string): number | undefined {
  if (isAbsent(readField(body, field))) {
    return undefined;
  }
  return requireNumber(body, field);
}

export function requirePositiveInt(body: RequestBody, field: string): number {
  const value = requireNumber(body, field);
  if (!Number.isInteger(value) || value <= 0) {
    throw new ValidationError(field, 'Must be a positive integer.');
  }
  return value;
}

export function optionalBoolean(body: RequestBody, field: string): boolean | undefined {
  const value = readField(body, field);
  if (isAbsent(value)) {
    return undefined;
  }
  if (typeof value !== 'boolean') {
    throw new ValidationError(field, 'Must be a boolean.');
  }
  return value;
}

export function requireEnum<T extends string>(
  body: RequestBody,
  field: string,
  allowed: readonly T[],
): T {
  const value = requireString(body, field);
  const match = allowed.find((candidate) => candidate === value);
  if (match === undefined) {
    throw new ValidationError(
      field,
      `Must be one of: ${allowed.join(', ')}.`,
    );
  }
  return match;
}

export function optionalEnum<T extends string>(
  body: RequestBody,
  field: string,
  allowed: readonly T[],
): T | undefined {
  if (isAbsent(readField(body, field))) {
    return undefined;
  }
  return requireEnum(body, field, allowed);
}

export function requireStringArray(
  body: RequestBody,
  field: string,
  options: { minItems?: number } = {},
): string[] {
  const value = readField(body, field);
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new ValidationError(field, 'Must be an array of strings.');
  }
  if (options.minItems !== undefined && value.length < options.minItems) {
    throw new ValidationError(field, `Must contain at least ${options.minItems} item(s).`);
  }
  return value as string[];
}

/**
 * Reads a path parameter (`req.params`) that Express types as `string`.
 * Centralized so controllers use the same message format.
 */
export function requirePathParam(value: string | undefined, field: string): string {
  if (value === undefined || value.trim().length === 0) {
    throw new ValidationError(field, 'Path parameter is required.');
  }
  return value.trim();
}
