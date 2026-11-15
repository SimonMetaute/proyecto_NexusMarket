/**
 * Outbound Port: InventoryRepositoryPort
 * Source: SDD/Domain/output-ports.md (Section 4.6)
 */

import type { Inventory } from '../../entities/Inventory.js';
import type { Product } from '../../entities/Product.js';
import type { Warehouse } from '../../entities/Warehouse.js';
import type { Order } from '../../entities/Order.js';

export interface InventoryRepositoryPort {
  save(inventory: Inventory): Promise<Inventory>;
  findByProductAndWarehouse(product: Product, warehouse: Warehouse): Promise<Inventory | null>;
  findByProduct(product: Product): Promise<Inventory[]>;
  findByWarehouse(warehouse: Warehouse): Promise<Inventory[]>;
  hasAvailableStock(product: Product, quantity: any): Promise<boolean>;
  reserve(product: Product, warehouse: Warehouse, quantity: any, order: Order): Promise<Inventory>;
  release(product: Product, warehouse: Warehouse, quantity: any, order: Order): Promise<Inventory>;
  deduct(product: Product, warehouse: Warehouse, quantity: any, order: Order): Promise<Inventory>;
}
