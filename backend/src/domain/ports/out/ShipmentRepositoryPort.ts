/**
 * Outbound Port: ShipmentRepositoryPort
 * Source: SDD/Domain/output-ports.md (Section 4.11)
 */

import type { Shipment } from '../../entities/Shipment.js';
import type { Order } from '../../entities/Order.js';
import { ShipmentStatus } from '../../model/enums.js';

export interface ShipmentQueryFilters {
  status?: ShipmentStatus;
  warehouseId?: string;
}

export interface ShipmentRepositoryPort {
  save(shipment: Shipment): Promise<Shipment>;
  findByIdentifier(shipment: Shipment): Promise<Shipment | null>;
  findByOrder(order: Order): Promise<Shipment[]>;
  findByTrackingCode(trackingCode: string): Promise<Shipment | null>;
  findByStatus(status: ShipmentStatus): Promise<Shipment[]>;
  /** Operational queue: every shipment, optionally filtered. */
  findAll(filters?: ShipmentQueryFilters): Promise<Shipment[]>;
}
