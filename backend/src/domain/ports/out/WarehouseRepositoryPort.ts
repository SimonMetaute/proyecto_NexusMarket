/**
 * Outbound Port: WarehouseRepositoryPort
 * Source: SDD/Domain/output-ports.md (Section 4.13)
 */

import type { Warehouse } from '../../entities/Warehouse.js';
import type { Seller } from '../../entities/Seller.js';
import { WarehouseStatus } from '../../model/enums.js';

export interface WarehouseRepositoryPort {
  save(warehouse: Warehouse): Promise<Warehouse>;
  findByIdentifier(warehouse: Warehouse): Promise<Warehouse | null>;
  findBySeller(seller: Seller): Promise<Warehouse[]>;
  findByStatus(status: WarehouseStatus): Promise<Warehouse[]>;
}
