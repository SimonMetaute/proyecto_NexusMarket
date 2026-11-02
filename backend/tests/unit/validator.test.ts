import assert from 'node:assert';
import {
  requireString,
  requireEmail,
  requirePassword,
  requireNumber,
  requirePositiveInt,
  requireEnum,
  optionalString,
  optionalNumber,
  ValidationError,
} from '../../src/infrastructure/http/validation/validator.js';

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

function expectError(fn: () => void, field: string): void {
  assert.throws(fn, (error: unknown) => {
    return error instanceof ValidationError && error.field === field;
  });
}

// requireString
test('requireString accepts valid string', () => {
  assert.strictEqual(requireString({ name: 'Ada' }, 'name'), 'Ada');
});
test('requireString trims whitespace', () => {
  assert.strictEqual(requireString({ name: '  Ada  ' }, 'name'), 'Ada');
});
test('requireString throws on missing', () => {
  expectError(() => requireString({}, 'name'), 'name');
});
test('requireString throws on non-string', () => {
  expectError(() => requireString({ name: 123 as any }, 'name'), 'name');
});

// requireEmail
test('requireEmail accepts valid email', () => {
  assert.strictEqual(requireEmail({ email: 'Ada@Example.COM' }), 'ada@example.com');
});
test('requireEmail throws on invalid', () => {
  expectError(() => requireEmail({ email: 'not-an-email' }), 'email');
});

// requirePassword
test('requirePassword enforces min length', () => {
  expectError(() => requirePassword({ password: 'short' }), 'password');
});
test('requirePassword accepts valid', () => {
  assert.strictEqual(requirePassword({ password: 'secure1234' }), 'secure1234');
});

// requireNumber
test('requireNumber accepts number', () => {
  assert.strictEqual(requireNumber({ price: 10.5 }, 'price'), 10.5);
});
test('requireNumber throws on missing', () => {
  expectError(() => requireNumber({}, 'price'), 'price');
});

// requirePositiveInt
test('requirePositiveInt accepts positive int', () => {
  assert.strictEqual(requirePositiveInt({ qty: 5 }, 'qty'), 5);
});
test('requirePositiveInt throws on zero', () => {
  expectError(() => requirePositiveInt({ qty: 0 } as any), 'qty');
});
test('requirePositiveInt throws on negative', () => {
  expectError(() => requirePositiveInt({ qty: -1 } as any), 'qty');
});

// requireEnum
test('requireEnum accepts allowed value', () => {
  assert.strictEqual(requireEnum({ status: 'Active' }, 'status', ['Active', 'Inactive']), 'Active');
});
test('requireEnum throws on invalid', () => {
  expectError(() => requireEnum({ status: 'Unknown' } as any, 'status', ['Active', 'Inactive']), 'status');
});

// optionalString
test('optionalString returns undefined when absent', () => {
  assert.strictEqual(optionalString({}, 'nick'), undefined);
});
test('optionalString returns value when present', () => {
  assert.strictEqual(optionalString({ nick: 'Ada' }, 'nick'), 'Ada');
});

// optionalNumber
test('optionalNumber returns undefined when absent', () => {
  assert.strictEqual(optionalNumber({}, 'discount'), undefined);
});
test('optionalNumber returns value when present', () => {
  assert.strictEqual(optionalNumber({ discount: 10 }, 'discount'), 10);
});

console.log(`\n${passed} validator tests passed`);
