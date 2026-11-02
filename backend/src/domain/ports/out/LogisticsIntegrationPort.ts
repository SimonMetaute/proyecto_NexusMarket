/**
 * Service Port: LogisticsIntegrationPort
 * Source: SDD/Domain/output-ports.md (Section 4.22)
 */

import type { Shipment } from '../../entities/Shipment.js';

export interface DispatchResult {
  dispatched: boolean;
  trackingCode?: string;
}

export interface ShipmentTracking {
  status: string;
  updates: any[];
}

export interface DeliveryConfirmation {
  delivered: boolean;
  date?: Date;
}

export interface LogisticsException {
  resolved: boolean;
}

export interface LogisticsIntegrationPort {
  dispatch(shipment: Shipment): Promise<DispatchResult>;
  getTracking(shipment: Shipment): Promise<ShipmentTracking>;
  confirmDelivery(shipment: Shipment): Promise<DeliveryConfirmation>;
  resolveException(shipment: Shipment): Promise<LogisticsException>;
}
