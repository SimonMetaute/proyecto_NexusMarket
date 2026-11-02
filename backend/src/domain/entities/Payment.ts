/**
 * Domain Entity: Payment
 * Source: SDD/Domain/domain_model.md (Section 2.13)
 */

import { PaymentStatus } from '../model/enums.js';
import type { Currency, PaymentMethod } from '../model/value-objects.js';

export class Payment {
  private readonly _paymentId: string;
  private readonly _orderId: string;
  private readonly _paymentMethod: PaymentMethod;
  private readonly _amount: number;
  private readonly _currency: Currency;
  private _paymentStatus: PaymentStatus;
  private readonly _externalTransactionId?: string;
  private readonly _processingDate?: Date;

  constructor(params: {
    paymentId: string;
    orderId: string;
    paymentMethod: PaymentMethod;
    amount: number;
    currency: Currency;
    paymentStatus?: PaymentStatus;
    externalTransactionId?: string;
    processingDate?: Date;
  }) {
    if (!params.paymentId || params.paymentId.trim().length === 0) {
      throw new Error('Payment.paymentId is required.');
    }
    if (!params.orderId || params.orderId.trim().length === 0) {
      throw new Error('Payment.orderId is required.');
    }
    if (typeof params.amount !== 'number' || params.amount <= 0) {
      throw new Error('Payment.amount must be greater than zero.');
    }

    this._paymentId = params.paymentId.trim();
    this._orderId = params.orderId.trim();
    this._paymentMethod = params.paymentMethod;
    this._amount = params.amount;
    this._currency = params.currency;
    this._paymentStatus = params.paymentStatus ?? PaymentStatus.PENDING;
    if (params.externalTransactionId !== undefined) {
      this._externalTransactionId = params.externalTransactionId.trim();
    }
    if (params.processingDate !== undefined) {
      this._processingDate = params.processingDate;
    }
  }

  get paymentId(): string {
    return this._paymentId;
  }

  get orderId(): string {
    return this._orderId;
  }

  get paymentMethod(): PaymentMethod {
    return this._paymentMethod;
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): Currency {
    return this._currency;
  }

  get paymentStatus(): PaymentStatus {
    return this._paymentStatus;
  }

  get externalTransactionId(): string | undefined {
    return this._externalTransactionId;
  }

  get processingDate(): Date | undefined {
    return this._processingDate;
  }

  authorize(externalTransactionId?: string): void {
    this._paymentStatus = PaymentStatus.AUTHORIZED;
  }

  reject(): void {
    this._paymentStatus = PaymentStatus.REJECTED;
  }

  refund(): void {
    this._paymentStatus = PaymentStatus.REFUNDED;
  }

  fail(): void {
    this._paymentStatus = PaymentStatus.FAILED;
  }

  isAuthorized(): boolean {
    return this._paymentStatus === PaymentStatus.AUTHORIZED;
  }
}
