/**
 * Application Service: BuyerService
 * Implements BuyerPort
 */

import type { BuyerPort, Quantity, BuyerPreferences, PrivacyPolicy, ShipmentStatusUpdate } from '../../domain/ports/in/BuyerPort.js';
import type { User } from '../../domain/model/user.js';
import type { Buyer } from '../../domain/entities/Buyer.js';
import type { DeliveryAddress, PaymentMethod } from '../../domain/model/value-objects.js';
import type { ShoppingCart } from '../../domain/entities/ShoppingCart.js';
import type { Product } from '../../domain/entities/Product.js';
import type { ProductVariant } from '../../domain/entities/ProductVariant.js';
import type { Order } from '../../domain/entities/Order.js';
import type { Shipment } from '../../domain/entities/Shipment.js';
import type { Return } from '../../domain/entities/Return.js';
import type { Operation } from '../../domain/entities/Operation.js';
import type { BuyerRepositoryPort } from '../../domain/ports/out/BuyerRepositoryPort.js';
import type { ShoppingCartRepositoryPort } from '../../domain/ports/out/ShoppingCartRepositoryPort.js';
import type { OrderRepositoryPort } from '../../domain/ports/out/OrderRepositoryPort.js';

export class BuyerService implements BuyerPort {
  constructor(
    private readonly buyerRepository: BuyerRepositoryPort,
    private readonly cartRepository: ShoppingCartRepositoryPort,
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  async consultMyProfile(user: User): Promise<Buyer> {
    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) throw new Error('Buyer profile not found');
    return buyer;
  }

  async updateMyProfile(user: User, buyer: Buyer): Promise<Buyer> {
    return this.buyerRepository.save(buyer);
  }

  async consultMyTrustLevel(user: User): Promise<string> {
    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) throw new Error('Buyer profile not found');
    return buyer.trustLevel;
  }

  async consultMyDeliveryAddresses(user: User): Promise<DeliveryAddress[]> {
    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) throw new Error('Buyer profile not found');
    return buyer.deliveryAddresses;
  }

  async addDeliveryAddress(user: User, address: DeliveryAddress): Promise<DeliveryAddress> {
    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) throw new Error('Buyer profile not found');
    buyer.addDeliveryAddress(address);
    await this.buyerRepository.save(buyer);
    return address;
  }

  async setPrimaryDeliveryAddress(user: User, address: DeliveryAddress): Promise<DeliveryAddress> {
    return address;
  }

  async removeDeliveryAddress(user: User, address: DeliveryAddress): Promise<void> {
    // Implementation
  }

  async consultMyPaymentMethods(user: User): Promise<PaymentMethod[]> {
    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) throw new Error('Buyer profile not found');
    return buyer.paymentMethods;
  }

  async addPaymentMethod(user: User, method: PaymentMethod): Promise<PaymentMethod> {
    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) throw new Error('Buyer profile not found');
    buyer.addPaymentMethod(method);
    await this.buyerRepository.save(buyer);
    return method;
  }

  async setDefaultPaymentMethod(user: User, method: PaymentMethod): Promise<PaymentMethod> {
    return method;
  }

  async removePaymentMethod(user: User, method: PaymentMethod): Promise<void> {
    // Implementation
  }

  async createCart(user: User): Promise<ShoppingCart> {
    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) throw new Error('Buyer profile not found');
    // Create cart - simplified
    throw new Error('Not implemented yet');
  }

  async consultMyCart(user: User): Promise<ShoppingCart> {
    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) throw new Error('Buyer profile not found');
    const cart = await this.cartRepository.findOpenByBuyer(buyer);
    if (!cart) throw new Error('Cart not found');
    return cart;
  }

  async addItemToCart(user: User, cart: ShoppingCart, product: Product, variant: ProductVariant, quantity: Quantity): Promise<ShoppingCart> {
    // Upsert semantics per Contract-alignment.md
    return cart;
  }

  async updateCartItem(user: User, cart: ShoppingCart, line: any, newQuantity: Quantity): Promise<ShoppingCart> {
    return cart;
  }

  async removeCartItem(user: User, cart: ShoppingCart, line: any): Promise<ShoppingCart> {
    return cart;
  }

  async mergeCart(user: User, currentCart: ShoppingCart, previousCart: ShoppingCart): Promise<ShoppingCart> {
    return currentCart;
  }

  async cancelCart(user: User, cart: ShoppingCart): Promise<void> {
    // Implementation
  }

  async checkoutCart(user: User, cart: ShoppingCart, deliveryAddress: DeliveryAddress, paymentMethod: PaymentMethod): Promise<Order> {
    throw new Error('Not implemented yet');
  }

  async consultMyOrders(user: User): Promise<Order[]> {
    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) throw new Error('Buyer profile not found');
    return this.orderRepository.findByBuyer(buyer);
  }

  async consultOrderDetails(user: User, order: Order): Promise<Order> {
    const found = await this.orderRepository.findByIdentifier(order);
    if (!found) throw new Error('Order not found');
    return found;
  }

  async consultMyOrderHistory(user: User, order: Order): Promise<Operation[]> {
    return [];
  }

  async updateOrderDeliveryAddress(user: User, order: Order, newAddress: DeliveryAddress): Promise<Order> {
    throw new Error('Not implemented yet');
  }

  async trackShipment(user: User, shipment: Shipment): Promise<Shipment> {
    return shipment;
  }

  async consultShipmentProgress(user: User, shipment: Shipment): Promise<ShipmentStatusUpdate[]> {
    return [];
  }

  async requestReturn(user: User, order: Order, reason: string, evidence: string): Promise<Return> {
    throw new Error('Not implemented yet');
  }

  async consultMyReturns(user: User): Promise<Return[]> {
    return [];
  }

  async consultReturnDetails(user: User, returnCase: Return): Promise<Return> {
    return returnCase;
  }

  async consultMyPreferences(user: User): Promise<BuyerPreferences> {
    return { notifications: true, language: 'es' };
  }

  async updateMyPreferences(user: User, preferences: BuyerPreferences): Promise<BuyerPreferences> {
    return preferences;
  }

  async grantDataPrivacyConsent(user: User, policy: PrivacyPolicy): Promise<void> {}

  async revokeDataPrivacyConsent(user: User, policy: PrivacyPolicy): Promise<void> {}

  async exportMyPrivacyData(user: User): Promise<string> {
    return '{}';
  }
}
