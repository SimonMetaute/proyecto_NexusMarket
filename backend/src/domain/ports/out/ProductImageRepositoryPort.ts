/**
 * Outbound Port: ProductImageRepositoryPort.
 *
 * Persistence contract for the `ProductImage` child entity. Declares WHAT the
 * domain needs, never HOW it is stored (Dependency Inversion).
 */
import type { ProductImage } from '../../entities/ProductImage.js';

export interface ProductImageRepositoryPort {
  save(image: ProductImage): Promise<ProductImage>;
  findById(imageId: string): Promise<ProductImage | null>;
  findByProductId(productId: string): Promise<ProductImage[]>;
  countByProductId(productId: string): Promise<number>;
  delete(imageId: string): Promise<void>;
  deleteByProductId(productId: string): Promise<void>;
}
