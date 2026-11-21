/**
 * Domain Entity: Product (Aggregate Root).
 * Source: SDD/Domain/domain_model.md (Section 2.6)
 *
 * DDD purity rules applied:
 *  - No imports of external libraries, frameworks, or infrastructure elements.
 *  - Only TypeScript language built-ins are used.
 *
 *  Type mappings:
 *    UUID     -> string
 *    Decimal  -> number
 *    DateTime -> Date
 */

import { ProductCategory, ProductStatus } from '../model/enums.js';

/**
 * Aggregate Root: Product.
 */
export class Product {
  private readonly _productId: string;
  private _name: string;
  private _description: string;
  private _category?: ProductCategory;
  private _sku?: string;
  private readonly _sellerId: string;
  private _basePrice?: number;
  private _price: number;
  private _productStatus?: ProductStatus;
  private _publicationDate?: Date;
  private _brand?: string;
  private _stock: number;
  private readonly _createdAt: Date;

  constructor(params: {
    productId: string;
    name: string;
    description: string;
    category?: ProductCategory;
    sku?: string;
    sellerId: string;
    basePrice?: number;
    price: number;
    productStatus?: ProductStatus;
    publicationDate?: Date;
    brand?: string;
    stock: number;
    createdAt: Date;
  }) {
    // Local, pure invariants only (no external dependencies).
    if (!params.productId || params.productId.trim().length === 0) {
      throw new Error('Product.productId is required.');
    }
    if (!params.name || params.name.trim().length === 0) {
      throw new Error('Product.name is required.');
    }
    if (!params.description || params.description.trim().length === 0) {
      throw new Error('Product.description is required.');
    }
    if (!params.sellerId || params.sellerId.trim().length === 0) {
      throw new Error('Product.sellerId is required (reference to the Seller aggregate).');
    }
    if (typeof params.price !== 'number' || Number.isNaN(params.price)) {
      throw new Error('Product.price must be a valid number.');
    }
    if (params.price < 0) {
      throw new Error('Product.price cannot be negative.');
    }
    if (typeof params.stock !== 'number' || Number.isNaN(params.stock)) {
      throw new Error('Product.stock must be a valid number.');
    }
    if (params.stock < 0) {
      throw new Error('Product.stock cannot be negative.');
    }
    if (!(params.createdAt instanceof Date) || Number.isNaN(params.createdAt.getTime())) {
      throw new Error('Product.createdAt must be a valid Date.');
    }

    this._productId = params.productId.trim();
    this._name = params.name.trim();
    this._description = params.description.trim();
    if (params.category !== undefined) {
      this._category = params.category;
    }
    if (params.sku !== undefined) {
      this._sku = params.sku.trim();
    }
    this._sellerId = params.sellerId.trim();
    if (params.basePrice !== undefined) {
      this._basePrice = params.basePrice;
    }
    this._price = params.price;
    this._productStatus = params.productStatus ?? ProductStatus.DRAFT;
    if (params.publicationDate !== undefined) {
      this._publicationDate = params.publicationDate;
    }
    if (params.brand !== undefined) {
      this._brand = params.brand.trim();
    }
    this._stock = params.stock;
    this._createdAt = params.createdAt;
  }

  get productId(): string {
    return this._productId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get category(): ProductCategory | undefined {
    return this._category;
  }

  get sku(): string | undefined {
    return this._sku;
  }

  get sellerId(): string {
    return this._sellerId;
  }

  get basePrice(): number | undefined {
    return this._basePrice;
  }

  get price(): number {
    return this._price;
  }

  get productStatus(): ProductStatus | undefined {
    return this._productStatus;
  }

  get publicationDate(): Date | undefined {
    return this._publicationDate;
  }

  get brand(): string | undefined {
    return this._brand;
  }

  get stock(): number {
    return this._stock;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  publish(): void {
    this._productStatus = ProductStatus.PUBLISHED;
    if (this._publicationDate === undefined) {
      this._publicationDate = new Date();
    }
  }

  suspend(): void {
    this._productStatus = ProductStatus.SUSPENDED;
  }

  deactivate(): void {
    this._productStatus = ProductStatus.INACTIVE;
  }

  isPublished(): boolean {
    return this._productStatus === ProductStatus.PUBLISHED;
  }

  /**
   * Applies a partial catalog update while preserving the aggregate identity,
   * ownership and status. Only provided fields change; the caller is
   * responsible for validating ownership and uniqueness at the application
   * layer.
   */
  updateDetails(changes: {
    name?: string;
    description?: string;
    category?: ProductCategory;
    sku?: string;
    basePrice?: number;
    price?: number;
    brand?: string;
    stock?: number;
  }): void {
    if (changes.name !== undefined) {
      if (changes.name.trim().length === 0) {
        throw new Error('Product.name is required.');
      }
      this._name = changes.name.trim();
    }
    if (changes.description !== undefined) {
      if (changes.description.trim().length === 0) {
        throw new Error('Product.description is required.');
      }
      this._description = changes.description.trim();
    }
    if (changes.category !== undefined) {
      this._category = changes.category;
    }
    if (changes.sku !== undefined) {
      this._sku = changes.sku.trim();
    }
    if (changes.basePrice !== undefined) {
      this._basePrice = changes.basePrice;
    }
    if (changes.price !== undefined) {
      if (changes.price < 0) {
        throw new Error('Product.price cannot be negative.');
      }
      this._price = changes.price;
    }
    if (changes.brand !== undefined) {
      this._brand = changes.brand.trim();
    }
    if (changes.stock !== undefined) {
      if (changes.stock < 0) {
        throw new Error('Product.stock cannot be negative.');
      }
      this._stock = changes.stock;
      // Automatic status transition based on stock availability: a published
      // product with zero stock becomes OutOfStock, and restocking an
      // OutOfStock product brings it back to Published.
      if (changes.stock === 0 && this._productStatus === ProductStatus.PUBLISHED) {
        this._productStatus = ProductStatus.OUT_OF_STOCK;
      } else if (changes.stock > 0 && this._productStatus === ProductStatus.OUT_OF_STOCK) {
        this._productStatus = ProductStatus.PUBLISHED;
      }
    }
  }

  hasPublishableData(): boolean {
    return this._sku !== undefined && this._sku.trim().length > 0;
  }
}