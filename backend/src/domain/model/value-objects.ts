/**
 * Domain Value Objects - NexusMarket
 * Source: SDD/Domain/domain_model.md (Section 5)
 *
 * DDD purity rules applied:
 *  - No imports of external libraries, frameworks, or infrastructure elements.
 *  - Immutable by design.
 */

import { CurrencyCode } from './enums.js';

export class Currency {
  private readonly _code: CurrencyCode;
  private readonly _name: string;
  private readonly _symbol: string;
  private readonly _decimals: number;

  constructor(params: { code: CurrencyCode; name: string; symbol: string; decimals: number }) {
    if (!params.name || params.name.trim().length === 0) {
      throw new Error('Currency.name is required.');
    }
    if (!params.symbol || params.symbol.trim().length === 0) {
      throw new Error('Currency.symbol is required.');
    }
    if (typeof params.decimals !== 'number' || params.decimals < 0) {
      throw new Error('Currency.decimals must be a non-negative number.');
    }

    this._code = params.code;
    this._name = params.name.trim();
    this._symbol = params.symbol.trim();
    this._decimals = params.decimals;
  }

  get code(): CurrencyCode {
    return this._code;
  }

  get name(): string {
    return this._name;
  }

  get symbol(): string {
    return this._symbol;
  }

  get decimals(): number {
    return this._decimals;
  }

  static COP(): Currency {
    return new Currency({ code: CurrencyCode.COP, name: 'Colombian Peso', symbol: '$', decimals: 2 });
  }

  static USD(): Currency {
    return new Currency({ code: CurrencyCode.USD, name: 'US Dollar', symbol: '$', decimals: 2 });
  }

  static EUR(): Currency {
    return new Currency({ code: CurrencyCode.EUR, name: 'Euro', symbol: '€', decimals: 2 });
  }
}

export class DeliveryAddress {
  private readonly _addressId: string;
  private readonly _country: string;
  private readonly _department: string;
  private readonly _city: string;
  private readonly _neighborhood: string;
  private readonly _address: string;
  private readonly _postalCode: string;
  private readonly _reference: string;
  private readonly _isPrimary: boolean;

  constructor(params: {
    addressId: string;
    country: string;
    department: string;
    city: string;
    neighborhood: string;
    address: string;
    postalCode: string;
    reference: string;
    isPrimary?: boolean;
  }) {
    if (!params.addressId || params.addressId.trim().length === 0) {
      throw new Error('DeliveryAddress.addressId is required.');
    }
    if (!params.country || params.country.trim().length === 0) {
      throw new Error('DeliveryAddress.country is required.');
    }
    if (!params.city || params.city.trim().length === 0) {
      throw new Error('DeliveryAddress.city is required.');
    }
    if (!params.address || params.address.trim().length === 0) {
      throw new Error('DeliveryAddress.address is required.');
    }

    this._addressId = params.addressId.trim();
    this._country = params.country.trim();
    this._department = params.department.trim();
    this._city = params.city.trim();
    this._neighborhood = params.neighborhood.trim();
    this._address = params.address.trim();
    this._postalCode = params.postalCode.trim();
    this._reference = params.reference.trim();
    this._isPrimary = params.isPrimary ?? false;
  }

  get addressId(): string {
    return this._addressId;
  }

  get country(): string {
    return this._country;
  }

  get department(): string {
    return this._department;
  }

  get city(): string {
    return this._city;
  }

  get neighborhood(): string {
    return this._neighborhood;
  }

  get address(): string {
    return this._address;
  }

  get postalCode(): string {
    return this._postalCode;
  }

  get reference(): string {
    return this._reference;
  }

  get isPrimary(): boolean {
    return this._isPrimary;
  }
}

export class PaymentMethod {
  private readonly _paymentMethodId: string;
  private readonly _type: string;
  private readonly _maskedNumber: string;
  private readonly _cardholder: string;
  private readonly _expirationDate: string;
  private readonly _brand: string;
  private readonly _isDefault: boolean;

  constructor(params: {
    paymentMethodId: string;
    type: string;
    maskedNumber: string;
    cardholder: string;
    expirationDate: string;
    brand: string;
    isDefault?: boolean;
  }) {
    if (!params.paymentMethodId || params.paymentMethodId.trim().length === 0) {
      throw new Error('PaymentMethod.paymentMethodId is required.');
    }
    if (!params.type || params.type.trim().length === 0) {
      throw new Error('PaymentMethod.type is required.');
    }
    if (!params.maskedNumber || params.maskedNumber.trim().length === 0) {
      throw new Error('PaymentMethod.maskedNumber is required.');
    }

    this._paymentMethodId = params.paymentMethodId.trim();
    this._type = params.type.trim();
    this._maskedNumber = params.maskedNumber.trim();
    this._cardholder = params.cardholder.trim();
    this._expirationDate = params.expirationDate.trim();
    this._brand = params.brand.trim();
    this._isDefault = params.isDefault ?? false;
  }

  get paymentMethodId(): string {
    return this._paymentMethodId;
  }

  get type(): string {
    return this._type;
  }

  get maskedNumber(): string {
    return this._maskedNumber;
  }

  get cardholder(): string {
    return this._cardholder;
  }

  get expirationDate(): string {
    return this._expirationDate;
  }

  get brand(): string {
    return this._brand;
  }

  get isDefault(): boolean {
    return this._isDefault;
  }
}

export class WarehouseLocation {
  private readonly _country: string;
  private readonly _department: string;
  private readonly _city: string;
  private readonly _address: string;
  private readonly _postalCode: string;
  private readonly _coordinates?: string;

  constructor(params: {
    country: string;
    department: string;
    city: string;
    address: string;
    postalCode: string;
    coordinates?: string;
  }) {
    if (!params.country || params.country.trim().length === 0) {
      throw new Error('WarehouseLocation.country is required.');
    }
    if (!params.city || params.city.trim().length === 0) {
      throw new Error('WarehouseLocation.city is required.');
    }
    if (!params.address || params.address.trim().length === 0) {
      throw new Error('WarehouseLocation.address is required.');
    }

    this._country = params.country.trim();
    this._department = params.department.trim();
    this._city = params.city.trim();
    this._address = params.address.trim();
    this._postalCode = params.postalCode.trim();
    if (params.coordinates !== undefined) {
      this._coordinates = params.coordinates.trim();
    }
  }

  get country(): string {
    return this._country;
  }

  get department(): string {
    return this._department;
  }

  get city(): string {
    return this._city;
  }

  get address(): string {
    return this._address;
  }

  get postalCode(): string {
    return this._postalCode;
  }

  get coordinates(): string | undefined {
    return this._coordinates;
  }
}

export class ProductPrice {
  private readonly _baseValue: number;
  private readonly _currency: Currency;
  private readonly _appliedTax: number;
  private readonly _finalPrice: number;

  constructor(params: { baseValue: number; currency: Currency; appliedTax: number }) {
    if (typeof params.baseValue !== 'number' || params.baseValue < 0) {
      throw new Error('ProductPrice.baseValue must be a non-negative number.');
    }
    if (typeof params.appliedTax !== 'number' || params.appliedTax < 0) {
      throw new Error('ProductPrice.appliedTax must be a non-negative number.');
    }

    this._baseValue = params.baseValue;
    this._currency = params.currency;
    this._appliedTax = params.appliedTax;
    this._finalPrice = params.baseValue + params.appliedTax;
  }

  get baseValue(): number {
    return this._baseValue;
  }

  get currency(): Currency {
    return this._currency;
  }

  get appliedTax(): number {
    return this._appliedTax;
  }

  get finalPrice(): number {
    return this._finalPrice;
  }
}
