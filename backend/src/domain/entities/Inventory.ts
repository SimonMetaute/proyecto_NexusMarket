/**
 * Domain Entity: Inventory
 * Source: SDD/Domain/domain_model.md (Section 2.8)
 */

export class Inventory {
  private readonly _inventoryId: string;
  private readonly _productId: string;
  private readonly _warehouseId: string;
  private _availableStock: number;
  private _reservedStock: number;
  private _totalStock: number;
  private _updateDate: Date;

  constructor(params: {
    inventoryId: string;
    productId: string;
    warehouseId: string;
    availableStock: number;
    reservedStock?: number;
    totalStock?: number;
    updateDate?: Date;
  }) {
    if (!params.inventoryId || params.inventoryId.trim().length === 0) {
      throw new Error('Inventory.inventoryId is required.');
    }
    if (!params.productId || params.productId.trim().length === 0) {
      throw new Error('Inventory.productId is required.');
    }
    if (!params.warehouseId || params.warehouseId.trim().length === 0) {
      throw new Error('Inventory.warehouseId is required.');
    }
    if (typeof params.availableStock !== 'number' || params.availableStock < 0) {
      throw new Error('Inventory.availableStock must be a non-negative number.');
    }

    const reserved = params.reservedStock ?? 0;
    if (reserved < 0) {
      throw new Error('Inventory.reservedStock must be a non-negative number.');
    }

    const total = params.totalStock ?? params.availableStock + reserved;
    if (total < 0) {
      throw new Error('Inventory.totalStock must be a non-negative number.');
    }
    if (params.availableStock + reserved !== total) {
      throw new Error('Inventory invariant violated: availableStock + reservedStock must equal totalStock.');
    }

    this._inventoryId = params.inventoryId.trim();
    this._productId = params.productId.trim();
    this._warehouseId = params.warehouseId.trim();
    this._availableStock = params.availableStock;
    this._reservedStock = reserved;
    this._totalStock = total;
    this._updateDate = params.updateDate ?? new Date();
  }

  get inventoryId(): string {
    return this._inventoryId;
  }

  get productId(): string {
    return this._productId;
  }

  get warehouseId(): string {
    return this._warehouseId;
  }

  get availableStock(): number {
    return this._availableStock;
  }

  get reservedStock(): number {
    return this._reservedStock;
  }

  get totalStock(): number {
    return this._totalStock;
  }

  get updateDate(): Date {
    return this._updateDate;
  }

  reserve(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than zero.');
    }
    if (quantity > this._availableStock) {
      throw new Error('Insufficient inventory to reserve requested quantity.');
    }
    this._availableStock -= quantity;
    this._reservedStock += quantity;
    this._updateDate = new Date();
  }

  release(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than zero.');
    }
    if (quantity > this._reservedStock) {
      throw new Error('Cannot release more than reserved stock.');
    }
    this._reservedStock -= quantity;
    this._availableStock += quantity;
    this._updateDate = new Date();
  }

  deduct(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than zero.');
    }
    if (quantity > this._reservedStock) {
      throw new Error('Cannot deduct more than reserved stock.');
    }
    this._reservedStock -= quantity;
    this._totalStock -= quantity;
    this._updateDate = new Date();
  }

  addStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than zero.');
    }
    this._availableStock += quantity;
    this._totalStock += quantity;
    this._updateDate = new Date();
  }

  /**
   * Reintegra unidades devueltas: incrementa availableStock y totalStock,
   * y decrementa reservedStock si aún estaba reservada.
   */
  reintegrateStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than zero.');
    }
    if (quantity <= this._reservedStock) {
      this._reservedStock -= quantity;
    }
    this._availableStock += quantity;
    this._totalStock += quantity;
    this._updateDate = new Date();
  }
}
