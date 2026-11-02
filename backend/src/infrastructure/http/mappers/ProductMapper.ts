import type { Product } from '../../../domain/entities/Product.js';

export class ProductMapper {
  /**
   * Maps the domain aggregate to the REST representation. Optional fields are
   * only emitted when present so the payload stays aligned with the domain
   * (no `undefined` keys over the wire).
   */
  static toResponse(product: Product): Record<string, unknown> {
    const response: Record<string, unknown> = {
      productId: product.productId,
      name: product.name,
      description: product.description,
      price: product.price,
      sellerId: product.sellerId,
      stock: product.stock,
      createdAt: product.createdAt,
      productStatus: product.productStatus,
      // Contract §5.4/§5.6 expose the lifecycle state as `status`.
      status: product.productStatus,
    };

    if (product.category !== undefined) {
      response.category = product.category;
    }
    if (product.sku !== undefined) {
      response.sku = product.sku;
    }
    if (product.basePrice !== undefined) {
      response.basePrice = product.basePrice;
    }
    if (product.brand !== undefined) {
      response.brand = product.brand;
    }
    if (product.publicationDate !== undefined) {
      response.publicationDate = product.publicationDate;
    }

    return response;
  }
}
