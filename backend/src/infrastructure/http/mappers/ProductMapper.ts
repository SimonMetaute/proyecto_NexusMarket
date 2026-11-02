import type { Product } from '../../../domain/entities/Product.js';

export class ProductMapper {
  static toResponse(product: Product): Record<string, unknown> {
    return {
      productId: product.productId,
      name: product.name,
      description: product.description,
      price: product.price,
      sellerId: product.sellerId,
      stock: product.stock,
      createdAt: product.createdAt,
    };
  }
}
