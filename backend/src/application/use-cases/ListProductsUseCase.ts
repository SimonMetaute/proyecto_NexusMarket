/**
 * Application Use Case: ListProducts.
 *
 * Orchestrates the "list all products" flow by coordinating the domain
 * (the `Product` aggregate) with an outbound port (`ProductRepository`).
 *
 * DDD / Clean Architecture rules applied:
 *  - Depends only on the `ProductRepository` INTERFACE (injected via constructor),
 *    never on a concrete database or an HTTP framework.
 *  - Contains NO database access, NO Express/HTTP code, and NO external
 *    libraries. Only domain entities, the port interface, and language
 *    built-ins are used.
 */
import { Product } from '../../domain/entities/Product.js';
import type { ProductRepository } from '../../domain/ports/out/ProductRepository.js';

export class ListProductsUseCase {
  private readonly productRepository: ProductRepository;

  constructor(productRepository: ProductRepository) {
    this.productRepository = productRepository;
  }

  async execute(): Promise<Product[]> {
    return this.productRepository.findAll();
  }
}