/**
 * Outbound Port: BuyerRepositoryPort
 * Source: SDD/Domain/output-ports.md (Section 4.2)
 */

import type { Buyer } from '../../entities/Buyer.js';
import type { User } from '../../model/user.js';
import type { BuyerTrustLevel } from '../../entities/Buyer.js';

export interface BuyerRepositoryPort {
  save(buyer: Buyer): Promise<Buyer>;
  findByIdentifier(buyer: Buyer): Promise<Buyer | null>;
  findByUser(user: User): Promise<Buyer | null>;
  findByTrustLevel(trustLevel: BuyerTrustLevel): Promise<Buyer[]>;
}
