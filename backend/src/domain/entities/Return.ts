/**
 * Domain Entity: Return
 * Source: SDD/Domain/domain_model.md (Section 2.15)
 */

import { ReturnReason, ReturnStatus } from '../model/enums.js';

export class Return {
  private readonly _returnId: string;
  private readonly _orderId: string;
  private readonly _invoiceId: string;
  private readonly _reason: ReturnReason;
  private _returnStatus: ReturnStatus;
  private readonly _requestDate: Date;
  private _refundAmount: number;
  private _evidence?: string;

  constructor(params: {
    returnId: string;
    orderId: string;
    invoiceId: string;
    reason: ReturnReason;
    returnStatus?: ReturnStatus;
    requestDate: Date;
    refundAmount: number;
    evidence?: string;
  }) {
    if (!params.returnId || params.returnId.trim().length === 0) {
      throw new Error('Return.returnId is required.');
    }
    if (!params.orderId || params.orderId.trim().length === 0) {
      throw new Error('Return.orderId is required.');
    }
    if (!params.invoiceId || params.invoiceId.trim().length === 0) {
      throw new Error('Return.invoiceId is required.');
    }
    if (typeof params.refundAmount !== 'number' || params.refundAmount < 0) {
      throw new Error('Return.refundAmount must be non-negative.');
    }

    this._returnId = params.returnId.trim();
    this._orderId = params.orderId.trim();
    this._invoiceId = params.invoiceId.trim();
    this._reason = params.reason;
    this._returnStatus = params.returnStatus ?? ReturnStatus.REQUESTED;
    this._requestDate = params.requestDate;
    this._refundAmount = params.refundAmount;
    if (params.evidence !== undefined) {
      this._evidence = params.evidence.trim();
    }
  }

  get returnId(): string {
    return this._returnId;
  }

  get orderId(): string {
    return this._orderId;
  }

  get invoiceId(): string {
    return this._invoiceId;
  }

  get reason(): ReturnReason {
    return this._reason;
  }

  get returnStatus(): ReturnStatus {
    return this._returnStatus;
  }

  get requestDate(): Date {
    return this._requestDate;
  }

  get refundAmount(): number {
    return this._refundAmount;
  }

  get evidence(): string | undefined {
    return this._evidence;
  }

  putInReview(): void {
    this._returnStatus = ReturnStatus.IN_REVIEW;
  }

  approve(): void {
    this._returnStatus = ReturnStatus.APPROVED;
  }

  reject(): void {
    this._returnStatus = ReturnStatus.REJECTED;
  }

  complete(): void {
    this._returnStatus = ReturnStatus.COMPLETED;
  }
}
