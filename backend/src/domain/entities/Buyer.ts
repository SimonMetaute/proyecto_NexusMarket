/**
 * Domain Entity: Buyer
 * Source: SDD/Domain/domain_model.md (Section 2.2)
 *
 * DDD purity rules applied:
 *  - No imports of external libraries, frameworks, or infrastructure elements.
 *  - Only TypeScript language built-ins and domain value objects.
 */

import type { DeliveryAddress, PaymentMethod } from '../model/value-objects.js';

export enum BuyerTrustLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export class Buyer {
  private readonly _buyerId: string;
  private readonly _userId: string;
  private _deliveryAddresses: DeliveryAddress[];
  private _paymentMethods: PaymentMethod[];
  private _trustLevel: BuyerTrustLevel;
  private _lastPurchaseDate?: Date;

  constructor(params: {
    buyerId: string;
    userId: string;
    deliveryAddresses?: DeliveryAddress[];
    paymentMethods?: PaymentMethod[];
    trustLevel?: BuyerTrustLevel;
    lastPurchaseDate?: Date;
  }) {
    if (!params.buyerId || params.buyerId.trim().length === 0) {
      throw new Error('Buyer.buyerId is required.');
    }
    if (!params.userId || params.userId.trim().length === 0) {
      throw new Error('Buyer.userId is required.');
    }

    this._buyerId = params.buyerId.trim();
    this._userId = params.userId.trim();
    this._deliveryAddresses = params.deliveryAddresses ?? [];
    this._paymentMethods = params.paymentMethods ?? [];
    this._trustLevel = params.trustLevel ?? BuyerTrustLevel.MEDIUM;
    if (params.lastPurchaseDate !== undefined) {
      this._lastPurchaseDate = params.lastPurchaseDate;
    }
  }

  get buyerId(): string {
    return this._buyerId;
  }

  get userId(): string {
    return this._userId;
  }

  get deliveryAddresses(): DeliveryAddress[] {
    return [...this._deliveryAddresses];
  }

  get paymentMethods(): PaymentMethod[] {
    return [...this._paymentMethods];
  }

  get trustLevel(): BuyerTrustLevel {
    return this._trustLevel;
  }

  get lastPurchaseDate(): Date | undefined {
    return this._lastPurchaseDate;
  }

  addDeliveryAddress(address: DeliveryAddress): void {
    this._deliveryAddresses.push(address);
  }

  addPaymentMethod(method: PaymentMethod): void {
    this._paymentMethods.push(method);
  }

  setTrustLevel(trustLevel: BuyerTrustLevel): void {
    this._trustLevel = trustLevel;
  }

  updateLastPurchaseDate(date: Date): void {
    this._lastPurchaseDate = date;
  }
}
