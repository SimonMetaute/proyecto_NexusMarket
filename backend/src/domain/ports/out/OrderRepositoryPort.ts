/**
 * Outbound Port: OrderRepositoryPort
 * Source: SDD/Domain/output-ports.md (Section 4.8)
 */

import type { Order } from '../../entities/Order.js';
import type { Buyer } from '../../entities/Buyer.js';
import type { Seller } from '../../entities/Seller.js';
import { OrderStatus } from '../../model/enums.js';

export interface OrderRepositoryPort {
  save(order: Order): Promise<Order>;
  findByIdentifier(order: Order): Promise<Order | null>;
  findByBuyer(buyer: Buyer): Promise<Order[]>;
  findBySeller(seller: Seller): Promise<Order[]>;
  findByStatus(status: OrderStatus): Promise<Order[]>;
}
