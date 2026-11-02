/**
 * Domain Entity: Seller
 * Source: SDD/Domain/domain_model.md (Section 2.3)
 *
 * DDD purity rules applied:
 *  - No imports of external libraries, frameworks, or infrastructure elements.
 *  - Only TypeScript language built-ins and domain enums.
 */

import { PersonType, SellerVerificationStatus } from '../model/enums.js';

export class Seller {
  private readonly _sellerId: string;
  private readonly _userId: string;
  private readonly _commercialName: string;
  private readonly _personType: PersonType;
  private _verificationStatus: SellerVerificationStatus;
  private readonly _storeId?: string;
  private readonly _commercialAccountId?: string;
  private _reputation: number;
  private readonly _approvalDate?: Date;

  constructor(params: {
    sellerId: string;
    userId: string;
    commercialName: string;
    personType: PersonType;
    verificationStatus?: SellerVerificationStatus;
    storeId?: string;
    commercialAccountId?: string;
    reputation?: number;
    approvalDate?: Date;
  }) {
    if (!params.sellerId || params.sellerId.trim().length === 0) {
      throw new Error('Seller.sellerId is required.');
    }
    if (!params.userId || params.userId.trim().length === 0) {
      throw new Error('Seller.userId is required.');
    }
    if (!params.commercialName || params.commercialName.trim().length === 0) {
      throw new Error('Seller.commercialName is required.');
    }

    this._sellerId = params.sellerId.trim();
    this._userId = params.userId.trim();
    this._commercialName = params.commercialName.trim();
    this._personType = params.personType;
    this._verificationStatus = params.verificationStatus ?? SellerVerificationStatus.PENDING;
    if (params.storeId !== undefined) {
      this._storeId = params.storeId.trim();
    }
    if (params.commercialAccountId !== undefined) {
      this._commercialAccountId = params.commercialAccountId.trim();
    }
    this._reputation = params.reputation ?? 0;
    if (params.approvalDate !== undefined) {
      this._approvalDate = params.approvalDate;
    }
  }

  get sellerId(): string {
    return this._sellerId;
  }

  get userId(): string {
    return this._userId;
  }

  get commercialName(): string {
    return this._commercialName;
  }

  get personType(): PersonType {
    return this._personType;
  }

  get verificationStatus(): SellerVerificationStatus {
    return this._verificationStatus;
  }

  get storeId(): string | undefined {
    return this._storeId;
  }

  get commercialAccountId(): string | undefined {
    return this._commercialAccountId;
  }

  get reputation(): number {
    return this._reputation;
  }

  get approvalDate(): Date | undefined {
    return this._approvalDate;
  }

  approve(): void {
    this._verificationStatus = SellerVerificationStatus.VERIFIED;
  }

  reject(): void {
    this._verificationStatus = SellerVerificationStatus.REJECTED;
  }

  isVerified(): boolean {
    return this._verificationStatus === SellerVerificationStatus.VERIFIED;
  }
}
