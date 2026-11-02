import type { Request, Response } from 'express';
import type {
  CreateProductParams,
  CreateProductUseCase,
} from '../../../application/use-cases/CreateProductUseCase.js';
import type { ListProductsUseCase } from '../../../application/use-cases/ListProductsUseCase.js';
import { ProductCategory, ProductStatus } from '../../../domain/model/enums.js';
import { ApiError } from '../errors/ApiError.js';
import { ProductMapper } from '../mappers/ProductMapper.js';
import {
  optionalNumber,
  optionalString,
  requireObject,
  requireString,
  ValidationError,
} from '../validation/validator.js';

function matchEnum<T extends string>(allowed: readonly T[], raw: string): T | undefined {
  const normalized = raw.trim().toLowerCase();
  return allowed.find((candidate) => candidate.toLowerCase() === normalized);
}

export class ProductController {
  private readonly createProductUseCase: CreateProductUseCase;
  private readonly listProductsUseCase: ListProductsUseCase;

  constructor(createProductUseCase: CreateProductUseCase, listProductsUseCase: ListProductsUseCase) {
    this.createProductUseCase = createProductUseCase;
    this.listProductsUseCase = listProductsUseCase;
  }

  async createProduct(req: Request, res: Response): Promise<void> {
    const body = requireObject(req.body);

    // The catalogue contract uses `price`; the legacy fixture uses `basePrice`.
    const basePrice = optionalNumber(body, 'basePrice');
    const price = optionalNumber(body, 'price') ?? basePrice;
    if (price === undefined) {
      throw new ValidationError('price', 'Required field missing (price or basePrice).');
    }

    const stock = optionalNumber(body, 'stock') ?? 0;
    if (!Number.isInteger(stock) || stock < 0) {
      throw new ValidationError('stock', 'Must be a non-negative integer.');
    }

    const params: CreateProductParams = {
      name: requireString(body, 'name', { maxLength: 255 }),
      description: requireString(body, 'description', { maxLength: 2000 }),
      price,
      sellerId: requireString(body, 'sellerId', { maxLength: 36 }),
      stock,
    };

    if (basePrice !== undefined) {
      params.basePrice = basePrice;
    }

    const sku = optionalString(body, 'sku', { maxLength: 100 });
    if (sku !== undefined) {
      params.sku = sku;
    }

    const brand = optionalString(body, 'brand', { maxLength: 100 });
    if (brand !== undefined) {
      params.brand = brand;
    }

    const rawCategory = optionalString(body, 'category', { maxLength: 100 });
    if (rawCategory !== undefined) {
      const category = matchEnum(Object.values(ProductCategory), rawCategory);
      if (category === undefined) {
        throw ApiError.invalidDomainValue(
          `Invalid product category "${rawCategory}".`,
          { allowed: Object.values(ProductCategory) },
        );
      }
      params.category = category;
    }

    const rawStatus = optionalString(body, 'productStatus', { maxLength: 50 });
    if (rawStatus !== undefined) {
      const productStatus = matchEnum(Object.values(ProductStatus), rawStatus);
      if (productStatus === undefined) {
        throw ApiError.invalidDomainValue(
          `Invalid product status "${rawStatus}".`,
          { allowed: Object.values(ProductStatus) },
        );
      }
      params.productStatus = productStatus;
    }

    const product = await this.createProductUseCase.execute(params);
    res.status(201).json(ProductMapper.toResponse(product));
  }

  async listProducts(_req: Request, res: Response): Promise<void> {
    const products = await this.listProductsUseCase.execute();
    res.status(200).json(products.map(ProductMapper.toResponse));
  }
}
