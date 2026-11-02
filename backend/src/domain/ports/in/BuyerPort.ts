/**
 * Input Port: BuyerPort
 * Source: SDD/Domain/input-ports.md (Section 3.2)
 * Aligned per Contract-alignment.md: addItemToCart is upsert (merge quantity) returning 200/201 semantics.
 */

import type { User } from '../../model/user.js';
import type { Buyer } from '../../entities/Buyer.js';
import type { DeliveryAddress, PaymentMethod } from '../../model/value-objects.js';
import type { ShoppingCart } from '../../entities/ShoppingCart.js';
import type { Product } from '../../entities/Product.js';
import type { ProductVariant } from '../../entities/ProductVariant.js';
import type { Order } from '../../entities/Order.js';
import type { Shipment } from '../../entities/Shipment.js';
import type { Return } from '../../entities/Return.js';
import type { Operation } from '../../entities/Operation.js';

export interface Quantity {
  value: number;
}

export interface BuyerPreferences {
  notifications: boolean;
  language: string;
}

export interface PrivacyPolicy {
  version: string;
  accepted: boolean;
}

export interface ShipmentStatusUpdate {
  status: string;
  date: Date;
  description: string;
}

export interface BuyerPort {
  // Profile Management
  consultMyProfile(user: User): Promise<Buyer>;
  updateMyProfile(user: User, buyer: Buyer): Promise<Buyer>;
  consultMyTrustLevel(user: User): Promise<string>;

  // Address Management
  consultMyDeliveryAddresses(user: User): Promise<DeliveryAddress[]>;
  addDeliveryAddress(user: User, address: DeliveryAddress): Promise<DeliveryAddress>;
  setPrimaryDeliveryAddress(user: User, address: DeliveryAddress): Promise<DeliveryAddress>;
  removeDeliveryAddress(user: User, address: DeliveryAddress): Promise<void>;

  // Payment Methods
  consultMyPaymentMethods(user: User): Promise<PaymentMethod[]>;
  addPaymentMethod(user: User, method: PaymentMethod): Promise<PaymentMethod>;
  setDefaultPaymentMethod(user: User, method: PaymentMethod): Promise<PaymentMethod>;
  removePaymentMethod(user: User, method: PaymentMethod): Promise<void>;

  // Shopping Cart
  createCart(user: User): Promise<ShoppingCart>;
  consultMyCart(user: User): Promise<ShoppingCart>;
  /**
   * Upsert semantics: if (product, variant) already exists in cart, increment quantity (merge).
   * Returns ShoppingCart. No 409 on duplicate - only for blocked operations per Contract-alignment.md §6.
   */
  addItemToCart(user: User, cart: ShoppingCart, product: Product, variant: ProductVariant, quantity: Quantity): Promise<ShoppingCart>;
  updateCartItem(user: User, cart: ShoppingCart, line: any, newQuantity: Quantity): Promise<ShoppingCart>;
  removeCartItem(user: User, cart: ShoppingCart, line: any): Promise<ShoppingCart>;
  mergeCart(user: User, currentCart: ShoppingCart, previousCart: ShoppingCart): Promise<ShoppingCart>;
  cancelCart(user: User, cart: ShoppingCart): Promise<void>;

  // Checkout & Orders
  checkoutCart(user: User, cart: ShoppingCart, deliveryAddress: DeliveryAddress, paymentMethod: PaymentMethod): Promise<Order>;
  consultMyOrders(user: User): Promise<Order[]>;
  consultOrderDetails(user: User, order: Order): Promise<Order>;
  consultMyOrderHistory(user: User, order: Order): Promise<Operation[]>;
  updateOrderDeliveryAddress(user: User, order: Order, newAddress: DeliveryAddress): Promise<Order>;

  // Shipment Tracking
  trackShipment(user: User, shipment: Shipment): Promise<Shipment>;
  consultShipmentProgress(user: User, shipment: Shipment): Promise<ShipmentStatusUpdate[]>;

  // Returns & Refunds
  requestReturn(user: User, order: Order, reason: string, evidence: string): Promise<Return>;
  consultMyReturns(user: User): Promise<Return[]>;
  consultReturnDetails(user: User, returnCase: Return): Promise<Return>;

  // Preferences & Privacy
  consultMyPreferences(user: User): Promise<BuyerPreferences>;
  updateMyPreferences(user: User, preferences: BuyerPreferences): Promise<BuyerPreferences>;
  grantDataPrivacyConsent(user: User, policy: PrivacyPolicy): Promise<void>;
  revokeDataPrivacyConsent(user: User, policy: PrivacyPolicy): Promise<void>;
  exportMyPrivacyData(user: User): Promise<string>;
}
