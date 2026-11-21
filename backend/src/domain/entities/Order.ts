/**
 * Domain Entity: Order & OrderLine
 * Source: SDD/Domain/domain_model.md (Sections 2.10, 2.11)
 */

import { OrderStatus } from '../model/enums.js';

export class OrderLine {
  private readonly _orderLineId: string;
  private readonly _productId: string;
  private readonly _quantity: number;
  private readonly _unitPrice: number;
  private readonly _subtotal: number;
  private readonly _variantId?: string;

  constructor(params: {
    orderLineId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    variantId?: string;
  }) {
    if (!params.orderLineId || params.orderLineId.trim().length === 0) {
      throw new Error('OrderLine.orderLineId is required.');
    }
    if (!params.productId || params.productId.trim().length === 0) {
      throw new Error('OrderLine.productId is required.');
    }
    if (typeof params.quantity !== 'number' || params.quantity <= 0) {
      throw new Error('OrderLine.quantity must be greater than zero.');
    }
    if (typeof params.unitPrice !== 'number' || params.unitPrice < 0) {
      throw new Error('OrderLine.unitPrice must be non-negative.');
    }
    if (typeof params.subtotal !== 'number' || params.subtotal < 0) {
      throw new Error('OrderLine.subtotal must be non-negative.');
    }

    this._orderLineId = params.orderLineId.trim();
    this._productId = params.productId.trim();
    this._quantity = params.quantity;
    this._unitPrice = params.unitPrice;
    this._subtotal = params.subtotal;
    if (params.variantId !== undefined) {
      this._variantId = params.variantId.trim();
    }
  }

  get orderLineId(): string {
    return this._orderLineId;
  }

  get productId(): string {
    return this._productId;
  }

  get quantity(): number {
    return this._quantity;
  }

  get unitPrice(): number {
    return this._unitPrice;
  }

  get subtotal(): number {
    return this._subtotal;
  }

  get variantId(): string | undefined {
    return this._variantId;
  }
}

export class Order {
  private readonly _orderId: string;
  private readonly _buyerId: string;
  private readonly _sellerId: string;
  private _orderLines: OrderLine[];
  private readonly _subtotal: number;
  private readonly _taxes: number;
  private readonly _shippingCost: number;
  private readonly _total: number;
  private _orderStatus: OrderStatus;
  private readonly _creationDate: Date;
  private _estimatedDeliveryDate?: Date;

  constructor(params: {
    orderId: string;
    buyerId: string;
    sellerId: string;
    orderLines: OrderLine[];
    subtotal: number;
    taxes: number;
    shippingCost: number;
    total: number;
    orderStatus?: OrderStatus;
    creationDate: Date;
    estimatedDeliveryDate?: Date;
  }) {
    if (!params.orderId || params.orderId.trim().length === 0) {
      throw new Error('Order.orderId is required.');
    }
    if (!params.buyerId || params.buyerId.trim().length === 0) {
      throw new Error('Order.buyerId is required.');
    }
    if (!params.sellerId || params.sellerId.trim().length === 0) {
      throw new Error('Order.sellerId is required.');
    }
    if (!Array.isArray(params.orderLines) || params.orderLines.length === 0) {
      throw new Error('Order must have at least one order line.');
    }
    if (typeof params.total !== 'number' || params.total < 0) {
      throw new Error('Order.total must be a non-negative number.');
    }

    this._orderId = params.orderId.trim();
    this._buyerId = params.buyerId.trim();
    this._sellerId = params.sellerId.trim();
    this._orderLines = params.orderLines;
    this._subtotal = params.subtotal;
    this._taxes = params.taxes;
    this._shippingCost = params.shippingCost;
    this._total = params.total;
    this._orderStatus = params.orderStatus ?? OrderStatus.PENDING;
    this._creationDate = params.creationDate;
    if (params.estimatedDeliveryDate !== undefined) {
      this._estimatedDeliveryDate = params.estimatedDeliveryDate;
    }
  }

  get orderId(): string {
    return this._orderId;
  }

  get buyerId(): string {
    return this._buyerId;
  }

  get sellerId(): string {
    return this._sellerId;
  }

  get orderLines(): OrderLine[] {
    return [...this._orderLines];
  }

  get subtotal(): number {
    return this._subtotal;
  }

  get taxes(): number {
    return this._taxes;
  }

  get shippingCost(): number {
    return this._shippingCost;
  }

  get total(): number {
    return this._total;
  }

  get orderStatus(): OrderStatus {
    return this._orderStatus;
  }

  get creationDate(): Date {
    return this._creationDate;
  }

  get estimatedDeliveryDate(): Date | undefined {
    return this._estimatedDeliveryDate;
  }

  confirm(): void {
    this._orderStatus = OrderStatus.CONFIRMED;
  }

  prepare(): void {
    this._orderStatus = OrderStatus.PREPARING;
  }

  send(): void {
    this._orderStatus = OrderStatus.SENT;
  }

  deliver(): void {
    this._orderStatus = OrderStatus.DELIVERED;
  }

  cancel(): void {
    this._orderStatus = OrderStatus.CANCELLED;
  }

  refund(): void {
    this._orderStatus = OrderStatus.REFUNDED;
  }

  requestReturn(): void {
    this._orderStatus = OrderStatus.RETURN_REQUESTED;
  }

  markReturned(): void {
    this._orderStatus = OrderStatus.RETURNED;
  }
}
