/**
 * Application Service: PublicAccessService
 * Implements PublicAccessPort
 */

import type { PublicAccessPort, SearchCriteria } from '../../domain/ports/in/PublicAccessPort.js';
import type { UserRepository } from '../../domain/ports/out/UserRepository.js';
import type { ProductRepository } from '../../domain/ports/out/ProductRepository.js';
import type { BuyerRepositoryPort } from '../../domain/ports/out/BuyerRepositoryPort.js';
import type { AuditLogRepository } from '../../domain/ports/out/AuditLogRepository.js';
import { User } from '../../domain/model/user.js';
import { Buyer } from '../../domain/entities/Buyer.js';
import { Product } from '../../domain/entities/Product.js';

export class PublicAccessService implements PublicAccessPort {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly productRepository: ProductRepository,
    private readonly buyerRepository: BuyerRepositoryPort,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async login(email: string, password: string): Promise<User> {
    // This would typically use LoginUseCase logic
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    return user;
  }

  async logout(user: User): Promise<void> {
    // Implementation would invalidate token
  }

  async registerBuyer(buyer: Buyer): Promise<User> {
    // Create user for buyer
    const user = await this.userRepository.findByEmail(buyer['userId']); // simplified
    if (!user) {
      throw new Error('User not found');
    }
    await this.buyerRepository.save(buyer);
    return user;
  }

  async searchPublicCatalog(criteria: SearchCriteria): Promise<Product[]> {
    const products = await this.productRepository.findAll();
    // Apply filters if needed
    return products;
  }

  async consultPublicProductDetails(product: Product): Promise<Product> {
    const found = await this.productRepository.findById(product.productId);
    if (!found) {
      throw new Error('Product not found');
    }
    return found;
  }
}
