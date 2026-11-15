import type { RowDataPacket } from 'mysql2/promise';
import type { ProductImageRepositoryPort } from '../../domain/ports/out/ProductImageRepositoryPort.js';
import { ProductImage } from '../../domain/entities/ProductImage.js';
import { getExecutor } from '../database/mysql-transaction.js';
import { toDate, toNumber } from './mappers/rowMappers.js';

interface ProductImageRow extends RowDataPacket {
  imageId: string;
  productId: string;
  url: string;
  altText: string | null;
  position: number | string;
  createdAt: Date | string;
}

function toDomain(row: ProductImageRow): ProductImage {
  const params: {
    imageId: string;
    productId: string;
    url: string;
    altText?: string;
    position: number;
    createdAt: Date;
  } = {
    imageId: row.imageId,
    productId: row.productId,
    url: row.url,
    position: toNumber(row.position),
    createdAt: toDate(row.createdAt),
  };
  if (row.altText !== null) {
    params.altText = row.altText;
  }
  return new ProductImage(params);
}

export class MySQLProductImageRepository implements ProductImageRepositoryPort {
  async save(image: ProductImage): Promise<ProductImage> {
    await getExecutor().execute(
      `INSERT INTO product_images (imageId, productId, url, altText, position, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         url = VALUES(url),
         altText = VALUES(altText),
         position = VALUES(position)`,
      [
        image.imageId,
        image.productId,
        image.url,
        image.altText ?? null,
        image.position,
        image.createdAt,
      ],
    );
    return image;
  }

  async findById(imageId: string): Promise<ProductImage | null> {
    const [rows] = await getExecutor().query<ProductImageRow[]>(
      'SELECT * FROM product_images WHERE imageId = ? LIMIT 1',
      [imageId],
    );
    const row = rows[0];
    return row === undefined ? null : toDomain(row);
  }

  async findByProductId(productId: string): Promise<ProductImage[]> {
    const [rows] = await getExecutor().query<ProductImageRow[]>(
      'SELECT * FROM product_images WHERE productId = ? ORDER BY position ASC, createdAt ASC',
      [productId],
    );
    return rows.map(toDomain);
  }

  async countByProductId(productId: string): Promise<number> {
    const [rows] = await getExecutor().query<Array<RowDataPacket & { total: number | string }>>(
      'SELECT COUNT(*) AS total FROM product_images WHERE productId = ?',
      [productId],
    );
    const row = rows[0];
    return row === undefined ? 0 : toNumber(row.total);
  }

  async delete(imageId: string): Promise<void> {
    await getExecutor().execute('DELETE FROM product_images WHERE imageId = ?', [imageId]);
  }

  async deleteByProductId(productId: string): Promise<void> {
    await getExecutor().execute('DELETE FROM product_images WHERE productId = ?', [productId]);
  }
}
