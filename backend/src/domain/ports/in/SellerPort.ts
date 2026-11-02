/**
 * Input Port: SellerPort
 * Source: SDD/Domain/input-ports.md (Section 3.3)
 */

import type { User } from '../../model/user.js';
import type { Seller } from '../../entities/Seller.js';
import type { Store } from '../../entities/Store.js';
import type { Warehouse } from '../../entities/Warehouse.js';
import type { Product } from '../../entities/Product.js';
import type { ProductVariant } from '../../entities/ProductVariant.js';
import type { Inventory } from '../../entities/Inventory.js';
import type { Order } from '../../entities/Order.js';
import type { Shipment } from '../../entities/Shipment.js';
import type { Return } from '../../entities/Return.js';
import type { AuditLog } from '../../domain/model/AuditLog.js';

export interface StoreStatus {
  value: string;
}

export interface WarehouseStatus {
  value: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface Payment {
  paymentId: string;
  amount: number;
}

export interface Settlement {
  settlementId: string;
}

export interface SettlementPreview {
  total: number;
  commissions: number;
  netAmount: number;
}

export interface Commission {
  commissionId: string;
  amount: number;
}

export interface SellerPerformanceMetrics {
  totalSales: number;
  totalOrders: number;
  rating: number;
}

export interface Carrier {
  carrierId: string;
  name: string;
}

export interface Quantity {
  value: number;
}

export interface SellerPort {
  // Profile & Store Management
  consultMyProfile(user: User): Promise<Seller>;
  updateMyProfile(user: User, seller: Seller): Promise<Seller>;
  consultMyStore(user: User): Promise<Store>;
  updateMyStore(user: User, store: Store): Promise<Store>;
  changeStoreStatus(user: User, store: Store, newStatus: StoreStatus): Promise<StoreStatus>;
  consultMyCommercialAccount(user: User): Promise<any>;

  // Warehouse Management
  consultMyWarehouses(user: User): Promise<Warehouse[]>;
  registerWarehouse(user: User, warehouse: Warehouse): Promise<Warehouse>;
  updateWarehouse(user: User, warehouse: Warehouse): Promise<Warehouse>;
  changeWarehouseStatus(user: User, warehouse: Warehouse, newStatus: WarehouseStatus): Promise<WarehouseStatus>;

  // Product Catalog Management
  createProduct(user: User, product: Product): Promise<Product>;
  updateProduct(user: User, product: Product): Promise<Product>;
  publishProduct(user: User, product: Product): Promise<void>;
  removeProduct(user: User, product: Product): Promise<void>;
  suspendProduct(user: User, product: Product, reason: string): Promise<void>;

  // Product Variants & Attributes
  addProductVariant(user: User, product: Product, variant: ProductVariant): Promise<ProductVariant>;
  updateProductVariant(user: User, variant: ProductVariant): Promise<ProductVariant>;
  removeProductVariant(user: User, variant: ProductVariant): Promise<void>;
  manageProductAttributes(user: User, product: Product, attributes: ProductAttribute[]): Promise<ProductAttribute[]>;

  // Inventory Management
  consultMyInventory(user: User): Promise<Inventory[]>;
  consultInventoryByProduct(user: User, product: Product, warehouse: Warehouse): Promise<Inventory>;
  registerStockEntry(user: User, inventory: Inventory, quantity: Quantity, receiptReference: string): Promise<Inventory>;
  adjustInventory(user: User, product: Product, warehouse: Warehouse, adjustment: Quantity, reason: string): Promise<Inventory>;
  allocateInventoryForOrder(user: User, order: Order): Promise<void>;

  // Order Management & Fulfillment
  consultMyOrdersForFulfillment(user: User): Promise<Order[]>;
  consultOrderDetails(user: User, order: Order): Promise<Order>;
  approveOrder(user: User, order: Order): Promise<Order>;
  prepareOrder(user: User, order: Order): Promise<Order>;

  // Shipment & Dispatch
  createShipment(user: User, order: Order, warehouse: Warehouse, address: any): Promise<Shipment>;
  selectCarrier(user: User, shipment: Shipment, carrier: Carrier, service: string): Promise<Shipment>;
  dispatchShipment(user: User, shipment: Shipment): Promise<Shipment>;
  consultMyShipments(user: User): Promise<Shipment[]>;
  trackShipment(user: User, shipment: Shipment): Promise<Shipment>;

  // Financial Management & Settlement
  consultPaymentsForMyOrders(user: User): Promise<Payment[]>;
  previewSettlement(user: User, period: DateRange): Promise<SettlementPreview>;
  processSettlement(user: User, settlement: Settlement): Promise<Settlement>;
  consultMyCommissions(user: User, period: DateRange): Promise<Commission[]>;

  // Returns & Refunds (Seller Side)
  consultReturnRequests(user: User): Promise<Return[]>;
  consultReturnDetails(user: User, returnCase: Return): Promise<Return>;
  approveReturn(user: User, returnCase: Return): Promise<Return>;
  rejectReturn(user: User, returnCase: Return, reason: string): Promise<Return>;

  // Performance & Analytics
  consultMyPerformance(user: User): Promise<SellerPerformanceMetrics>;
  consultMyOperationHistory(user: User, period: DateRange): Promise<AuditLog[]>;
}
