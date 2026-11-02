/**
 * Controller: LogisticsController
 * Endpoints del operador de logística (requieren autenticación, rol LOGISTICS_OPERATOR).
 */
import type { Request, Response } from 'express';
import type { LogisticsOperatorPort } from '../../../domain/ports/in/LogisticsOperatorPort.js';
import type { User } from '../../../domain/model/user.js';
import { ApiError } from '../errors/ApiError.js';
import {
  optionalString,
  requireObject,
  requireString,
  requireParam,
  requireNumber,
  requirePositiveInt,
} from '../validation/validator.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

function asString(value: string | string[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

export class LogisticsController {
  private readonly logisticsService: LogisticsOperatorPort;

  constructor(logisticsService: LogisticsOperatorPort) {
    this.logisticsService = logisticsService;
  }

  private requireUser(req: Request): User {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    return user;
  }

  async consultOperationalWarehouses(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const warehouses = await this.logisticsService.consultOperationalWarehouses(user);
    res.status(200).json(warehouses);
  }

  async registerStockEntry(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const body = requireObject(req.body);
    const productId = requireString(body, 'productId', { maxLength: 36 });
    const warehouseId = requireString(body, 'warehouseId', { maxLength: 36 });
    const quantity = requirePositiveInt(body, 'quantity');
    const receiptReference = requireString(body, 'receiptReference', { maxLength: 255 });
    const product = {
      productId,
      name: '', description: '', sellerId: '', price: 0, stock: 0, createdAt: new Date(),
    } as any;
    const warehouse = new (require('../../../domain/entities/Warehouse.js').Warehouse)({
      warehouseId, sellerId: '', name: '',
      location: new (require('../../../domain/model/value-objects.js').WarehouseLocation)({
        country: '', department: '', city: '', address: '', postalCode: '',
      }),
      capacity: 0, status: 'Operational', creationDate: new Date(),
    } as any);
    const inventory = new (require('../../../domain/entities/Inventory.js').Inventory)({
      inventoryId: globalThis.crypto.randomUUID(),
      productId, warehouseId, availableStock: quantity, reservedStock: 0, totalStock: quantity,
      updateDate: new Date(),
    } as any);
    const updated = await this.logisticsService.registerStockEntry(
      user, inventory, { value: quantity }, receiptReference,
    );
    res.status(200).json({
      inventoryId: updated.inventoryId,
      availableStock: updated.availableStock,
      totalStock: updated.totalStock,
    });
  }

  async dispatchShipment(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const shipmentId = requireParam(asString(req.params.shipmentId), 'shipmentId');
    const shipment = {
      shipmentId, orderId: '', warehouseId: '',
      deliveryAddress: new (require('../../../domain/model/value-objects.js').DeliveryAddress)({
        addressId: '', country: '', department: '', city: '', neighborhood: '',
        address: '', postalCode: '', reference: '',
      }),
      carrier: new (require('../../../domain/entities/Shipment.js').Carrier)({
        carrierId: '', name: '', serviceType: '',
      }),
      trackingCode: '',
      shipmentStatus: 'Scheduled',
    } as any;
    const updated = await this.logisticsService.dispatchShipment(user, shipment);
    res.status(200).json({
      shipmentId: updated.shipmentId,
      shipmentStatus: updated.shipmentStatus,
    });
  }

  async confirmDelivery(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const shipmentId = requireParam(asString(req.params.shipmentId), 'shipmentId');
    const shipment = {
      shipmentId, orderId: '', warehouseId: '',
      deliveryAddress: new (require('../../../domain/model/value-objects.js').DeliveryAddress)({
        addressId: '', country: '', department: '', city: '', neighborhood: '',
        address: '', postalCode: '', reference: '',
      }),
      carrier: new (require('../../../domain/entities/Shipment.js').Carrier)({
        carrierId: '', name: '', serviceType: '',
      }),
      trackingCode: '',
      shipmentStatus: 'Scheduled',
    } as any;
    const updated = await this.logisticsService.confirmDelivery(user, shipment);
    res.status(200).json({
      shipmentId: updated.shipmentId,
      shipmentStatus: updated.shipmentStatus,
    });
  }
}
