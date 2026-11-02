/**
 * Outbound Port: ShoppingCartRepositoryPort
 * Source: SDD/Domain/output-ports.md (Section 4.7)
 */

import type { ShoppingCart } from '../../entities/ShoppingCart.js';
import type { Buyer } from '../../entities/Buyer.js';

export interface ShoppingCartRepositoryPort {
  save(cart: ShoppingCart): Promise<ShoppingCart>;
  findOpenByBuyer(buyer: Buyer): Promise<ShoppingCart | null>;
  findByIdentifier(cart: ShoppingCart): Promise<ShoppingCart | null>;
  delete(cart: ShoppingCart): Promise<void>;
}
