/**
 * Application Service: LogisticsOperatorService
 * Implements LogisticsOperatorPort
 *
 * Operaciones de bodega, inventario y envíos para el operador de logística.
 */
import type {
  LogisticsOperatorPort,
  DateRange,
  Quantity,
  InventoryMovement,
  Carrier,
  ShippingCost,
  ShipmentStatusUpdate,
} from '../../domain/ports/in/LogisticsOperatorPort.js';
import type { User } from '../../domain/model/user.js';
import { Warehouse } from '../../domain/entities/Warehouse.js';
import { Inventory } from '../../domain/entities/Inventory.js';
import type { Shipment } from '../../domain/entities/Shipment.js';
import type { Order } from '../../domain/entities/Order.js';
import type { Return } from '../../domain/entities/Return.js';
import type { WarehouseRepositoryPort } from '../../domain/ports/out/WarehouseRepositoryPort.js';
import type { InventoryRepositoryPort } from '../../domain/ports/out/InventoryRepositoryPort.js';
import type { ShipmentRepositoryPort } from '../../domain/ports/out/ShipmentRepositoryPort.js';
import type { OrderRepositoryPort } from '../../domain/ports/out/OrderRepositoryPort.js';
import type { ReturnRepositoryPort } from '../../domain/ports/out/ReturnRepositoryPort.js';
import type { ProductRepository } from '../../domain/ports/out/ProductRepository.js';
import type { AuditLogRepository } from '../../domain/ports/out/AuditLogRepository.js';
import { AuditLog } from '../../domain/model/AuditLog.js';
import { WarehouseStatus } from '../../domain/model/enums.js';
import { ShipmentStatus } from '../../domain/model/enums.js';
import { InventoryMovementType } from '../../domain/ports/in/LogisticsOperatorPort.js';

import { ApiError } from '../../domain/errors/ApiError.js';
import { WarehouseLocation } from '../../domain/model/value-objects.js';

export class LogisticsOperatorService implements LogisticsOperatorPort {
  constructor(
    private readonly warehouseRepository: WarehouseRepositoryPort,
    private readonly inventoryRepository: InventoryRepositoryPort,
    private readonly shipmentRepository: ShipmentRepositoryPort,
    private readonly orderRepository: OrderRepositoryPort,
    private readonly returnRepository: ReturnRepositoryPort,
    private readonly productRepository: ProductRepository,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  // --- Warehouse Operations ---
  async consultOperationalWarehouses(user: User): Promise<Warehouse[]> {
    return this.warehouseRepository.findByStatus(WarehouseStatus.OPERATIONAL);
  }

  async consultWarehouseDetails(user: User, warehouse: Warehouse): Promise<Warehouse> {
    const found = await this.warehouseRepository.findByIdentifier(warehouse);
    if (!found) {
      throw ApiError.notFound(`Warehouse ${warehouse.warehouseId} not found`);
    }
    return found;
  }

  async changeWarehouseStatus(user: User, warehouse: Warehouse, newStatus: any): Promise<Warehouse> {
    const found = await this.warehouseRepository.findByIdentifier(warehouse);
    if (!found) {
      throw ApiError.notFound(`Warehouse ${warehouse.warehouseId} not found`);
    }
    // Rebuild with new status.
    const updated = new Warehouse({
      warehouseId: found.warehouseId,
      sellerId: found.sellerId,
      name: found.name,
      location: found.location,
      capacity: found.capacity,
      status: String(newStatus) as WarehouseStatus,
      creationDate: found.creationDate,
    });
    await this.warehouseRepository.save(updated);

    await this.auditLogRepository.save(
      new AuditLog({
        id: globalThis.crypto.randomUUID(),
        actorId: user.userId,
        action: 'WAREHOUSE_STATUS_CHANGE',
        timestamp: new Date(),
        details: { warehouseId: found.warehouseId, newStatus },
      }),
    );
    return updated;
  }

  // --- Inventory Operations ---
  async consultInventoryByWarehouse(user: User, warehouse: Warehouse): Promise<Inventory[]> {
    const all = await this.inventoryRepository.findByProduct(
      { productId: '', name: '', description: '', sellerId: '', price: 0, stock: 0, createdAt: new Date() } as any,
    );
    return all.filter((i) => i.warehouseId === warehouse.warehouseId);
  }

  async registerStockEntry(user: User, inventory: Inventory, quantity: Quantity, receiptReference: string): Promise<Inventory> {
    const product = await this.productRepository.findById(inventory.productId);
    if (!product) {
      throw ApiError.notFound(`Product ${inventory.productId} not found`);
    }
    const warehouse = await this.warehouseRepository.findById(inventory.warehouseId);
    if (!warehouse) {
      throw ApiError.notFound(`Warehouse ${inventory.warehouseId} not found`);
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

  async registerStockMovement(user: User, inventory: Inventory, movementType: InventoryMovementType, quantity: Quantity, reason: string): Promise<Inventory> {
    if (movementType === InventoryMovementType.ENTRY) {
      inventory.addStock(quantity.value);
    } else if (movementType === InventoryMovementType.EXIT) {
      inventory.deduct(quantity.value);
    } else if (movementType === InventoryMovementType.ADJUSTMENT) {
      if (quantity.value > 0) inventory.addStock(quantity.value);
      else inventory.deduct(-quantity.value);
    }
    await this.inventoryRepository.save(inventory);
    return inventory;
  }

  async adjustInventory(user: User, inventory: Inventory, adjustment: Quantity, reason: string): Promise<Inventory> {
    if (adjustment.value > 0) inventory.addStock(adjustment.value);
    else inventory.deduct(-adjustment.value);
    await this.inventoryRepository.save(inventory);
    return inventory;
  }

  async consultInventoryMovementHistory(user: User, warehouse: Warehouse, period: DateRange): Promise<InventoryMovement[]> {
    return [];
  }

  // --- Shipment Preparation & Dispatch ---
  async consultShipmentsReadyForDispatch(user: User): Promise<Shipment[]> {
    const all = await this.shipmentRepository.findByStatus(ShipmentStatus.SCHEDULED);
    return all.filter((s) => s.shipmentStatus === ShipmentStatus.SCHEDULED);
  }

  async prepareShipment(user: User, shipment: Shipment): Promise<Shipment> {
    shipment.prepare();
    return shipment;
  }

  async selectCarrier(user: User, shipment: Shipment, carrier: Carrier, service: string): Promise<Shipment> {
    return shipment;
  }

  async calculateShippingCost(user: User, shipment: Shipment): Promise<ShippingCost> {
    return { amount: 5000, currency: 'COP' };
  }

  async dispatchShipment(user: User, shipment: Shipment): Promise<Shipment> {
    const found = await this.shipmentRepository.findByIdentifier(shipment);
    if (!found) {
      throw ApiError.notFound(`Shipment ${shipment.shipmentId} not found`);
    }
    found.dispatch();
    await this.shipmentRepository.save(found);
    return found;
  }

  // --- Shipment Tracking & Exception Handling ---
  async consultActiveShipments(user: User): Promise<Shipment[]> {
    return this.shipmentRepository.findByStatus(ShipmentStatus.IN_TRANSIT);
  }

  async trackShipment(user: User, shipment: Shipment): Promise<Shipment> {
    return shipment;
  }

  async consultShipmentProgress(user: User, shipment: Shipment): Promise<ShipmentStatusUpdate[]> {
    return [];
  }

  async handleDeliveryException(user: User, shipment: Shipment, exceptionType: string, details: string): Promise<Shipment> {
    shipment.fail();
    return shipment;
  }

  async confirmDelivery(user: User, shipment: Shipment): Promise<Shipment> {
    const found = await this.shipmentRepository.findByIdentifier(shipment);
    if (!found) {
      throw ApiError.notFound(`Shipment ${shipment.shipmentId} not found`);
    }
    found.deliver();
    await this.shipmentRepository.save(found);
    return found;
  }

  // --- Return Receipt & Processing ---
  async consultReturnShipmentsInTransit(user: User): Promise<Return[]> {
    return [];
  }

  async receiveReturnedStock(user: User, shipment: any): Promise<Shipment> {
    return shipment;
  }

  async registerReturnedStock(user: User, inventory: Inventory, quantity: Quantity, condition: string): Promise<Inventory> {
    inventory.addStock(quantity.value);
    await this.inventoryRepository.save(inventory);
    return inventory;
  }

  // --- Warehouse Allocation & Optimization ---
  async suggestOptimalWarehouseAllocation(user: User, order: Order): Promise<Warehouse[]> {
    return [];
  }

  async rebalanceInventoryBetweenWarehouses(user: User, product: any, sourceWarehouse: Warehouse, targetWarehouse: Warehouse, quantity: Quantity): Promise<void> {}
}
