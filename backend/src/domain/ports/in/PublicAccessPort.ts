/**
 * Input Port: PublicAccessPort
 * Source: SDD/Domain/input-ports.md (Section 3.1)
 */

import type { User } from '../../model/user.js';
import type { Buyer } from '../../entities/Buyer.js';
import type { Product } from '../../entities/Product.js';

export interface SearchCriteria {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface PublicAccessPort {
  login(email: string, password: string): Promise<User>;
  logout(user: User): Promise<void>;
  registerBuyer(buyer: Buyer): Promise<User>;
  searchPublicCatalog(criteria: SearchCriteria): Promise<Product[]>;
  consultPublicProductDetails(product: Product): Promise<Product>;
}
