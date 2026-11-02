/**
 * Outbound Port: ProductVariantRepositoryPort
 * Source: SDD/Domain/output-ports.md (Section 4.5)
 */

import type { ProductVariant } from '../../entities/ProductVariant.js';
import type { Product } from '../../entities/Product.js';

export interface ProductVariantRepositoryPort {
  save(variant: ProductVariant): Promise<ProductVariant>;
  findByIdentifier(variant: ProductVariant): Promise<ProductVariant | null>;
  findByProduct(product: Product): Promise<ProductVariant[]>;
  existsDuplicateVariant(variant: ProductVariant): Promise<boolean>;
}
