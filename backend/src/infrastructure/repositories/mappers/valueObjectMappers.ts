/**
 * JSON mappers for domain value objects persisted as columns.
 *
 * Value objects are immutable and framework-free, so adapters serialize them
 * explicitly instead of relying on implicit object spreading.
 */
import { CurrencyCode } from '../../../domain/model/enums.js';
import {
  Currency,
  DeliveryAddress,
  PaymentMethod,
  WarehouseLocation,
} from '../../../domain/model/value-objects.js';

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function parseArray(raw: string | null): unknown[] {
  if (raw === null || raw.length === 0) {
    return [];
  }
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

export function currencyFromCode(code: string): Currency {
  switch (code) {
    case CurrencyCode.USD:
      return Currency.USD();
    case CurrencyCode.EUR:
      return Currency.EUR();
    default:
      return Currency.COP();
  }
}

function deliveryAddressToRecord(address: DeliveryAddress): JsonRecord {
  return {
    addressId: address.addressId,
    country: address.country,
    department: address.department,
    city: address.city,
    neighborhood: address.neighborhood,
    address: address.address,
    postalCode: address.postalCode,
    reference: address.reference,
    isPrimary: address.isPrimary,
  };
}

function deliveryAddressFromRecord(record: JsonRecord): DeliveryAddress {
  return new DeliveryAddress({
    addressId: String(record.addressId ?? ''),
    country: String(record.country ?? ''),
    department: String(record.department ?? ''),
    city: String(record.city ?? ''),
    neighborhood: String(record.neighborhood ?? ''),
    address: String(record.address ?? ''),
    postalCode: String(record.postalCode ?? ''),
    reference: String(record.reference ?? ''),
    isPrimary: Boolean(record.isPrimary ?? false),
  });
}

export function deliveryAddressToJson(address: DeliveryAddress): string {
  return JSON.stringify(deliveryAddressToRecord(address));
}

export function deliveryAddressFromJson(raw: string): DeliveryAddress {
  return deliveryAddressFromRecord(JSON.parse(raw) as JsonRecord);
}

export function deliveryAddressesToJson(addresses: DeliveryAddress[]): string {
  return JSON.stringify(addresses.map(deliveryAddressToRecord));
}

export function deliveryAddressesFromJson(raw: string | null): DeliveryAddress[] {
  return parseArray(raw)
    .map(asRecord)
    .filter((record): record is JsonRecord => record !== null)
    .map(deliveryAddressFromRecord);
}

function paymentMethodToRecord(method: PaymentMethod): JsonRecord {
  return {
    paymentMethodId: method.paymentMethodId,
    type: method.type,
    maskedNumber: method.maskedNumber,
    cardholder: method.cardholder,
    expirationDate: method.expirationDate,
    brand: method.brand,
    isDefault: method.isDefault,
  };
}

function paymentMethodFromRecord(record: JsonRecord): PaymentMethod {
  return new PaymentMethod({
    paymentMethodId: String(record.paymentMethodId ?? ''),
    type: String(record.type ?? ''),
    maskedNumber: String(record.maskedNumber ?? ''),
    cardholder: String(record.cardholder ?? ''),
    expirationDate: String(record.expirationDate ?? ''),
    brand: String(record.brand ?? ''),
    isDefault: Boolean(record.isDefault ?? false),
  });
}

export function paymentMethodToJson(method: PaymentMethod): string {
  return JSON.stringify(paymentMethodToRecord(method));
}

export function paymentMethodFromJson(raw: string): PaymentMethod {
  return paymentMethodFromRecord(JSON.parse(raw) as JsonRecord);
}

export function paymentMethodsToJson(methods: PaymentMethod[]): string {
  return JSON.stringify(methods.map(paymentMethodToRecord));
}

export function paymentMethodsFromJson(raw: string | null): PaymentMethod[] {
  return parseArray(raw)
    .map(asRecord)
    .filter((record): record is JsonRecord => record !== null)
    .map(paymentMethodFromRecord);
}

export function warehouseLocationToJson(location: WarehouseLocation): string {
  return JSON.stringify({
    country: location.country,
    department: location.department,
    city: location.city,
    address: location.address,
    postalCode: location.postalCode,
    coordinates: location.coordinates,
  });
}

export function warehouseLocationFromJson(raw: string): WarehouseLocation {
  const parsed = JSON.parse(raw) as JsonRecord;
  const params: {
    country: string;
    department: string;
    city: string;
    address: string;
    postalCode: string;
    coordinates?: string;
  } = {
    country: String(parsed.country ?? ''),
    department: String(parsed.department ?? ''),
    city: String(parsed.city ?? ''),
    address: String(parsed.address ?? ''),
    postalCode: String(parsed.postalCode ?? ''),
  };
  if (typeof parsed.coordinates === 'string' && parsed.coordinates.length > 0) {
    params.coordinates = parsed.coordinates;
  }
  return new WarehouseLocation(params);
}
