/**
 * Outbound Port: SellerRepositoryPort
 * Source: SDD/Domain/output-ports.md (Section 4.3)
 */

import type { Seller } from '../../entities/Seller.js';
import type { User } from '../../model/user.js';
import { SellerVerificationStatus } from '../../model/enums.js';

export interface SellerRepositoryPort {
  save(seller: Seller): Promise<Seller>;
  findByIdentifier(seller: Seller): Promise<Seller | null>;
  findByUser(user: User): Promise<Seller | null>;
  findByCommercialName(commercialName: string): Promise<Seller | null>;
  findByVerificationStatus(status: SellerVerificationStatus): Promise<Seller[]>;
}
