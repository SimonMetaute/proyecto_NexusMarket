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

function asString(value: string | string[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
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
    res.status(200).json(
      warehouses.map((w) => ({
        warehouseId: w.warehouseId,
        sellerId: w.sellerId,
        name: w.name,
        location: w.location,
        capacity: w.capacity,
        status: w.status,
        creationDate: w.creationDate,
      })),
    );
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
    res.status(200).json(inventory);
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
}
