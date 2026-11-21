/**
 * Controller: CatalogController
 * Endpoints públicos de catálogo (no requieren autenticación).
 */
import type { Request, Response } from 'express';
import type { PublicAccessPort } from '../../../domain/ports/in/PublicAccessPort.js';
import type { ProductImageRepositoryPort } from '../../../domain/ports/out/ProductImageRepositoryPort.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { optionalString, requireParam } from '../validation/validator.js';

function asString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? String(value[0]) : undefined;
  }
  return String(value);
}

function queryNumber(value: unknown): number | undefined {
  const s = asString(value);
  if (s === undefined) {
    return undefined;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export class CatalogController {
  private readonly publicAccess: PublicAccessPort;
  private readonly productImageRepository: ProductImageRepositoryPort;

  constructor(
    publicAccess: PublicAccessPort,
    productImageRepository: ProductImageRepositoryPort,
  ) {
    this.publicAccess = publicAccess;
    this.productImageRepository = productImageRepository;
  }

  async searchProducts(req: Request, res: Response): Promise<void> {
    const criteria: any = {};
    const category = asString(req.query.category);
    if (category !== undefined) {
      criteria.category = category;
    }
    const search = asString(req.query.search);
    if (search !== undefined) {
      criteria.query = search;
    }
    const minPrice = queryNumber(req.query.minPrice);
    if (minPrice !== undefined) {
      criteria.minPrice = minPrice;
    }
    const maxPrice = queryNumber(req.query.maxPrice);
    if (maxPrice !== undefined) {
      criteria.maxPrice = maxPrice;
    }
    const page = queryNumber(req.query.page) ?? 1;
    const limit = queryNumber(req.query.limit) ?? 20;

    const products = await this.publicAccess.searchPublicCatalog(criteria);
    const start = (page - 1) * limit;
    const paginated = products.slice(start, start + limit);

    const productsWithImages = await Promise.all(
      paginated.map(async (p) => {
        const images = await this.productImageRepository.findByProductId(p.productId);
        return {
          productId: p.productId,
          name: p.name,
          description: p.description,
          category: p.category,
          price: p.price,
          currency: 'USD',
          seller: { sellerId: p.sellerId },
          brand: p.brand,
          sku: p.sku,
          productStatus: p.productStatus,
          stock: p.stock,
          images: images.map((img) => ({
            imageId: img.imageId,
            productId: img.productId,
            url: img.url,
            altText: img.altText,
            position: img.position,
            createdAt: img.createdAt instanceof Date ? img.createdAt.toISOString() : String(img.createdAt),
          })),
        };
      }),
    );

    res.status(200).json({
      total: products.length,
      page,
      limit,
      products: productsWithImages,
    });
  }

  async getProductDetails(req: Request, res: Response): Promise<void> {
    const productId = requireParam(asString(req.params.productId), 'productId');
    const product = await this.publicAccess.consultPublicProductDetails({
      productId,
      name: '',
      description: '',
      sellerId: '',
      price: 0,
      stock: 0,
      createdAt: new Date(),
    } as any);
    const images = await this.productImageRepository.findByProductId(productId);
    res.status(200).json({
      productId: product.productId,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      currency: 'USD',
      seller: { sellerId: product.sellerId },
      brand: product.brand,
      sku: product.sku,
      productStatus: product.productStatus,
      publicationDate: product.publicationDate,
      stock: product.stock,
      createdAt: product.createdAt,
      images: images.map((img) => ({
        imageId: img.imageId,
        productId: img.productId,
        url: img.url,
        altText: img.altText,
        position: img.position,
        createdAt: img.createdAt instanceof Date ? img.createdAt.toISOString() : String(img.createdAt),
      })),
    });
  }
}
