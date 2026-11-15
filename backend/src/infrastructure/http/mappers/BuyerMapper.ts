/**
 * Mapper: Buyer value objects
 * Evita filtrar campos privados (`_addressId`, `_maskedNumber`, ...) en las
 * respuestas HTTP del comprador.
 */
import type {
  DeliveryAddress,
  PaymentMethod,
} from '../../../domain/model/value-objects.js';

export interface DeliveryAddressResponse {
  addressId: string;
  country: string;
  department: string;
  city: string;
  neighborhood: string;
  address: string;
  postalCode: string;
  reference?: string;
  isPrimary: boolean;
}

export interface PaymentMethodResponse {
  paymentMethodId: string;
  type: string;
  maskedNumber: string;
  cardholder: string;
  expirationDate: string;
  brand: string;
  isDefault: boolean;
}

export function toDeliveryAddressResponse(
  address: DeliveryAddress,
): DeliveryAddressResponse {
  const response: DeliveryAddressResponse = {
    addressId: address.addressId,
    country: address.country,
    department: address.department,
    city: address.city,
    neighborhood: address.neighborhood,
    address: address.address,
    postalCode: address.postalCode,
    isPrimary: address.isPrimary,
  };
  if (address.reference !== undefined && address.reference.length > 0) {
    response.reference = address.reference;
  }
  return response;
}

export function toPaymentMethodResponse(
  method: PaymentMethod,
): PaymentMethodResponse {
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
