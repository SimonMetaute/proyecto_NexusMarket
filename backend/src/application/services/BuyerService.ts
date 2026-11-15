/**
 * Application Service: BuyerService
 * Implements BuyerPort
 *
 * Lógica de negocio del comprador: perfil, direcciones, métodos de pago,
 * carrito (upsert), checkout, pedidos, envíos, devoluciones y privacidad.
 */
import type {
  BuyerPort,
  Quantity,
  BuyerPreferences,
  PrivacyPolicy,
  ShipmentStatusUpdate,
} from '../../domain/ports/in/BuyerPort.js';
import type { User } from '../../domain/model/user.js';
import { Buyer, BuyerTrustLevel } from '../../domain/entities/Buyer.js';
import type { DeliveryAddress, PaymentMethod } from '../../domain/model/value-objects.js';
import { CartLine, ShoppingCart, CartStatus } from '../../domain/entities/ShoppingCart.js';
import { OrderLine, Order } from '../../domain/entities/Order.js';
import { OrderStatus } from '../../domain/model/enums.js';
import { Warehouse } from '../../domain/entities/Warehouse.js';
import type { Product } from '../../domain/entities/Product.js';
import type { ProductVariant } from '../../domain/entities/ProductVariant.js';
import type { Shipment } from '../../domain/entities/Shipment.js';
import type { Return } from '../../domain/entities/Return.js';
import type { Operation } from '../../domain/entities/Operation.js';
import type { BuyerRepositoryPort } from '../../domain/ports/out/BuyerRepositoryPort.js';
import type { ShoppingCartRepositoryPort } from '../../domain/ports/out/ShoppingCartRepositoryPort.js';
import type { OrderRepositoryPort } from '../../domain/ports/out/OrderRepositoryPort.js';
import type { InventoryRepositoryPort } from '../../domain/ports/out/InventoryRepositoryPort.js';
import type { ProductRepository } from '../../domain/ports/out/ProductRepository.js';
import type { ProductVariantRepositoryPort } from '../../domain/ports/out/ProductVariantRepositoryPort.js';
import type { WarehouseRepositoryPort } from '../../domain/ports/out/WarehouseRepositoryPort.js';
import type { AuditLogRepository } from '../../domain/ports/out/AuditLogRepository.js';
import { AuditLog } from '../../domain/model/AuditLog.js';
import { ApiError } from '../../domain/errors/ApiError.js';

export class BuyerService implements BuyerPort {
  constructor(
    private readonly buyerRepository: BuyerRepositoryPort,
    private readonly cartRepository: ShoppingCartRepositoryPort,
    private readonly orderRepository: OrderRepositoryPort,
    private readonly inventoryRepository: InventoryRepositoryPort,
    private readonly productRepository: ProductRepository,
    private readonly variantRepository: ProductVariantRepositoryPort,
    private readonly warehouseRepository: WarehouseRepositoryPort,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  // --- Profile Management ---
  async consultMyProfile(user: User): Promise<Buyer> {
    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) {
      throw ApiError.notFound(`Buyer profile not found for user ${user.userId}`);
    }
    return buyer;
  }

  async updateMyProfile(user: User, buyer: Buyer): Promise<Buyer> {
    const existing = await this.buyerRepository.findByUser(user);
    if (!existing) {
      throw ApiError.notFound(`Buyer profile not found for user ${user.userId}`);
    }
    if (existing.buyerId !== buyer.buyerId) {
      throw ApiError.forbidden('Cannot modify another buyer profile');
    }
    return this.buyerRepository.save(buyer);
  }

  async consultMyTrustLevel(user: User): Promise<string> {
    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) {
      throw ApiError.notFound(`Buyer profile not found for user ${user.userId}`);
    }
    return buyer.trustLevel;
  }

  // --- Address Management ---
  async consultMyDeliveryAddresses(user: User): Promise<DeliveryAddress[]> {
    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) {
      throw ApiError.notFound(`Buyer profile not found for user ${user.userId}`);
    }
    return buyer.deliveryAddresses;
  }

  async addDeliveryAddress(user: User, address: DeliveryAddress): Promise<DeliveryAddress> {
    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) {
      throw ApiError.notFound(`Buyer profile not found for user ${user.userId}`);
    }
    buyer.addDeliveryAddress(address);
    await this.buyerRepository.save(buyer);
    return address;
  }

  async setPrimaryDeliveryAddress(user: User, address: DeliveryAddress): Promise<DeliveryAddress> {
    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) {
      throw ApiError.notFound(`Buyer profile not found for user ${user.userId}`);
    }
    const normalized = buyer.deliveryAddresses.map((a) =>
      a.addressId === address.addressId ? { ...a, isPrimary: true } : { ...a, isPrimary: false },
    );
    const params: any = {
      buyerId: buyer.buyerId,
      userId: buyer.userId,
      deliveryAddresses: normalized,
      paymentMethods: buyer.paymentMethods,
      trustLevel: buyer.trustLevel,
    };
    if (buyer.lastPurchaseDate) {
      params.lastPurchaseDate = buyer.lastPurchaseDate;
    }
    await this.buyerRepository.save(new Buyer(params));
    return address;
  }

  async removeDeliveryAddress(user: User, address: DeliveryAddress): Promise<void> {
    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) {
      throw ApiError.notFound(`Buyer profile not found for user ${user.userId}`);
    }
    const params: any = {
      buyerId: buyer.buyerId,
      userId: buyer.userId,
      deliveryAddresses: buyer.deliveryAddresses.filter((a) => a.addressId !== address.addressId),
      paymentMethods: buyer.paymentMethods,
      trustLevel: buyer.trustLevel,
    };
    if (buyer.lastPurchaseDate) {
      params.lastPurchaseDate = buyer.lastPurchaseDate;
    }
    await this.buyerRepository.save(new Buyer(params));
  }

  // --- Payment Methods ---
  async consultMyPaymentMethods(user: User): Promise<PaymentMethod[]> {
    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) {
      throw ApiError.notFound(`Buyer profile not found for user ${user.userId}`);
    }
    return buyer.paymentMethods;
  }

  async addPaymentMethod(user: User, method: PaymentMethod): Promise<PaymentMethod> {
    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) {
      throw ApiError.notFound(`Buyer profile not found for user ${user.userId}`);
    }
    buyer.addPaymentMethod(method);
    await this.buyerRepository.save(buyer);
    return method;
  }

  async setDefaultPaymentMethod(user: User, method: PaymentMethod): Promise<PaymentMethod> {
    return method;
  }

  async removePaymentMethod(user: User, method: PaymentMethod): Promise<void> {
    // No-op at this stage; business rule kept minimal per SDD.
  }

  // --- Shopping Cart ---
  async createCart(user: User): Promise<ShoppingCart> {
    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) {
      throw ApiError.notFound(`Buyer profile not found for user ${user.userId}`);
    }
    const cart = new ShoppingCart({
      cartId: globalThis.crypto.randomUUID(),
      buyerId: buyer.buyerId,
      status: CartStatus.OPEN,
      updateDate: new Date(),
    });
    await this.cartRepository.save(cart);

    await this.auditLogRepository.save(
      new AuditLog({
        id: globalThis.crypto.randomUUID(),
        actorId: user.userId,
        action: 'CART_CREATION',
        timestamp: new Date(),
        details: { cartId: cart.cartId, buyerId: buyer.buyerId },
      }),
    );
    return cart;
  }

  async consultMyCart(user: User): Promise<ShoppingCart> {
    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) {
      throw ApiError.notFound(`Buyer profile not found for user ${user.userId}`);
    }
    const cart = await this.cartRepository.findOpenByBuyer(buyer);
    if (!cart) {
      throw ApiError.notFound('No open cart found for this buyer');
    }
    return cart;
  }

  /**
   * Upsert semantics (Contract-alignment.md):
   *  - If a line with the same (productId, variantId) exists -> increment quantity, return cart (200 OK).
   *  - Otherwise -> create new line, return cart (201 Created).
   *  - Never returns 409 for this operation.
   */
  async addItemToCart(
    user: User,
    cart: ShoppingCart,
    productId: string,
    variantId: string | undefined,
    quantity: Quantity,
  ): Promise<ShoppingCart> {
    if (quantity.value <= 0) {
      throw ApiError.invalidRequest('Quantity must be greater than zero.');
    }

    // Prices and variant data always come from the catalog, never from the
    // request body: a buyer must not be able to choose the unit price.
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw ApiError.notFound(`Product ${productId} not found.`);
    }

    let unitPrice = product.price;
    if (variantId !== undefined) {
      const variant = await this.variantRepository.findByIdentifier({
        variantId,
      } as ProductVariant);
      if (!variant || variant.productId !== product.productId) {
        throw ApiError.notFound(`Variant ${variantId} not found for product ${productId}.`);
      }
      unitPrice += variant.additionalPrice ?? 0;
    }

    const existingLine = cart.cartLines.find(
      (line) => line.productId === product.productId && line.variantId === variantId,
    );

    if (existingLine) {
      existingLine.updateQuantity(existingLine.quantity + quantity.value);
      // The cart totals are derived from the lines; recalculate so the
      // response never reports a stale subtotal/total after an increment.
      cart.recalculate();
      await this.cartRepository.save(cart);

      await this.auditLogRepository.save(
        new AuditLog({
          id: globalThis.crypto.randomUUID(),
          actorId: user.userId,
          action: 'CART_MODIFICATION',
          timestamp: new Date(),
          details: {
            cartId: cart.cartId,
            productId: product.productId,
            variantId,
            newQuantity: existingLine.quantity,
            operation: 'increment',
          },
        }),
      );
      return cart;
    }

    const params: any = {
      cartLineId: globalThis.crypto.randomUUID(),
      productId: product.productId,
      quantity: quantity.value,
      unitPrice,
    };
    if (variantId !== undefined) {
      params.variantId = variantId;
    }
    const line = new CartLine(params);
    cart.addLine(line);
    await this.cartRepository.save(cart);

    await this.auditLogRepository.save(
      new AuditLog({
        id: globalThis.crypto.randomUUID(),
        actorId: user.userId,
        action: 'CART_MODIFICATION',
        timestamp: new Date(),
        details: {
          cartId: cart.cartId,
          productId: product.productId,
          variantId,
          quantity: quantity.value,
          operation: 'add',
        },
      }),
    );
    return cart;
  }

  async updateCartItem(
    user: User,
    cart: ShoppingCart,
    line: { cartLineId: string },
    newQuantity: Quantity,
  ): Promise<ShoppingCart> {
    if (!line.cartLineId) {
      throw ApiError.invalidRequest('cartLineId is required.');
    }

    const existingLine = cart.cartLines.find((l) => l.cartLineId === line.cartLineId);
    if (!existingLine) {
      throw ApiError.notFound(`Cart line ${line.cartLineId} not found`);
    }

    existingLine.updateQuantity(newQuantity.value);
    cart.recalculate();
    await this.cartRepository.save(cart);
    return cart;
  }

  async removeCartItem(user: User, cart: ShoppingCart, line: { cartLineId: string }): Promise<ShoppingCart> {
    if (!line.cartLineId) {
      throw ApiError.invalidRequest('cartLineId is required.');
    }
    cart.removeLine(line.cartLineId);
    await this.cartRepository.save(cart);
    return cart;
  }

  async mergeCart(
    user: User,
    currentCart: ShoppingCart,
    previousCart: ShoppingCart,
  ): Promise<ShoppingCart> {
    for (const line of previousCart.cartLines) {
      const existing = currentCart.cartLines.find((l) => l.productId === line.productId);
      if (existing) {
        existing.updateQuantity(existing.quantity + line.quantity);
      } else {
        currentCart.addLine(line);
      }
    }
    currentCart.recalculate();
    await this.cartRepository.save(currentCart);
    return currentCart;
  }

  async cancelCart(user: User, cart: ShoppingCart): Promise<void> {
    cart.cancel();
    await this.cartRepository.save(cart);
  }

  // --- Checkout & Orders ---
  async checkoutCart(
    user: User,
    cart: ShoppingCart,
    deliveryAddress: DeliveryAddress,
    paymentMethod: PaymentMethod,
  ): Promise<Order> {
    if (cart.cartLines.length === 0) {
      throw ApiError.invalidRequest('Cannot checkout an empty cart.');
    }

    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) {
      throw ApiError.notFound(`Buyer profile not found for user ${user.userId}`);
    }

    // Resolve products and enforce the single-seller cart invariant before any
    // mutation. This also gives the order a real sellerId.
    const sellerIds = new Set<string>();
    const prepared: Array<{ product: Product; quantity: number }> = [];
    const orderLines: OrderLine[] = [];

    for (const line of cart.cartLines) {
      const product = await this.productRepository.findById(line.productId);
      if (!product) {
        throw ApiError.notFound(`Product ${line.productId} not found.`);
      }
      if (!product.sellerId) {
        throw ApiError.invalidDomainValue(`Product ${line.productId} has no seller.`);
      }
      sellerIds.add(product.sellerId);

      const params: any = {
        orderLineId: line.cartLineId,
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        subtotal: line.subtotal,
      };
      if (line.variantId !== undefined) {
        params.variantId = line.variantId;
      }
      orderLines.push(new OrderLine(params));
      prepared.push({ product, quantity: line.quantity });
    }

    if (sellerIds.size > 1) {
      throw ApiError.invalidDomainValue('A cart cannot mix products from multiple sellers.');
    }
    const sellerId = [...sellerIds][0] ?? '';

    const order = new Order({
      orderId: globalThis.crypto.randomUUID(),
      buyerId: buyer.buyerId,
      sellerId,
      orderLines,
      subtotal: cart.subtotal,
      taxes: 0,
      shippingCost: 0,
      total: cart.total,
      orderStatus: OrderStatus.PENDING,
      creationDate: new Date(),
    });

    // Reserve inventory. If any step fails, release what was already reserved
    // (compensating transaction) so stock is never lost.
    const reserved: Array<{ product: Product; warehouse: Warehouse; quantity: number }> = [];
    try {
      for (const item of prepared) {
        const inventoryList = await this.inventoryRepository.findByProduct(item.product);
        if (!inventoryList || inventoryList.length === 0) {
          throw ApiError.invalidDomainValue(`No inventory for product ${item.product.productId}.`);
        }
        const inv =
          inventoryList.find((candidate) => candidate.availableStock >= item.quantity) ??
          inventoryList[0];
        if (!inv) {
          throw ApiError.invalidDomainValue(`No inventory record for product ${item.product.productId}.`);
        }
        const warehouse = await this.warehouseRepository.findById(inv.warehouseId);
        if (!warehouse) {
          throw ApiError.invalidDomainValue(`Warehouse ${inv.warehouseId} not found.`);
        }
        await this.inventoryRepository.reserve(
          item.product,
          warehouse,
          { value: item.quantity } as any,
          order,
        );
        reserved.push({ product: item.product, warehouse, quantity: item.quantity });
      }

      await this.orderRepository.save(order);
      cart.convert();
      await this.cartRepository.save(cart);
    } catch (error) {
      for (const item of reserved.reverse()) {
        try {
          await this.inventoryRepository.release(
            item.product,
            item.warehouse,
            { value: item.quantity } as any,
            order,
          );
        } catch (releaseError) {
          console.error(
            `[checkout] Could not release reservation for ${item.product.productId}`,
            releaseError,
          );
        }
      }
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.invalidDomainValue(
        error instanceof Error ? error.message : 'Checkout failed.',
      );
    }

    await this.auditLogRepository.save(
      new AuditLog({
        id: globalThis.crypto.randomUUID(),
        actorId: user.userId,
        action: 'ORDER_CREATION',
        timestamp: new Date(),
        details: { orderId: order.orderId, cartId: cart.cartId, total: order.total },
      }),
    );
    return order;
  }

  async consultMyOrders(user: User): Promise<Order[]> {
    const buyer = await this.buyerRepository.findByUser(user);
    if (!buyer) {
      throw ApiError.notFound(`Buyer profile not found for user ${user.userId}`);
    }
    return this.orderRepository.findByBuyer(buyer);
  }

  async consultOrderDetails(user: User, order: Order): Promise<Order> {
    const found = await this.orderRepository.findByIdentifier(order);
    if (!found) {
      throw ApiError.notFound(`Order ${order.orderId} not found`);
    }
    return found;
  }

  async consultMyOrderHistory(user: User, order: Order): Promise<Operation[]> {
    return [];
  }

  async updateOrderDeliveryAddress(
    user: User,
    order: Order,
    newAddress: DeliveryAddress,
  ): Promise<Order> {
    throw ApiError.invalidRequest('Order delivery address update not supported yet.');
  }

  // --- Shipment Tracking ---
  async trackShipment(user: User, shipment: Shipment): Promise<Shipment> {
    return shipment;
  }

  async consultShipmentProgress(user: User, shipment: Shipment): Promise<ShipmentStatusUpdate[]> {
    return [];
  }

  // --- Returns & Refunds ---
  async requestReturn(
    user: User,
    order: Order,
    reason: string,
    evidence: string,
  ): Promise<Return> {
    throw ApiError.invalidRequest('Return request not implemented yet.');
  }

  async consultMyReturns(user: User): Promise<Return[]> {
    return [];
  }

  async consultReturnDetails(user: User, returnCase: Return): Promise<Return> {
    return returnCase;
  }

  // --- Preferences & Privacy ---
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
