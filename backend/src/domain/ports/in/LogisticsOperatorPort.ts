/**
 * Input Port: LogisticsOperatorPort
 * Source: SDD/Domain/input-ports.md (Section 3.4)
 */

import type { User } from '../../model/user.js';
import type { Warehouse } from '../../entities/Warehouse.js';
import type { Inventory } from '../../entities/Inventory.js';
import type { Shipment } from '../../entities/Shipment.js';
import type { Order } from '../../entities/Order.js';
import type { Return } from '../../entities/Return.js';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface Quantity {
  value: number;
}

export enum InventoryMovementType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
}

export interface InventoryMovement {
  movementId: string;
  type: InventoryMovementType;
  quantity: number;
  date: Date;
  reason: string;
}

export interface Carrier {
  carrierId: string;
  name: string;
}

export interface ShippingCost {
  amount: number;
  currency: string;
}

export interface ShipmentStatusUpdate {
  status: string;
  date: Date;
  description: string;
}

export interface ShipmentQueueFilters {
  status?: string;
  warehouseId?: string;
}

export interface ReturnQueueFilters {
  status?: string;
}

export interface LogisticsOperatorPort {
  // Warehouse Operations
  consultOperationalWarehouses(user: User): Promise<Warehouse[]>;
  consultWarehouseDetails(user: User, warehouse: Warehouse): Promise<Warehouse>;
  changeWarehouseStatus(user: User, warehouse: Warehouse, newStatus: any): Promise<Warehouse>;

  // Inventory Operations
  consultInventoryByWarehouse(user: User, warehouse: Warehouse): Promise<Inventory[]>;
  registerStockEntry(user: User, inventory: Inventory, quantity: Quantity, receiptReference: string): Promise<Inventory>;
  registerStockMovement(user: User, inventory: Inventory, movementType: InventoryMovementType, quantity: Quantity, reason: string): Promise<Inventory>;
  adjustInventory(user: User, inventory: Inventory, adjustment: Quantity, reason: string): Promise<Inventory>;
  consultInventoryMovementHistory(user: User, warehouse: Warehouse, period: DateRange): Promise<InventoryMovement[]>;

  // Shipment Preparation & Dispatch
  consultShipmentsReadyForDispatch(user: User): Promise<Shipment[]>;
  consultShipments(user: User, filters: ShipmentQueueFilters): Promise<Shipment[]>;
  prepareShipment(user: User, shipment: Shipment): Promise<Shipment>;
  selectCarrier(user: User, shipment: Shipment, carrier: Carrier, service: string): Promise<Shipment>;
  calculateShippingCost(user: User, shipment: Shipment): Promise<ShippingCost>;
  dispatchShipment(user: User, shipment: Shipment): Promise<Shipment>;

  // Shipment Tracking & Exception Handling
  consultActiveShipments(user: User): Promise<Shipment[]>;
  trackShipment(user: User, shipment: Shipment): Promise<Shipment>;
  consultShipmentProgress(user: User, shipment: Shipment): Promise<ShipmentStatusUpdate[]>;
  handleDeliveryException(user: User, shipment: Shipment, exceptionType: string, details: string): Promise<Shipment>;
  confirmDelivery(user: User, shipment: Shipment): Promise<Shipment>;

  // Return Receipt & Processing
  consultReturnShipmentsInTransit(user: User): Promise<Return[]>;
  consultReturns(user: User, filters: ReturnQueueFilters): Promise<Return[]>;
  receiveReturn(user: User, returnCase: Return): Promise<Return>;
  receiveReturnedStock(user: User, shipment: any): Promise<Shipment>;
  registerReturnedStock(user: User, inventory: Inventory, quantity: Quantity, condition: string): Promise<Inventory>;

  // Warehouse Allocation & Optimization
  suggestOptimalWarehouseAllocation(user: User, order: Order): Promise<Warehouse[]>;
  rebalanceInventoryBetweenWarehouses(user: User, product: any, sourceWarehouse: Warehouse, targetWarehouse: Warehouse, quantity: Quantity): Promise<void>;
}
