import type { ProductRepository } from '../../../domain/ports/out/ProductRepository.js';
import { Product } from '../../../domain/entities/Product.js';

export class InMemoryProductRepository implements ProductRepository {
  private products: Map<string, Product> = new Map();

  async save(product: Product): Promise<void> {
    this.products.set(product.productId, product);
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) ?? null;
  }

  async findAll(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
}