import type { RowDataPacket } from 'mysql2/promise';
import type { ProductVariantRepositoryPort } from '../../domain/ports/out/ProductVariantRepositoryPort.js';
import { ProductVariant } from '../../domain/entities/ProductVariant.js';
import type { Product } from '../../domain/entities/Product.js';
import { pool } from '../database/mysql-pool.js';
import { toNumber } from './mappers/rowMappers.js';

interface ProductVariantRow extends RowDataPacket {
  variantId: string;
  productId: string;
  attribute: string;
  value: string;
  additionalPrice: number | string;
  skuVariant: string;
}

function toDomain(row: ProductVariantRow): ProductVariant {
  return new ProductVariant({
    variantId: row.variantId,
    productId: row.productId,
    attribute: row.attribute,
    value: row.value,
    additionalPrice: toNumber(row.additionalPrice),
    skuVariant: row.skuVariant,
  });
}

export class MySQLProductVariantRepository implements ProductVariantRepositoryPort {
  async save(variant: ProductVariant): Promise<ProductVariant> {
    await pool.execute(
      `INSERT INTO product_variants (variantId, productId, attribute, value, additionalPrice, skuVariant)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         productId = VALUES(productId),
         attribute = VALUES(attribute),
         value = VALUES(value),
         additionalPrice = VALUES(additionalPrice),
         skuVariant = VALUES(skuVariant)`,
      [
        variant.variantId,
        variant.productId,
        variant.attribute,
        variant.value,
        variant.additionalPrice,
        variant.skuVariant,
      ],
    );
    return variant;
  }

  async findByIdentifier(variant: ProductVariant): Promise<ProductVariant | null> {
    const [rows] = await pool.query<ProductVariantRow[]>(
      'SELECT * FROM product_variants WHERE variantId = ? LIMIT 1',
      [variant.variantId],
    );
    const row = rows[0];
    return row === undefined ? null : toDomain(row);
  }

  async findByProduct(product: Product): Promise<ProductVariant[]> {
    const [rows] = await pool.query<ProductVariantRow[]>(
      'SELECT * FROM product_variants WHERE productId = ?',
      [product.productId],
    );
    return rows.map(toDomain);
  }

  async existsDuplicateVariant(variant: ProductVariant): Promise<boolean> {
    const [rows] = await pool.query<ProductVariantRow[]>(
      `SELECT variantId FROM product_variants
       WHERE productId = ? AND attribute = ? AND value = ? AND variantId <> ?
       LIMIT 1`,
      [variant.productId, variant.attribute, variant.value, variant.variantId],
    );
    return rows.length > 0;
  }
}
