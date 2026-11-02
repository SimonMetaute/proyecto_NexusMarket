/**
 * Domain Entity: Shipment
 * Source: SDD/Domain/domain_model.md (Section 2.14)
 */

import { ShipmentStatus } from '../model/enums.js';
import type { DeliveryAddress } from '../model/value-objects.js';

export class Carrier {
  private readonly _carrierId: string;
  private readonly _name: string;
  private readonly _serviceType: string;

  constructor(params: { carrierId: string; name: string; serviceType: string }) {
    if (!params.carrierId || params.carrierId.trim().length === 0) {
      throw new Error('Carrier.carrierId is required.');
    }
    if (!params.name || params.name.trim().length === 0) {
      throw new Error('Carrier.name is required.');
    }

    this._carrierId = params.carrierId.trim();
    this._name = params.name.trim();
    this._serviceType = params.serviceType.trim();
  }

  get carrierId(): string {
    return this._carrierId;
  }

  get name(): string {
    return this._name;
  }

  get serviceType(): string {
    return this._serviceType;
  }
}

export class Shipment {
  private readonly _shipmentId: string;
  private readonly _orderId: string;
  private readonly _warehouseId: string;
  private readonly _deliveryAddress: DeliveryAddress;
  private readonly _carrier: Carrier;
  private readonly _trackingCode: string;
  private _shipmentStatus: ShipmentStatus;
  private readonly _departureDate?: Date;
  private _deliveryDate?: Date;

  constructor(params: {
    shipmentId: string;
    orderId: string;
    warehouseId: string;
    deliveryAddress: DeliveryAddress;
    carrier: Carrier;
    trackingCode: string;
    shipmentStatus?: ShipmentStatus;
    departureDate?: Date;
    deliveryDate?: Date;
  }) {
    if (!params.shipmentId || params.shipmentId.trim().length === 0) {
      throw new Error('Shipment.shipmentId is required.');
    }
    if (!params.orderId || params.orderId.trim().length === 0) {
      throw new Error('Shipment.orderId is required.');
    }
    if (!params.warehouseId || params.warehouseId.trim().length === 0) {
      throw new Error('Shipment.warehouseId is required.');
    }
    if (!params.trackingCode || params.trackingCode.trim().length === 0) {
      throw new Error('Shipment.trackingCode is required.');
    }

    this._shipmentId = params.shipmentId.trim();
    this._orderId = params.orderId.trim();
    this._warehouseId = params.warehouseId.trim();
    this._deliveryAddress = params.deliveryAddress;
    this._carrier = params.carrier;
    this._trackingCode = params.trackingCode.trim();
    this._shipmentStatus = params.shipmentStatus ?? ShipmentStatus.SCHEDULED;
    if (params.departureDate !== undefined) {
      this._departureDate = params.departureDate;
    }
    if (params.deliveryDate !== undefined) {
      this._deliveryDate = params.deliveryDate;
    }
  }

  get shipmentId(): string {
    return this._shipmentId;
  }

  get orderId(): string {
    return this._orderId;
  }

  get warehouseId(): string {
    return this._warehouseId;
  }

  get deliveryAddress(): DeliveryAddress {
    return this._deliveryAddress;
  }

  get carrier(): Carrier {
    return this._carrier;
  }

  get trackingCode(): string {
    return this._trackingCode;
  }

  get shipmentStatus(): ShipmentStatus {
    return this._shipmentStatus;
  }

  get departureDate(): Date | undefined {
    return this._departureDate;
  }

  get deliveryDate(): Date | undefined {
    return this._deliveryDate;
  }

  dispatch(): void {
    this._shipmentStatus = ShipmentStatus.IN_TRANSIT;
  }

  prepare(): void {
    this._shipmentStatus = ShipmentStatus.IN_PREPARATION;
  }

  deliver(): void {
    this._shipmentStatus = ShipmentStatus.DELIVERED;
    this._deliveryDate = new Date();
  }

  fail(): void {
    this._shipmentStatus = ShipmentStatus.FAILED;
  }

  retain(): void {
    this._shipmentStatus = ShipmentStatus.RETAINED;
  }
}
