/**
 * Domain Entity: Store
 * Source: SDD/Domain/domain_model.md (Section 2.4)
 */

import { StoreCategory, StoreStatus } from '../model/enums.js';

export class Store {
  private readonly _storeId: string;
  private readonly _sellerId: string;
  private readonly _name: string;
  private readonly _description: string;
  private readonly _storeCategory: StoreCategory;
  private _status: StoreStatus;
  private readonly _creationDate: Date;

  constructor(params: {
    storeId: string;
    sellerId: string;
    name: string;
    description: string;
    storeCategory: StoreCategory;
    status?: StoreStatus;
    creationDate: Date;
  }) {
    if (!params.storeId || params.storeId.trim().length === 0) {
      throw new Error('Store.storeId is required.');
    }
    if (!params.sellerId || params.sellerId.trim().length === 0) {
      throw new Error('Store.sellerId is required.');
    }
    if (!params.name || params.name.trim().length === 0) {
      throw new Error('Store.name is required.');
    }

    this._storeId = params.storeId.trim();
    this._sellerId = params.sellerId.trim();
    this._name = params.name.trim();
    this._description = params.description.trim();
    this._storeCategory = params.storeCategory;
    this._status = params.status ?? StoreStatus.ACTIVE;
    this._creationDate = params.creationDate;
  }

  get storeId(): string {
    return this._storeId;
  }

  get sellerId(): string {
    return this._sellerId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get storeCategory(): StoreCategory {
    return this._storeCategory;
  }

  get status(): StoreStatus {
    return this._status;
  }

  get creationDate(): Date {
    return this._creationDate;
  }

  activate(): void {
    this._status = StoreStatus.ACTIVE;
  }

  suspend(): void {
    this._status = StoreStatus.SUSPENDED;
  }

  deactivate(): void {
    this._status = StoreStatus.INACTIVE;
  }

  isActive(): boolean {
    return this._status === StoreStatus.ACTIVE;
  }
}
