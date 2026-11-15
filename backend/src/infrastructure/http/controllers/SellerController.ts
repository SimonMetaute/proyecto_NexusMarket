/**
 * Controller: SellerController
 * Endpoints del vendedor (requieren autenticación, rol SELLER).
 */
import type { Request, Response } from 'express';
import type { SellerPort } from '../../../domain/ports/in/SellerPort.js';
import type { User } from '../../../domain/model/user.js';
import { WarehouseStatus } from '../../../domain/model/enums.js';
import { ApiError } from '../errors/ApiError.js';
import {
  optionalString,
  optionalNumber,
  requireObject,
  requireString,
  requireParam,
  requireNumber,
  requirePositiveInt,
  requireEnum,
} from '../validation/validator.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { Seller } from '../../../domain/entities/Seller.js';
import { Warehouse } from '../../../domain/entities/Warehouse.js';
import { Product } from '../../../domain/entities/Product.js';
import { ProductVariant } from '../../../domain/entities/ProductVariant.js';
import { Inventory } from '../../../domain/entities/Inventory.js';
import { WarehouseLocation } from '../../../domain/model/value-objects.js';
import { toWarehouseResponse } from '../mappers/WarehouseMapper.js';
import { ProductMapper } from '../mappers/ProductMapper.js';
import { toProductImageResponse } from '../mappers/ProductImageMapper.js';
import { ProductCategory } from '../../../domain/model/enums.js';

function asString(value: string | string[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

/** Query parameters are typed as `unknown` by Express. */
function queryString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

/** `YYYY-MM-DD` query parameter -> local Date (start or end of that day). */
function parseDay(
  value: string | undefined,
  field: string,
  endOfDay: boolean,
): Date | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw ApiError.invalidRequest(`${field} must use the YYYY-MM-DD format.`, {
      field,
    });
  }
  const parsed = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
  if (Number.isNaN(parsed.getTime())) {
    throw ApiError.invalidRequest(`${field} is not a valid date.`, { field });
  }
  return parsed;
}

/** Settlement window: explicit query params, otherwise the current month. */
function resolveSettlementPeriod(
  startDate: string | undefined,
  endDate: string | undefined,
  now: Date,
): { startDate: Date; endDate: Date } {
  const start =
    parseDay(startDate, 'startDate', false) ??
    new Date(now.getFullYear(), now.getMonth(), 1);
  const end = parseDay(endDate, 'endDate', true) ?? now;
  if (start.getTime() > end.getTime()) {
    throw ApiError.invalidRequest(
      'startDate must be before or equal to endDate.',
      { field: 'startDate' },
    );
  }
  return { startDate: start, endDate: end };
}

export class SellerController {
  private readonly sellerService: SellerPort;

  constructor(sellerService: SellerPort) {
    this.sellerService = sellerService;
  }

  private requireUser(req: Request): User {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    return user;
  }

  async consultMyProfile(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const seller = await this.sellerService.consultMyProfile(user);
    res.status(200).json({
      sellerId: seller.sellerId,
      userId: seller.userId,
      commercialName: seller.commercialName,
      personType: seller.personType,
      verificationStatus: seller.verificationStatus,
      reputation: seller.reputation,
      approvalDate: seller.approvalDate,
    });
  }

  async updateMyProfile(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const body = requireObject(req.body);
    const seller = await this.sellerService.consultMyProfile(user);
    const params: any = {
      sellerId: seller.sellerId,
      userId: seller.userId,
      commercialName: seller.commercialName,
      personType: seller.personType,
      verificationStatus: seller.verificationStatus,
      reputation: seller.reputation,
    };
    if (body.commercialName !== undefined) {
      params.commercialName = requireString(body, 'commercialName', { maxLength: 255 });
    }
    if (seller.approvalDate) {
      params.approvalDate = seller.approvalDate;
    }
    const updated = await this.sellerService.updateMyProfile(
      user,
      new Seller(params),
    );
    res.status(200).json({
      sellerId: updated.sellerId,
      commercialName: updated.commercialName,
      verificationStatus: updated.verificationStatus,
    });
  }

  async consultMyWarehouses(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const warehouses = await this.sellerService.consultMyWarehouses(user);
    res.status(200).json(warehouses.map(toWarehouseResponse));
  }

  async registerWarehouse(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const body = requireObject(req.body);
    const seller = await this.sellerService.consultMyProfile(user);
    const warehouse = new Warehouse({
      warehouseId: requireString(body, 'warehouseId', { maxLength: 36 }),
      sellerId: seller.sellerId,
      name: requireString(body, 'name', { maxLength: 255 }),
      location: new WarehouseLocation({
        country: requireString(body, 'country', { maxLength: 100 }),
        department: requireString(body, 'department', { maxLength: 100 }),
        city: requireString(body, 'city', { maxLength: 100 }),
        address: requireString(body, 'address', { maxLength: 255 }),
        postalCode: requireString(body, 'postalCode', { maxLength: 20 }),
      }),
      capacity: requireNumber(body, 'capacity'),
      status: requireEnum(body, 'status', [
        'Operational',
        'Closed',
        'Maintenance',
      ]) as WarehouseStatus,
      creationDate: new Date(),
    });
    const created = await this.sellerService.registerWarehouse(user, warehouse);
    res.status(201).json({
      warehouseId: created.warehouseId,
      name: created.name,
      status: created.status,
    });
  }

  async createProduct(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const body = requireObject(req.body);
    const seller = await this.sellerService.consultMyProfile(user);
    const basePrice = optionalNumber(body, 'basePrice');
    const price = optionalNumber(body, 'price') ?? basePrice;
    if (price === undefined) {
      throw new ApiError('INVALID_REQUEST', 'price or basePrice is required');
    }
    const stock = optionalNumber(body, 'stock') ?? 0;
    if (price < 0) {
      throw ApiError.invalidDomainValue('price must be greater than or equal to zero');
    }
    if (stock < 0) {
      throw ApiError.invalidDomainValue('stock must be greater than or equal to zero');
    }
    const params: any = {
      name: requireString(body, 'name', { maxLength: 255 }),
      description: requireString(body, 'description', { maxLength: 2000 }),
      price,
      sellerId: seller.sellerId,
      stock,
    };
    if (basePrice !== undefined) params.basePrice = basePrice;
    const sku = optionalString(body, 'sku', { maxLength: 100 });
    if (sku !== undefined) params.sku = sku;
    const brand = optionalString(body, 'brand', { maxLength: 100 });
    if (brand !== undefined) params.brand = brand;
    const rawCategory = optionalString(body, 'category', { maxLength: 100 });
    if (rawCategory !== undefined) {
      params.category = requireEnum(body, 'category', [
        'Electronics', 'Home', 'Clothing and Accessories', 'Beauty', 'Sports',
        'Toys', 'Office', 'Hardware', 'Automotive', 'Other',
      ]);
    }
    const rawStatus = optionalString(body, 'productStatus', { maxLength: 50 });
    if (rawStatus !== undefined) {
      params.productStatus = requireEnum(body, 'productStatus', [
        'Draft', 'Published', 'Inactive', 'Suspended', 'OutOfStock',
      ]);
    }
    const product = new Product({
      productId: globalThis.crypto.randomUUID(),
      ...params,
      createdAt: new Date(),
    } as any);
    const created = await this.sellerService.createProduct(user, product);
    res.status(201).json({
      productId: created.productId,
      name: created.name,
      status: created.productStatus,
      sku: created.sku,
      price: created.price,
    });
  }

  async publishProduct(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const productId = requireParam(asString(req.params.productId), 'productId');
    const product = {
      productId,
      name: '',
      description: '',
      sellerId: '',
      price: 0,
      stock: 0,
      createdAt: new Date(),
    } as any;
    await this.sellerService.publishProduct(user, product);
    res.status(200).json({
      productId,
      status: 'PUBLISHED',
      message: 'Product published successfully',
    });
  }

  async addProductVariant(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const productId = requireParam(asString(req.params.productId), 'productId');
    const body = requireObject(req.body);
    const variant = new ProductVariant({
      variantId: requireString(body, 'variantId', { maxLength: 36 }),
      productId,
      attribute: requireString(body, 'attribute', { maxLength: 100 }),
      value: requireString(body, 'value', { maxLength: 255 }),
      additionalPrice: requireNumber(body, 'additionalPrice'),
      skuVariant: requireString(body, 'skuVariant', { maxLength: 100 }),
    });
    const product = {
      productId,
      name: '',
      description: '',
      sellerId: '',
      price: 0,
      stock: 0,
      createdAt: new Date(),
    } as any;
    const created = await this.sellerService.addProductVariant(user, product, variant);
    res.status(201).json({
      variantId: created.variantId,
      attribute: created.attribute,
      value: created.value,
      skuVariant: created.skuVariant,
    });
  }

  async consultMyInventory(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const inventory = await this.sellerService.consultMyInventory(user);
    res.status(200).json(
      inventory.map((i) => ({
        inventoryId: i.inventoryId,
        productId: i.productId,
        warehouseId: i.warehouseId,
        availableStock: i.availableStock,
        reservedStock: i.reservedStock,
        totalStock: i.totalStock,
        updateDate: i.updateDate,
      })),
    );
  }

  async registerStockEntry(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const body = requireObject(req.body);
    const productId = requireString(body, 'productId', { maxLength: 36 });
    const warehouseId = requireString(body, 'warehouseId', { maxLength: 36 });
    const quantity = requirePositiveInt(body, 'quantity');
    const receiptReference = requireString(body, 'receiptReference', { maxLength: 255 });
    const inventory = new Inventory({
      inventoryId: globalThis.crypto.randomUUID(),
      productId,
      warehouseId,
      availableStock: 0,
      reservedStock: 0,
      totalStock: 0,
      updateDate: new Date(),
    } as any);
    const updated = await this.sellerService.registerStockEntry(
      user,
      inventory,
      { value: quantity },
      receiptReference,
    );
    res.status(200).json({
      inventoryId: updated.inventoryId,
      availableStock: updated.availableStock,
      totalStock: updated.totalStock,
    });
  }

  async consultMyOrdersForFulfillment(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const orders = await this.sellerService.consultMyOrdersForFulfillment(user);
    res.status(200).json(
      orders.map((o) => ({
        orderId: o.orderId,
        buyerId: o.buyerId,
        total: o.total,
        orderStatus: o.orderStatus,
        creationDate: o.creationDate,
      })),
    );
  }

  async approveOrder(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const orderId = requireParam(asString(req.params.orderId), 'orderId');
    const order = {
      orderId,
      buyerId: '',
      sellerId: '',
      orderLines: [],
      subtotal: 0,
      taxes: 0,
      shippingCost: 0,
      total: 0,
      creationDate: new Date(),
    } as any;
    const updated = await this.sellerService.approveOrder(user, order);
    res.status(200).json({
      orderId: updated.orderId,
      orderStatus: updated.orderStatus,
    });
  }

  async prepareOrder(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const orderId = requireParam(asString(req.params.orderId), 'orderId');
    const order = {
      orderId,
      buyerId: '',
      sellerId: '',
      orderLines: [],
      subtotal: 0,
      taxes: 0,
      shippingCost: 0,
      total: 0,
      creationDate: new Date(),
    } as any;
    const updated = await this.sellerService.prepareOrder(user, order);
    res.status(200).json({
      orderId: updated.orderId,
      orderStatus: updated.orderStatus,
    });
  }

  async consultMyProducts(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const products = await this.sellerService.consultMyProducts(user);
    res.status(200).json(products.map(ProductMapper.toResponse));
  }

  async updateMyProduct(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const productId = requireParam(asString(req.params.productId), 'productId');
    const body = requireObject(req.body);

    const changes: Record<string, unknown> = {};
    const name = optionalString(body, 'name', { maxLength: 255 });
    if (name !== undefined) changes.name = name;
    const description = optionalString(body, 'description', { maxLength: 2000 });
    if (description !== undefined) changes.description = description;
    const brand = optionalString(body, 'brand', { maxLength: 100 });
    if (brand !== undefined) changes.brand = brand;
    const sku = optionalString(body, 'sku', { maxLength: 100 });
    if (sku !== undefined) changes.sku = sku;

    const category = optionalString(body, 'category', { maxLength: 100 });
    if (category !== undefined) {
      changes.category = requireEnum(body, 'category', Object.values(ProductCategory));
    }
    const basePrice = optionalNumber(body, 'basePrice');
    if (basePrice !== undefined) changes.basePrice = basePrice;
    const price = optionalNumber(body, 'price');
    if (price !== undefined) changes.price = price;
    const stock = optionalNumber(body, 'stock');
    if (stock !== undefined) changes.stock = stock;

    if (Object.keys(changes).length === 0) {
      throw ApiError.invalidRequest('At least one updatable field is required.');
    }

    const updated = await this.sellerService.updateMyProduct(
      user,
      productId,
      changes as any,
    );
    res.status(200).json(ProductMapper.toResponse(updated));
  }

  async consultProductImages(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const productId = requireParam(asString(req.params.productId), 'productId');
    const images = await this.sellerService.consultProductImages(user, productId);
    res.status(200).json(images.map(toProductImageResponse));
  }

  async addProductImage(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const productId = requireParam(asString(req.params.productId), 'productId');
    const body = requireObject(req.body);
    const url = requireString(body, 'url', { maxLength: 1024 });
    const altText = optionalString(body, 'altText', { maxLength: 255 });
    const position = optionalNumber(body, 'position');
    const image = await this.sellerService.addProductImage(user, productId, {
      url,
      ...(altText !== undefined ? { altText } : {}),
      ...(position !== undefined ? { position } : {}),
    });
    res.status(201).json(toProductImageResponse(image));
  }

  async removeProductImage(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const productId = requireParam(asString(req.params.productId), 'productId');
    const imageId = requireParam(asString(req.params.imageId), 'imageId');
    await this.sellerService.removeProductImage(user, productId, imageId);
    res.status(204).send();
  }

  async consultMyDashboard(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const dashboard = await this.sellerService.consultMyDashboard(user);
    res.status(200).json(dashboard);
  }

  /** Storefront view derived from the seller profile (SDD §5.3). */
  async consultMyStore(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const [store, seller] = await Promise.all([
      this.sellerService.consultMyStore(user),
      this.sellerService.consultMyProfile(user),
    ]);
    res.status(200).json({
      storeId: store.storeId,
      sellerId: store.sellerId,
      storeName: store.name,
      storeDescription: store.description,
      storeCategory: store.storeCategory,
      status: store.status,
      rating: seller.reputation,
      // Reviews are not part of the v1 model yet.
      reviewCount: 0,
      bannerUrl: null,
      logoUrl: null,
      creationDate: store.creationDate,
    });
  }

  /**
   * Settlement report for a period (`startDate`/`endDate`, `YYYY-MM-DD`).
   * Defaults to the current month. Figures come from orders and returns.
   */
  async consultMySettlements(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const now = new Date();
    const period = resolveSettlementPeriod(
      queryString(req.query.startDate),
      queryString(req.query.endDate),
      now,
    );

    const [seller, preview] = await Promise.all([
      this.sellerService.consultMyProfile(user),
      this.sellerService.previewSettlement(user, period),
    ]);

    res.status(200).json({
      sellerId: seller.sellerId,
      period: preview.period,
      currency: preview.currency,
      commissionRate: preview.commissionRate,
      totalSales: preview.total,
      commissionAmount: preview.commissions,
      taxes: preview.taxes,
      deductions: preview.deductions,
      netAmount: preview.netAmount,
      orders: preview.orders,
      deliveredOrders: preview.deliveredOrders,
      pendingReturns: preview.pendingReturns,
      generatedAt: now,
    });
  }
}
