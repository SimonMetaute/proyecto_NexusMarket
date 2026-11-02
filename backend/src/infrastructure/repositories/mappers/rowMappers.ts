/**
 * Shared persistence helpers for MySQL adapters.
 *
 * MySQL returns `DATETIME`/`DECIMAL` values according to the driver options;
 * these helpers normalize them before rebuilding domain entities.
 */

export function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function toNullableDate(value: Date | string | null | undefined): Date | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  return toDate(value);
}

export function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

/**
 * The outbound inventory port accepts `any` for quantity (the input ports
 * define `Quantity` locally). This resolves both a primitive and `{ value }`
 * without leaking the imprecision into the domain.
 */
export function toQuantityValue(quantity: unknown): number {
  if (typeof quantity === 'number' && Number.isFinite(quantity)) {
    return quantity;
  }
  if (
    quantity !== null &&
    typeof quantity === 'object' &&
    'value' in quantity &&
    typeof (quantity as { value: unknown }).value === 'number'
  ) {
    return (quantity as { value: number }).value;
  }
  throw new Error('Invalid quantity: expected a number or an object with a numeric value.');
}
