/**
 * Domain Entity: Warehouse
 * Source: SDD/Domain/domain_model.md (Section 2.5)
 */

import { WarehouseStatus } from '../model/enums.js';
import type { WarehouseLocation } from '../model/value-objects.js';

export class Warehouse {
  private readonly _warehouseId: string;
  private readonly _sellerId: string;
  private readonly _name: string;
  private readonly _location: WarehouseLocation;
  private readonly _capacity: number;
  private _status: WarehouseStatus;
  private readonly _creationDate: Date;

  constructor(params: {
    warehouseId: string;
    sellerId: string;
    name: string;
    location: WarehouseLocation;
    capacity: number;
    status?: WarehouseStatus;
    creationDate: Date;
  }) {
    if (!params.warehouseId || params.warehouseId.trim().length === 0) {
      throw new Error('Warehouse.warehouseId is required.');
    }
    if (!params.sellerId || params.sellerId.trim().length === 0) {
      throw new Error('Warehouse.sellerId is required.');
    }
    if (!params.name || params.name.trim().length === 0) {
      throw new Error('Warehouse.name is required.');
    }
    if (typeof params.capacity !== 'number' || params.capacity < 0) {
      throw new Error('Warehouse.capacity must be a non-negative number.');
    }
    if (!(params.location instanceof Object)) {
      throw new Error('Warehouse.location must be a valid WarehouseLocation.');
    }

    this._warehouseId = params.warehouseId.trim();
    this._sellerId = params.sellerId.trim();
    this._name = params.name.trim();
    this._location = params.location;
    this._capacity = params.capacity;
    this._status = params.status ?? WarehouseStatus.OPERATIONAL;
    this._creationDate = params.creationDate;
  }

  get warehouseId(): string {
    return this._warehouseId;
  }

  get sellerId(): string {
    return this._sellerId;
  }

  get name(): string {
    return this._name;
  }

  get location(): WarehouseLocation {
    return this._location;
  }

  get capacity(): number {
    return this._capacity;
  }

  get status(): WarehouseStatus {
    return this._status;
  }

  get creationDate(): Date {
    return this._creationDate;
  }

  setOperational(): void {
    this._status = WarehouseStatus.OPERATIONAL;
  }

  setMaintenance(): void {
    this._status = WarehouseStatus.MAINTENANCE;
  }

  close(): void {
    this._status = WarehouseStatus.CLOSED;
  }

  isOperational(): boolean {
    return this._status === WarehouseStatus.OPERATIONAL;
  }
}
