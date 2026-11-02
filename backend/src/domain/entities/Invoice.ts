/**
 * Domain Entity: Invoice
 * Source: SDD/Domain/domain_model.md (Section 2.12)
 */

import { InvoiceStatus } from '../model/enums.js';
import type { Currency } from '../model/value-objects.js';

export class Invoice {
  private readonly _invoiceId: string;
  private readonly _orderId: string;
  private readonly _invoiceNumber: string;
  private readonly _issueDate: Date;
  private readonly _subtotal: number;
  private readonly _taxes: number;
  private readonly _total: number;
  private readonly _currency: Currency;
  private _invoiceStatus: InvoiceStatus;

  constructor(params: {
    invoiceId: string;
    orderId: string;
    invoiceNumber: string;
    issueDate: Date;
    subtotal: number;
    taxes: number;
    total: number;
    currency: Currency;
    invoiceStatus?: InvoiceStatus;
  }) {
    if (!params.invoiceId || params.invoiceId.trim().length === 0) {
      throw new Error('Invoice.invoiceId is required.');
    }
    if (!params.orderId || params.orderId.trim().length === 0) {
      throw new Error('Invoice.orderId is required.');
    }
    if (!params.invoiceNumber || params.invoiceNumber.trim().length === 0) {
      throw new Error('Invoice.invoiceNumber is required.');
    }
    if (typeof params.total !== 'number' || params.total < 0) {
      throw new Error('Invoice.total must be a non-negative number.');
    }

    this._invoiceId = params.invoiceId.trim();
    this._orderId = params.orderId.trim();
    this._invoiceNumber = params.invoiceNumber.trim();
    this._issueDate = params.issueDate;
    this._subtotal = params.subtotal;
    this._taxes = params.taxes;
    this._total = params.total;
    this._currency = params.currency;
    this._invoiceStatus = params.invoiceStatus ?? InvoiceStatus.ISSUED;
  }

  get invoiceId(): string {
    return this._invoiceId;
  }

  get orderId(): string {
    return this._orderId;
  }

  get invoiceNumber(): string {
    return this._invoiceNumber;
  }

  get issueDate(): Date {
    return this._issueDate;
  }

  get subtotal(): number {
    return this._subtotal;
  }

  get taxes(): number {
    return this._taxes;
  }

  get total(): number {
    return this._total;
  }

  get currency(): Currency {
    return this._currency;
  }

  get invoiceStatus(): InvoiceStatus {
    return this._invoiceStatus;
  }

  markPaid(): void {
    this._invoiceStatus = InvoiceStatus.PAID;
  }

  cancel(): void {
    this._invoiceStatus = InvoiceStatus.CANCELLED;
  }
}
