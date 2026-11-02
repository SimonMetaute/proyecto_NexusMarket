/**
 * Domain Entity: ShoppingCart & CartLine
 * Source: SDD/Domain/domain_model.md (Section 2.9)
 */

import { OrderStatus } from '../model/enums.js';

export class CartLine {
  private readonly _cartLineId: string;
  private readonly _productId: string;
  private readonly _variantId?: string;
  private _quantity: number;
  private readonly _unitPrice: number;

  constructor(params: {
    cartLineId: string;
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
  }) {
    if (!params.cartLineId || params.cartLineId.trim().length === 0) {
      throw new Error('CartLine.cartLineId is required.');
    }
    if (!params.productId || params.productId.trim().length === 0) {
      throw new Error('CartLine.productId is required.');
    }
    if (typeof params.quantity !== 'number' || params.quantity <= 0) {
      throw new Error('CartLine.quantity must be greater than zero.');
    }
    if (typeof params.unitPrice !== 'number' || params.unitPrice < 0) {
      throw new Error('CartLine.unitPrice must be non-negative.');
    }

    this._cartLineId = params.cartLineId.trim();
    this._productId = params.productId.trim();
    if (params.variantId !== undefined) {
      this._variantId = params.variantId.trim();
    }
    this._quantity = params.quantity;
    this._unitPrice = params.unitPrice;
  }

  get cartLineId(): string {
    return this._cartLineId;
  }

  get productId(): string {
    return this._productId;
  }

  get variantId(): string | undefined {
    return this._variantId;
  }

  get quantity(): number {
    return this._quantity;
  }

  get unitPrice(): number {
    return this._unitPrice;
  }

  get subtotal(): number {
    return this._quantity * this._unitPrice;
  }

  updateQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('CartLine.quantity must be greater than zero.');
    }
    this._quantity = quantity;
  }
}

export enum CartStatus {
  OPEN = 'Open',
  CONVERTED = 'Converted',
  CANCELED = 'Canceled',
}

export class ShoppingCart {
  private readonly _cartId: string;
  private readonly _buyerId: string;
  private _cartLines: CartLine[];
  private _subtotal: number;
  private _total: number;
  private _updateDate: Date;
  private _status: CartStatus;

  constructor(params: {
    cartId: string;
    buyerId: string;
    cartLines?: CartLine[];
    subtotal?: number;
    total?: number;
    updateDate?: Date;
    status?: CartStatus;
  }) {
    if (!params.cartId || params.cartId.trim().length === 0) {
      throw new Error('ShoppingCart.cartId is required.');
    }
    if (!params.buyerId || params.buyerId.trim().length === 0) {
      throw new Error('ShoppingCart.buyerId is required.');
    }

    this._cartId = params.cartId.trim();
    this._buyerId = params.buyerId.trim();
    this._cartLines = params.cartLines ?? [];
    this._subtotal = params.subtotal ?? 0;
    this._total = params.total ?? 0;
    this._updateDate = params.updateDate ?? new Date();
    this._status = params.status ?? CartStatus.OPEN;
  }

  get cartId(): string {
    return this._cartId;
  }

  get buyerId(): string {
    return this._buyerId;
  }

  get cartLines(): CartLine[] {
    return [...this._cartLines];
  }

  get subtotal(): number {
    return this._subtotal;
  }

  get total(): number {
    return this._total;
  }

  get updateDate(): Date {
    return this._updateDate;
  }

  get status(): CartStatus {
    return this._status;
  }

  addLine(line: CartLine): void {
    this._cartLines.push(line);
    this.recalculate();
  }

  removeLine(cartLineId: string): void {
    this._cartLines = this._cartLines.filter((line) => line.cartLineId !== cartLineId);
    this.recalculate();
  }

  clear(): void {
    this._cartLines = [];
    this.recalculate();
  }

  recalculate(): void {
    this._subtotal = this._cartLines.reduce((sum, line) => sum + line.subtotal, 0);
    this._total = this._subtotal;
    this._updateDate = new Date();
  }

  convert(): void {
    if (this._cartLines.length === 0) {
      throw new Error('Cannot convert an empty cart to order.');
    }
    this._status = CartStatus.CONVERTED;
    this._updateDate = new Date();
  }

  cancel(): void {
    this._status = CartStatus.CANCELED;
    this._updateDate = new Date();
  }

  isOpen(): boolean {
    return this._status === CartStatus.OPEN;
  }
}
