import assert from 'node:assert';
import { ApiError } from '../../src/infrastructure/http/errors/ApiError.js';
import { errorHandler } from '../../src/infrastructure/http/errors/errorHandler.js';
import type { Request, Response } from 'express';

let passed = 0;
function test(name: string, fn: () => void | Promise<void>): void {
  try {
    fn();
    passed++;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}

test('ApiError.invalidRequest has status 400 and code', () => {
  const e = ApiError.invalidRequest('Bad field', { field: 'email' });
  assert.strictEqual(e.status, 400);
  assert.strictEqual(e.code, 'INVALID_REQUEST');
  assert.strictEqual(e.message, 'Bad field');
});

test('ApiError.authenticationRequired has status 401', () => {
  const e = ApiError.authenticationRequired();
  assert.strictEqual(e.status, 401);
  assert.strictEqual(e.code, 'AUTHENTICATION_REQUIRED');
});

test('ApiError.invalidCredentials has status 401', () => {
  const e = ApiError.invalidCredentials();
  assert.strictEqual(e.status, 401);
  assert.strictEqual(e.code, 'INVALID_CREDENTIALS');
});

test('ApiError.forbidden has status 403', () => {
  const e = ApiError.forbidden();
  assert.strictEqual(e.status, 403);
  assert.strictEqual(e.code, 'FORBIDDEN');
});

test('ApiError.notFound has status 404', () => {
  const e = ApiError.notFound('Product not found');
  assert.strictEqual(e.status, 404);
  assert.strictEqual(e.code, 'RESOURCE_NOT_FOUND');
});

test('ApiError.alreadyExists has status 409', () => {
  const e = ApiError.alreadyExists('Email exists');
  assert.strictEqual(e.status, 409);
  assert.strictEqual(e.code, 'RESOURCE_ALREADY_EXISTS');
});

test('ApiError.invalidDomainValue has status 422', () => {
  const e = ApiError.invalidDomainValue('Bad value');
  assert.strictEqual(e.status, 422);
  assert.strictEqual(e.code, 'INVALID_DOMAIN_VALUE');
});

test('ApiError.internal has status 500', () => {
  const e = ApiError.internal();
  assert.strictEqual(e.status, 500);
  assert.strictEqual(e.code, 'INTERNAL_ERROR');
});

test('errorHandler builds envelope with requestId', () => {
  const req = { originalUrl: '/api/v1/test', requestId: 'req-123' } as unknown as Request;
  const res: Partial<Response> = {
    status: (code: number) => {
      assert.strictEqual(code, 404);
      return res as Response;
    },
    json: (body: Record<string, unknown>) => {
      assert.strictEqual(body.status, 404);
      assert.strictEqual(body.code, 'RESOURCE_NOT_FOUND');
      assert.strictEqual(body.path, '/api/v1/test');
      assert.strictEqual(body.requestId, 'req-123');
      assert.strictEqual(typeof body.timestamp, 'string');
    },
  };
  errorHandler(ApiError.notFound('x'), req, res as Response, () => {});
});

console.log(`\n${passed} error tests passed`);
