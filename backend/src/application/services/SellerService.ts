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
} from '../../domain/ports/in/SellerPort.js';
import type { User } from '../../domain/model/user.js';
import type { Seller } from '../../domain/entities/Seller.js';
import type { Store } from '../../domain/entities/Store.js';
import { Warehouse } from '../../domain/entities/Warehouse.js';
import { WarehouseLocation } from '../../domain/model/value-objects.js';
import type { Product } from '../../domain/entities/Product.js';
import type { ProductVariant } from '../../domain/entities/ProductVariant.js';
import { Inventory } from '../../domain/entities/Inventory.js';
import type { Order } from '../../domain/entities/Order.js';
import type { Shipment } from '../../domain/entities/Shipment.js';
import type { Return } from '../../domain/entities/Return.js';
import { AuditLog } from '../../domain/model/AuditLog.js';
import type { SellerRepositoryPort } from '../../domain/ports/out/SellerRepositoryPort.js';
import type { ProductRepository } from '../../domain/ports/out/ProductRepository.js';
import type { OrderRepositoryPort } from '../../domain/ports/out/OrderRepositoryPort.js';
import type { InventoryRepositoryPort } from '../../domain/ports/out/InventoryRepositoryPort.js';
import type { ProductVariantRepositoryPort } from '../../domain/ports/out/ProductVariantRepositoryPort.js';
import type { WarehouseRepositoryPort } from '../../domain/ports/out/WarehouseRepositoryPort.js';
import type { AuditLogRepository } from '../../domain/ports/out/AuditLogRepository.js';
import { SellerVerificationStatus, WarehouseStatus } from '../../domain/model/enums.js';
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

  async consultMyStore(user: User): Promise<Store> {
    throw ApiError.notFound('Store lookup not implemented yet.');
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
    await this.orderRepository.save(found);
    return found;
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

  async previewSettlement(user: User, period: DateRange): Promise<SettlementPreview> {
    return { total: 0, commissions: 0, netAmount: 0 };
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

  async consultMyOperationHistory(user: User, period: DateRange): Promise<AuditLog[]> {
    return [];
  }
}
