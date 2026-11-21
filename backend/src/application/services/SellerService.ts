/**
 * Application Service: SellerService
 * Implements SellerPort
 *
 * Lógica de negocio del vendedor: perfil, tienda, productos, variantes,
 * inventario, pedidos para fulfillment y envíos.
 */
import type {
  SellerPort,
  StoreStatus,
  DateRange,
  ProductAttribute,
  Payment,
  Settlement,
  SettlementPreview,
  Commission,
  SellerPerformanceMetrics,
  Carrier,
  Quantity,
  ProductUpdateInput,
  AddProductImageInput,
  SellerDashboard,
} from '../../domain/ports/in/SellerPort.js';
import type { User } from '../../domain/model/user.js';
import type { Seller } from '../../domain/entities/Seller.js';
import type { Buyer } from '../../domain/entities/Buyer.js';
import { Store } from '../../domain/entities/Store.js';
import { Warehouse } from '../../domain/entities/Warehouse.js';
import { WarehouseLocation } from '../../domain/model/value-objects.js';
import type { Product } from '../../domain/entities/Product.js';
import type { ProductCategory } from '../../domain/model/enums.js';
import { ProductImage } from '../../domain/entities/ProductImage.js';
import type { ProductImageRepositoryPort } from '../../domain/ports/out/ProductImageRepositoryPort.js';
import type { AnalyticsRepositoryPort } from '../../domain/ports/out/AnalyticsRepositoryPort.js';
import type { ProductVariant } from '../../domain/entities/ProductVariant.js';
import { Inventory } from '../../domain/entities/Inventory.js';
import type { Order } from '../../domain/entities/Order.js';
import type { Shipment } from '../../domain/entities/Shipment.js';
import { Carrier as ShipmentCarrier, Shipment as ShipmentEntity } from '../../domain/entities/Shipment.js';
import type { Return } from '../../domain/entities/Return.js';
import { AuditLog } from '../../domain/model/AuditLog.js';
import { DeliveryAddress } from '../../domain/model/value-objects.js';
import type { SellerRepositoryPort } from '../../domain/ports/out/SellerRepositoryPort.js';
import type { ProductRepository } from '../../domain/ports/out/ProductRepository.js';
import type { OrderRepositoryPort } from '../../domain/ports/out/OrderRepositoryPort.js';
import type { InventoryRepositoryPort } from '../../domain/ports/out/InventoryRepositoryPort.js';
import type { ProductVariantRepositoryPort } from '../../domain/ports/out/ProductVariantRepositoryPort.js';
import type { WarehouseRepositoryPort } from '../../domain/ports/out/WarehouseRepositoryPort.js';
import type { ShipmentRepositoryPort } from '../../domain/ports/out/ShipmentRepositoryPort.js';
import type { BuyerRepositoryPort } from '../../domain/ports/out/BuyerRepositoryPort.js';
import type { TransactionManagerPort } from '../../domain/ports/out/TransactionManagerPort.js';
import type { AuditLogRepository } from '../../domain/ports/out/AuditLogRepository.js';
import {
  ProductStatus,
  SellerVerificationStatus,
  ShipmentStatus,
  StoreCategory,
  StoreStatus as StoreLifecycleStatus,
  WarehouseStatus,
} from '../../domain/model/enums.js';
import { ApiError } from '../../domain/errors/ApiError.js';

export class SellerService implements SellerPort {
  constructor(
    private readonly sellerRepository: SellerRepositoryPort,
    private readonly productRepository: ProductRepository,
    private readonly orderRepository: OrderRepositoryPort,
    private readonly inventoryRepository: InventoryRepositoryPort,
    private readonly variantRepository: ProductVariantRepositoryPort,
    private readonly warehouseRepository: WarehouseRepositoryPort,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly productImageRepository: ProductImageRepositoryPort,
    private readonly analyticsRepository: AnalyticsRepositoryPort,
    private readonly shipmentRepository: ShipmentRepositoryPort,
    private readonly buyerRepository: BuyerRepositoryPort,
    private readonly transactionManager: TransactionManagerPort,
  ) {}

  // --- Profile & Store Management ---
  async consultMyProfile(user: User): Promise<Seller> {
    const seller = await this.sellerRepository.findByUser(user);
    if (!seller) {
      throw ApiError.notFound(`Seller profile not found for user ${user.userId}`);
    }
    return seller;
  }

  async updateMyProfile(user: User, seller: Seller): Promise<Seller> {
    const existing = await this.sellerRepository.findByUser(user);
    if (!existing) {
      throw ApiError.notFound(`Seller profile not found for user ${user.userId}`);
    }
    if (existing.sellerId !== seller.sellerId) {
      throw ApiError.forbidden('Cannot modify another seller profile');
    }
    return this.sellerRepository.save(seller);
  }

  /**
   * The storefront is derived from the seller's approved profile: there is no
   * separate `stores` table, so the identity is deterministic (`storeId` =
   * `sellerId`) and the category is inferred from the published catalogue.
   */
  async consultMyStore(user: User): Promise<Store> {
    const seller = await this.sellerRepository.findByUser(user);
    if (!seller) {
      throw ApiError.notFound(`Seller profile not found for user ${user.userId}`);
    }
    const products = await this.productRepository.findBySellerId(seller.sellerId);
    return new Store({
      storeId: seller.sellerId,
      sellerId: seller.sellerId,
      name: seller.commercialName,
      description: `Tienda oficial de ${seller.commercialName}`,
      storeCategory: dominantStoreCategory(products),
      status: storeStatusFor(seller.verificationStatus),
      creationDate: seller.approvalDate ?? new Date(),
    });
  }

  async updateMyStore(user: User, store: Store): Promise<Store> {
    return store;
  }

  async changeStoreStatus(user: User, store: Store, newStatus: StoreStatus): Promise<StoreStatus> {
    return newStatus;
  }

  async consultMyCommercialAccount(user: User): Promise<any> {
    return {};
  }

  // --- Warehouse Management ---
  async consultMyWarehouses(user: User): Promise<Warehouse[]> {
    const seller = await this.sellerRepository.findByUser(user);
    if (!seller) {
      throw ApiError.notFound(`Seller profile not found for user ${user.userId}`);
    }
    return this.warehouseRepository.findBySeller(seller);
  }

  async registerWarehouse(user: User, warehouse: Warehouse): Promise<Warehouse> {
    const seller = await this.sellerRepository.findByUser(user);
    if (!seller) {
      throw ApiError.notFound(`Seller profile not found for user ${user.userId}`);
    }
    if (warehouse.sellerId !== seller.sellerId) {
      throw ApiError.forbidden('Cannot register warehouse for another seller');
    }
    return this.warehouseRepository.save(warehouse);
  }

  async updateWarehouse(user: User, warehouse: Warehouse): Promise<Warehouse> {
    return this.warehouseRepository.save(warehouse);
  }

  async changeWarehouseStatus(user: User, warehouse: Warehouse, newStatus: any): Promise<any> {
    return newStatus;
  }

  // --- Product Catalog Management ---
  async createProduct(user: User, product: Product): Promise<Product> {
    const seller = await this.sellerRepository.findByUser(user);
    if (!seller) {
      throw ApiError.notFound(`Seller profile not found for user ${user.userId}`);
    }
    if (product.sellerId !== seller.sellerId) {
      throw ApiError.forbidden('Cannot create products for another seller');
    }
    await this.productRepository.save(product);

    await this.auditLogRepository.save(
      new AuditLog({
        id: globalThis.crypto.randomUUID(),
        actorId: user.userId,
        action: 'PRODUCT_MODIFICATION',
        timestamp: new Date(),
        details: { productId: product.productId, sellerId: product.sellerId },
      }),
    );
    return product;
  }

  async updateProduct(user: User, product: Product): Promise<Product> {
    const seller = await this.sellerRepository.findByUser(user);
    if (!seller) {
      throw ApiError.notFound(`Seller profile not found for user ${user.userId}`);
    }
    if (product.sellerId !== seller.sellerId) {
      throw ApiError.forbidden('Cannot update products for another seller');
    }
    await this.productRepository.save(product);
    return product;
  }

  async consultMyProducts(user: User): Promise<Product[]> {
    const seller = await this.sellerRepository.findByUser(user);
    if (!seller) {
      throw ApiError.notFound(`Seller profile not found for user ${user.userId}`);
    }
    return this.productRepository.findBySellerId(seller.sellerId);
  }

  private async requireOwnedProduct(user: User, productId: string): Promise<Product> {
    const seller = await this.sellerRepository.findByUser(user);
    if (!seller) {
      throw ApiError.notFound(`Seller profile not found for user ${user.userId}`);
    }
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw ApiError.notFound(`Product ${productId} not found`);
    }
    if (product.sellerId !== seller.sellerId) {
      throw ApiError.forbidden('Cannot modify another seller product');
    }
    return product;
  }

  async updateMyProduct(
    user: User,
    productId: string,
    changes: ProductUpdateInput,
  ): Promise<Product> {
    const product = await this.requireOwnedProduct(user, productId);
    product.updateDetails(changes);
    await this.productRepository.save(product);

    await this.auditLogRepository.save(
      new AuditLog({
        id: globalThis.crypto.randomUUID(),
        actorId: user.userId,
        action: 'PRODUCT_MODIFICATION',
        timestamp: new Date(),
        details: { productId: product.productId, fields: Object.keys(changes) },
      }),
    );
    return product;
  }

  async publishProduct(user: User, product: Product): Promise<void> {
    const seller = await this.sellerRepository.findByUser(user);
    if (!seller) {
      throw ApiError.notFound(`Seller profile not found for user ${user.userId}`);
    }
    if (!seller.isVerified()) {
      throw ApiError.forbidden('Only verified sellers can publish products');
    }
    const found = await this.productRepository.findById(product.productId);
    if (!found) {
      throw ApiError.notFound(`Product ${product.productId} not found`);
    }
    if (found.sellerId !== seller.sellerId) {
      throw ApiError.forbidden('Cannot publish another seller product');
    }
    if (!found.hasPublishableData()) {
      throw ApiError.invalidDomainValue(
        'Product must have an SKU before it can be published.',
        { field: 'sku' },
      );
    }
    const imageCount = await this.productImageRepository.countByProductId(found.productId);
    if (imageCount === 0) {
      throw ApiError.invalidDomainValue(
        'Product must have at least one image before it can be published.',
        { field: 'images' },
      );
    }
    found.publish();
    await this.productRepository.save(found);

    await this.auditLogRepository.save(
      new AuditLog({
        id: globalThis.crypto.randomUUID(),
        actorId: user.userId,
        action: 'PRODUCT_PUBLICATION',
        timestamp: new Date(),
        details: { productId: found.productId },
      }),
    );
  }

  // --- Product Images ---
  async consultProductImages(user: User, productId: string): Promise<ProductImage[]> {
    await this.requireOwnedProduct(user, productId);
    return this.productImageRepository.findByProductId(productId);
  }

  async addProductImage(
    user: User,
    productId: string,
    input: AddProductImageInput,
  ): Promise<ProductImage> {
    await this.requireOwnedProduct(user, productId);
    const position =
      input.position ?? (await this.productImageRepository.countByProductId(productId));
    const image = new ProductImage({
      imageId: globalThis.crypto.randomUUID(),
      productId,
      url: input.url,
      ...(input.altText !== undefined ? { altText: input.altText } : {}),
      position,
      createdAt: new Date(),
    });
    await this.productImageRepository.save(image);

    await this.auditLogRepository.save(
      new AuditLog({
        id: globalThis.crypto.randomUUID(),
        actorId: user.userId,
        action: 'PRODUCT_MODIFICATION',
        timestamp: new Date(),
        details: { productId, imageId: image.imageId, operation: 'image.added' },
      }),
    );
    return image;
  }

  async removeProductImage(user: User, productId: string, imageId: string): Promise<void> {
    await this.requireOwnedProduct(user, productId);
    const image = await this.productImageRepository.findById(imageId);
    if (!image || image.productId !== productId) {
      throw ApiError.notFound(`Image ${imageId} not found for product ${productId}`);
    }
    await this.productImageRepository.delete(imageId);

    await this.auditLogRepository.save(
      new AuditLog({
        id: globalThis.crypto.randomUUID(),
        actorId: user.userId,
        action: 'PRODUCT_MODIFICATION',
        timestamp: new Date(),
        details: { productId, imageId, operation: 'image.removed' },
      }),
    );
  }

  async removeProduct(user: User, product: Product): Promise<void> {
    product.deactivate();
    await this.productRepository.save(product);
  }

  async suspendProduct(user: User, product: Product, reason: string): Promise<void> {
    product.suspend();
    await this.productRepository.save(product);
  }

  // --- Product Variants & Attributes ---
  async addProductVariant(user: User, product: Product, variant: ProductVariant): Promise<ProductVariant> {
    const seller = await this.sellerRepository.findByUser(user);
    if (!seller) {
      throw ApiError.notFound(`Seller profile not found for user ${user.userId}`);
    }
    const found = await this.productRepository.findById(product.productId);
    if (!found) {
      throw ApiError.notFound(`Product ${product.productId} not found`);
    }
    if (found.sellerId !== seller.sellerId) {
      throw ApiError.forbidden('Cannot add variants for another seller product');
    }
    const exists = await this.variantRepository.existsDuplicateVariant(variant);
    if (exists) {
      throw ApiError.alreadyExists(`Variant ${variant.attribute}:${variant.value} already exists for product`);
    }
    await this.variantRepository.save(variant);
    return variant;
  }

  async updateProductVariant(user: User, variant: ProductVariant): Promise<ProductVariant> {
    return this.variantRepository.save(variant);
  }

  async removeProductVariant(user: User, variant: ProductVariant): Promise<void> {
    // No-op: persistence layer handles deletes when needed.
  }

  async manageProductAttributes(user: User, product: Product, attributes: ProductAttribute[]): Promise<ProductAttribute[]> {
    return attributes;
  }

  // --- Inventory Management ---
  async consultMyInventory(user: User): Promise<Inventory[]> {
    const seller = await this.sellerRepository.findByUser(user);
    if (!seller) {
      throw ApiError.notFound(`Seller profile not found for user ${user.userId}`);
    }
    const warehouses = await this.warehouseRepository.findBySeller(seller);
    const result: Inventory[] = [];
    for (const warehouse of warehouses) {
      const rows = await this.inventoryRepository.findByWarehouse(warehouse);
      result.push(...rows);
    }
    return result;
  }

  async consultInventoryByProduct(user: User, product: Product, warehouse: Warehouse): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findByProductAndWarehouse(product, warehouse);
    if (!inventory) {
      throw ApiError.notFound(`No inventory for product ${product.productId} in warehouse ${warehouse.warehouseId}`);
    }
    return inventory;
  }

  async registerStockEntry(user: User, inventory: Inventory, quantity: Quantity, receiptReference: string): Promise<Inventory> {
    const seller = await this.sellerRepository.findByUser(user);
    if (!seller) {
      throw ApiError.notFound(`Seller profile not found for user ${user.userId}`);
    }
    const product = await this.productRepository.findById(inventory.productId);
    if (!product) {
      throw ApiError.notFound(`Product ${inventory.productId} not found`);
    }
    if (product.sellerId !== seller.sellerId) {
      throw ApiError.forbidden('Cannot register stock for another seller product');
    }
    const warehouse = await this.warehouseRepository.findById(inventory.warehouseId);
    if (!warehouse) {
      throw ApiError.notFound(`Warehouse ${inventory.warehouseId} not found`);
    }
    if (warehouse.sellerId !== seller.sellerId) {
      throw ApiError.forbidden('Cannot register stock in another seller warehouse');
    }

    const existing = await this.inventoryRepository.findByProductAndWarehouse(product, warehouse);
    const target =
      existing ??
      new Inventory({
        inventoryId: inventory.inventoryId,
        productId: product.productId,
        warehouseId: warehouse.warehouseId,
        availableStock: 0,
        reservedStock: 0,
        totalStock: 0,
        updateDate: new Date(),
      });
    target.addStock(quantity.value);
    await this.inventoryRepository.save(target);

    // Keep product published state in sync with inventory availability.
    const inventories = await this.inventoryRepository.findByProduct(product);
    const totalStock = inventories.reduce((sum, inv) => sum + inv.availableStock, 0);
    if (totalStock > 0 && product.productStatus === ProductStatus.OUT_OF_STOCK) {
      product.updateDetails({ stock: totalStock });
      await this.productRepository.save(product);
    }

    await this.auditLogRepository.save(
      new AuditLog({
        id: globalThis.crypto.randomUUID(),
        actorId: user.userId,
        action: 'INVENTORY_ENTRY',
        timestamp: new Date(),
        details: { inventoryId: target.inventoryId, quantity: quantity.value, receiptReference },
      }),
    );
    return target;
  }

  async adjustInventory(user: User, product: Product, warehouse: Warehouse, adjustment: Quantity, reason: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findByProductAndWarehouse(product, warehouse);
    if (!inventory) {
      throw ApiError.notFound(`Inventory not found for product ${product.productId} in warehouse ${warehouse.warehouseId}`);
    }
    // Adjustment can be positive or negative; addStock only accepts positive.
    if (adjustment.value > 0) {
      inventory.addStock(adjustment.value);
    } else if (adjustment.value < 0) {
      inventory.deduct(-adjustment.value);
    }
    await this.inventoryRepository.save(inventory);

    // Keep product published state in sync with inventory availability.
    const inventories = await this.inventoryRepository.findByProduct(product);
    const totalStock = inventories.reduce((sum, inv) => sum + inv.availableStock, 0);
    if (totalStock === 0 && product.productStatus === ProductStatus.PUBLISHED) {
      product.updateDetails({ stock: 0 });
      await this.productRepository.save(product);
    } else if (totalStock > 0 && product.productStatus === ProductStatus.OUT_OF_STOCK) {
      product.updateDetails({ stock: totalStock });
      await this.productRepository.save(product);
    }

    return inventory;
  }

  async allocateInventoryForOrder(user: User, order: Order): Promise<void> {
    for (const line of order.orderLines) {
      const product = await this.productRepository.findById(line.productId);
      if (!product) {
        throw ApiError.notFound(`Product ${line.productId} not found`);
      }
      const inventoryList = await this.inventoryRepository.findByProduct(product);
      if (inventoryList.length === 0) {
        throw ApiError.invalidDomainValue(`No inventory for product ${line.productId}`);
      }
      const inventory = inventoryList[0];
      if (!inventory) {
        throw ApiError.invalidDomainValue(`No inventory record for product ${line.productId}`);
      }
      const warehouse = await this.warehouseRepository.findById(inventory.warehouseId);
      if (!warehouse) {
        throw ApiError.notFound(`Warehouse ${inventory.warehouseId} not found`);
      }
      await this.inventoryRepository.reserve(product, warehouse, { value: line.quantity } as any, order);
    }
  }

  // --- Order Management & Fulfillment ---
  async consultMyOrdersForFulfillment(user: User): Promise<Order[]> {
    const seller = await this.sellerRepository.findByUser(user);
    if (!seller) {
      throw ApiError.notFound(`Seller profile not found for user ${user.userId}`);
    }
    return this.orderRepository.findBySeller(seller);
  }

  async consultOrderDetails(user: User, order: Order): Promise<Order> {
    const found = await this.orderRepository.findByIdentifier(order);
    if (!found) {
      throw ApiError.notFound(`Order ${order.orderId} not found`);
    }
    return found;
  }

  async approveOrder(user: User, order: Order): Promise<Order> {
    const seller = await this.sellerRepository.findByUser(user);
    if (!seller) {
      throw ApiError.notFound(`Seller profile not found for user ${user.userId}`);
    }
    const found = await this.orderRepository.findByIdentifier(order);
    if (!found) {
      throw ApiError.notFound(`Order ${order.orderId} not found`);
    }
    if (found.sellerId !== seller.sellerId) {
      throw ApiError.forbidden('Cannot approve another seller order');
    }
    found.confirm();
    await this.orderRepository.save(found);
    return found;
  }

  async prepareOrder(user: User, order: Order): Promise<Order> {
    const seller = await this.sellerRepository.findByUser(user);
    if (!seller) {
      throw ApiError.notFound(`Seller profile not found for user ${user.userId}`);
    }
    const found = await this.orderRepository.findByIdentifier(order);
    if (!found) {
      throw ApiError.notFound(`Order ${order.orderId} not found`);
    }
    if (found.sellerId !== seller.sellerId) {
      throw ApiError.forbidden('Cannot prepare another seller order');
    }
    found.prepare();

    // A prepared order must be visible to logistics immediately. The shipment
    // is created exactly once per order and inside the same MySQL transaction
    // as the status change, so a failure never leaves an orphan order/shipment.
    const existing = await this.shipmentRepository.findByOrder(found);
    let createdShipment: ShipmentEntity | undefined;
    if (existing.length === 0) {
      createdShipment = new ShipmentEntity({
        shipmentId: globalThis.crypto.randomUUID(),
        orderId: found.orderId,
        warehouseId: await this.resolveWarehouseId(found, seller),
        deliveryAddress: await this.resolveDeliveryAddress(found),
        carrier: new ShipmentCarrier({
          carrierId: 'NEXUS-DEFAULT',
          name: 'NexusMarket Logistics',
          serviceType: 'Standard',
        }),
        trackingCode: `NX-${found.orderId.slice(0, 8).toUpperCase()}-${globalThis.crypto
          .randomUUID()
          .slice(0, 8)
          .toUpperCase()}`,
        shipmentStatus: ShipmentStatus.IN_PREPARATION,
      });
    }

    await this.transactionManager.runInTransaction(async () => {
      await this.orderRepository.save(found);
      if (createdShipment === undefined) {
        return;
      }
      try {
        await this.shipmentRepository.save(createdShipment);
      } catch (error) {
        // Concurrent prepare calls race on the unique orderId index: the winner
        // already created the shipment, so the loser is a no-op.
        if (!isDuplicateKeyError(error)) {
          throw error;
        }
      }
    });

    if (createdShipment !== undefined) {
      try {
        await this.auditLogRepository.save(
          new AuditLog({
            id: globalThis.crypto.randomUUID(),
            actorId: user.userId,
            action: 'SHIPMENT_CREATED',
            timestamp: new Date(),
            details: {
              shipmentId: createdShipment.shipmentId,
              orderId: createdShipment.orderId,
              warehouseId: createdShipment.warehouseId,
              trackingCode: createdShipment.trackingCode,
              shipmentStatus: createdShipment.shipmentStatus,
            },
          }),
        );
      } catch (auditError) {
        // Audit is best-effort: a Mongo outage must not roll back the dispatch
        // queue entry.
        console.error('[prepareOrder] could not write SHIPMENT_CREATED audit log', auditError);
      }
    }

    return found;
  }

  /**
   * Picks the warehouse that actually holds the reserved units of the order.
   * Falls back to the seller's first operational warehouse.
   */
  private async resolveWarehouseId(order: Order, seller: Seller): Promise<string> {
    for (const line of order.orderLines) {
      const inventory = await this.inventoryRepository.findByProduct({
        productId: line.productId,
      } as Product);
      const match =
        inventory.find((candidate) => candidate.reservedStock >= line.quantity) ??
        inventory.find((candidate) => candidate.reservedStock > 0) ??
        inventory[0];
      if (match !== undefined) {
        return match.warehouseId;
      }
    }

    const warehouses = await this.warehouseRepository.findBySeller(seller);
    const chosen =
      warehouses.find((candidate) => candidate.status === WarehouseStatus.OPERATIONAL) ??
      warehouses[0];
    if (chosen === undefined) {
      throw ApiError.invalidDomainValue(
        `No warehouse available to prepare order ${order.orderId}.`,
        { field: 'warehouseId' },
      );
    }
    return chosen.warehouseId;
  }

  /**
   * Uses the buyer's registered address (persisted during checkout). Legacy
   * orders created before that persistence get a neutral placeholder so the
   * logistics queue can still operate.
   */
  private async resolveDeliveryAddress(order: Order): Promise<DeliveryAddress> {
    const buyer = await this.buyerRepository.findByIdentifier({
      buyerId: order.buyerId,
    } as Buyer);
    const addresses = buyer?.deliveryAddresses ?? [];
    const chosen =
      addresses.find((candidate) => candidate.isPrimary) ?? addresses[0];
    if (chosen !== undefined) {
      return chosen;
    }
    return new DeliveryAddress({
      addressId: globalThis.crypto.randomUUID(),
      country: 'Colombia',
      department: 'No registrado',
      city: 'No registrado',
      neighborhood: 'No registrado',
      address: 'Dirección no registrada en checkout',
      postalCode: '000000',
      reference: '',
      isPrimary: false,
    });
  }

  // --- Shipment & Dispatch ---
  async createShipment(user: User, order: Order, warehouse: Warehouse, address: any): Promise<Shipment> {
    throw ApiError.invalidRequest('Shipment creation not implemented yet.');
  }

  async selectCarrier(user: User, shipment: Shipment, carrier: Carrier, service: string): Promise<Shipment> {
    return shipment;
  }

  async dispatchShipment(user: User, shipment: Shipment): Promise<Shipment> {
    shipment.dispatch();
    return shipment;
  }

  async consultMyShipments(user: User): Promise<Shipment[]> {
    return [];
  }

  async trackShipment(user: User, shipment: Shipment): Promise<Shipment> {
    return shipment;
  }

  // --- Financial Management & Settlement ---
  async consultPaymentsForMyOrders(user: User): Promise<Payment[]> {
    return [];
  }

  /**
   * Lightweight settlement report: gross sales, marketplace commission, IVA on
   * that commission and approved refunds. Reads the transactional tables, so it
   * stays consistent with the seller dashboard.
   */
  async previewSettlement(user: User, period: DateRange): Promise<SettlementPreview> {
    const seller = await this.sellerRepository.findByUser(user);
    if (!seller) {
      throw ApiError.notFound(`Seller profile not found for user ${user.userId}`);
    }
    const stats = await this.analyticsRepository.getSellerSettlement(seller.sellerId, {
      startDate: period.startDate,
      endDate: period.endDate,
    });

    const commissions = roundCurrency(stats.grossSales * COMMISSION_RATE);
    const taxes = roundCurrency(commissions * COMMISSION_TAX_RATE);
    const deductions = roundCurrency(stats.refundedAmount);
    const total = roundCurrency(stats.grossSales);
    return {
      period: `${toIsoDay(period.startDate)} to ${toIsoDay(period.endDate)}`,
      currency: SETTLEMENT_CURRENCY,
      commissionRate: COMMISSION_RATE,
      total,
      commissions,
      taxes,
      deductions,
      netAmount: roundCurrency(total - commissions - taxes - deductions),
      orders: stats.orderCount,
      deliveredOrders: stats.deliveredOrders,
      pendingReturns: stats.pendingReturns,
    };
  }

  async processSettlement(user: User, settlement: Settlement): Promise<Settlement> {
    return settlement;
  }

  async consultMyCommissions(user: User, period: DateRange): Promise<Commission[]> {
    return [];
  }

  // --- Returns & Refunds (Seller Side) ---
  async consultReturnRequests(user: User): Promise<Return[]> {
    return [];
  }

  async consultReturnDetails(user: User, returnCase: Return): Promise<Return> {
    return returnCase;
  }

  async approveReturn(user: User, returnCase: Return): Promise<Return> {
    returnCase.approve();
    return returnCase;
  }

  async rejectReturn(user: User, returnCase: Return, reason: string): Promise<Return> {
    returnCase.reject();
    return returnCase;
  }

  // --- Performance & Analytics ---
  async consultMyPerformance(user: User): Promise<SellerPerformanceMetrics> {
    return { totalSales: 0, totalOrders: 0, rating: 0 };
  }

  async consultMyDashboard(user: User): Promise<SellerDashboard> {
    const seller = await this.sellerRepository.findByUser(user);
    if (!seller) {
      throw ApiError.notFound(`Seller profile not found for user ${user.userId}`);
    }
    const stats = await this.analyticsRepository.getSellerDashboard(seller.sellerId);
    return {
      ...stats,
      sellerId: seller.sellerId,
      commercialName: seller.commercialName,
      verificationStatus: seller.verificationStatus,
    };
  }

  async consultMyOperationHistory(user: User, period: DateRange): Promise<AuditLog[]> {
    return [];
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const candidate = error as { code?: unknown; errno?: unknown };
  return candidate.code === 'ER_DUP_ENTRY' || candidate.errno === 1062;
}

// --- Settlement policy (documented marketplace defaults) -------------------
const COMMISSION_RATE = 0.1; // 10% marketplace commission
const COMMISSION_TAX_RATE = 0.19; // IVA applied to the commission
const SETTLEMENT_CURRENCY = 'COP';

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function toIsoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Storefront category inferred from the seller's catalogue. */
function toStoreCategory(category: ProductCategory): StoreCategory | undefined {
  const raw = category as string;
  return Object.values(StoreCategory).find((candidate) => candidate === raw);
}

function dominantStoreCategory(products: Product[]): StoreCategory {
  const counts = new Map<StoreCategory, number>();
  for (const product of products) {
    const category =
      product.category === undefined ? undefined : toStoreCategory(product.category);
    if (category === undefined) {
      continue;
    }
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  let dominant = StoreCategory.OTHER;
  let dominantCount = 0;
  for (const [category, count] of counts) {
    if (count > dominantCount) {
      dominant = category;
      dominantCount = count;
    }
  }
  return dominant;
}

/** Only a verified seller has an active storefront in the marketplace. */
function storeStatusFor(
  verificationStatus: SellerVerificationStatus,
): StoreLifecycleStatus {
  switch (verificationStatus) {
    case SellerVerificationStatus.VERIFIED:
      return StoreLifecycleStatus.ACTIVE;
    case SellerVerificationStatus.REJECTED:
      return StoreLifecycleStatus.SUSPENDED;
    default:
      return StoreLifecycleStatus.INACTIVE;
  }
}
