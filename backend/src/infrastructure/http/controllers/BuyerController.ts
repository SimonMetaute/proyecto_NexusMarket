/**
 * Controller: BuyerController
 * Endpoints del comprador (requieren autenticación, rol BUYER).
 */
import type { Request, Response } from 'express';
import type { BuyerPort } from '../../../domain/ports/in/BuyerPort.js';
import type { User } from '../../../domain/model/user.js';
import type { DeliveryAddress, PaymentMethod } from '../../../domain/model/value-objects.js';
import { ProductVariant } from '../../../domain/entities/ProductVariant.js';
import { ApiError } from '../errors/ApiError.js';
import {
  optionalString,
  requireObject,
  requireString,
  requireParam,
  requirePositiveInt,
  requireEnum,
  requireNumber,
  optionalNumber,
} from '../validation/validator.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { DeliveryAddress as DeliveryAddressVO } from '../../../domain/model/value-objects.js';
import { PaymentMethod as PaymentMethodVO } from '../../../domain/model/value-objects.js';
import { Buyer as BuyerEntity } from '../../../domain/entities/Buyer.js';

function toDeliveryAddressDto(body: any): DeliveryAddressVO {
  return new DeliveryAddressVO({
    addressId: requireString(body, 'addressId', { maxLength: 36 }),
    country: requireString(body, 'country', { maxLength: 100 }),
    department: requireString(body, 'department', { maxLength: 100 }),
    city: requireString(body, 'city', { maxLength: 100 }),
    neighborhood: requireString(body, 'neighborhood', { maxLength: 100 }),
    address: requireString(body, 'address', { maxLength: 255 }),
    postalCode: requireString(body, 'postalCode', { maxLength: 20 }),
    reference: optionalString(body, 'reference', { maxLength: 255 }) ?? '',
    isPrimary: body.isPrimary === true,
  });
}

function toPaymentMethodDto(body: any): PaymentMethodVO {
  return new PaymentMethodVO({
    paymentMethodId: requireString(body, 'paymentMethodId', { maxLength: 36 }),
    type: requireString(body, 'type', { maxLength: 50 }),
    maskedNumber: requireString(body, 'maskedNumber', { maxLength: 50 }),
    cardholder: requireString(body, 'cardholder', { maxLength: 100 }),
    expirationDate: requireString(body, 'expirationDate', { maxLength: 20 }),
    brand: requireString(body, 'brand', { maxLength: 50 }),
    isDefault: body.isDefault === true,
  });
}

function asString(value: string | string[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

export class BuyerController {
  private readonly buyerService: BuyerPort;

  constructor(buyerService: BuyerPort) {
    this.buyerService = buyerService;
  }

  async consultMyProfile(req: Request, res: Response): Promise<void> {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    const buyer = await this.buyerService.consultMyProfile(user);
    res.status(200).json({
      buyerId: buyer.buyerId,
      userId: buyer.userId,
      trustLevel: buyer.trustLevel,
      lastPurchaseDate: buyer.lastPurchaseDate,
      deliveryAddresses: buyer.deliveryAddresses,
      paymentMethods: buyer.paymentMethods,
    });
  }

  async updateMyProfile(req: Request, res: Response): Promise<void> {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    const body = requireObject(req.body);
    const buyer = await this.buyerService.consultMyProfile(user);
    const params: any = {
      buyerId: buyer.buyerId,
      userId: buyer.userId,
      deliveryAddresses: buyer.deliveryAddresses,
      paymentMethods: buyer.paymentMethods,
      trustLevel: buyer.trustLevel,
    };
    if (body.trustLevel !== undefined) {
      params.trustLevel = requireEnum(body, 'trustLevel', ['Low', 'Medium', 'High']);
    }
    if (body.lastPurchaseDate !== undefined) {
      params.lastPurchaseDate = new Date(String(body.lastPurchaseDate));
    }
    const updated = await this.buyerService.updateMyProfile(
      user,
      new BuyerEntity(params),
    );
    res.status(200).json({
      buyerId: updated.buyerId,
      userId: updated.userId,
      trustLevel: updated.trustLevel,
    });
  }

  async consultMyDeliveryAddresses(req: Request, res: Response): Promise<void> {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    const addresses = await this.buyerService.consultMyDeliveryAddresses(user);
    res.status(200).json(addresses);
  }

  async addDeliveryAddress(req: Request, res: Response): Promise<void> {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    const body = requireObject(req.body);
    const address = toDeliveryAddressDto(body);
    const created = await this.buyerService.addDeliveryAddress(user, address);
    res.status(201).json(created);
  }

  async setPrimaryDeliveryAddress(req: Request, res: Response): Promise<void> {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    const addressId = requireParam(asString(req.params.addressId), 'addressId');
    const buyer = await this.buyerService.consultMyProfile(user);
    const address = buyer.deliveryAddresses.find((a) => a.addressId === addressId);
    if (!address) {
      throw ApiError.notFound(`Address ${addressId} not found`);
    }
    const updated = await this.buyerService.setPrimaryDeliveryAddress(user, {
      ...address,
      isPrimary: true,
    } as DeliveryAddressVO);
    res.status(200).json(updated);
  }

  async removeDeliveryAddress(req: Request, res: Response): Promise<void> {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    const addressId = requireParam(asString(req.params.addressId), 'addressId');
    const buyer = await this.buyerService.consultMyProfile(user);
    const address = buyer.deliveryAddresses.find((a) => a.addressId === addressId);
    if (!address) {
      throw ApiError.notFound(`Address ${addressId} not found`);
    }
    await this.buyerService.removeDeliveryAddress(user, address);
    res.status(204).send();
  }

  async consultMyPaymentMethods(req: Request, res: Response): Promise<void> {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    const methods = await this.buyerService.consultMyPaymentMethods(user);
    res.status(200).json(methods);
  }

  async addPaymentMethod(req: Request, res: Response): Promise<void> {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    const body = requireObject(req.body);
    const method = toPaymentMethodDto(body);
    const created = await this.buyerService.addPaymentMethod(user, method);
    res.status(201).json(created);
  }

  async consultMyCart(req: Request, res: Response): Promise<void> {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    const cart = await this.buyerService.consultMyCart(user);
    res.status(200).json({
      cartId: cart.cartId,
      buyerId: cart.buyerId,
      status: cart.status,
      subtotal: cart.subtotal,
      total: cart.total,
      updateDate: cart.updateDate,
      cartLines: cart.cartLines.map((line) => ({
        cartLineId: line.cartLineId,
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        subtotal: line.subtotal,
      })),
    });
  }

  async createCart(req: Request, res: Response): Promise<void> {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    const cart = await this.buyerService.createCart(user);
    res.status(201).json({
      cartId: cart.cartId,
      buyerId: cart.buyerId,
      status: cart.status,
      subtotal: cart.subtotal,
      total: cart.total,
      cartLines: [],
    });
  }

  async addItemToCart(req: Request, res: Response): Promise<void> {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    const body = requireObject(req.body);
    const cart = await this.buyerService.consultMyCart(user);
    const productId = requireString(body, 'productId', { maxLength: 36 });
    const quantity = { value: requirePositiveInt(body, 'quantity') };
    const variantId = optionalString(body, 'variantId');

    const existed = cart.cartLines.some(
      (l) => l.productId === productId && l.variantId === variantId,
    );

    const updated = await this.buyerService.addItemToCart(
      user,
      cart,
      productId,
      variantId,
      quantity,
    );

    res.status(existed ? 200 : 201).json({
      cartId: updated.cartId,
      cartLines: updated.cartLines.map((l) => ({
        cartLineId: l.cartLineId,
        productId: l.productId,
        variantId: l.variantId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        subtotal: l.subtotal,
      })),
      subtotal: updated.subtotal,
      total: updated.total,
    });
  }

  async updateCartItem(req: Request, res: Response): Promise<void> {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    const cartLineId = requireParam(asString(req.params.cartLineId), 'cartLineId');
    const body = requireObject(req.body);
    const cart = await this.buyerService.consultMyCart(user);
    const updated = await this.buyerService.updateCartItem(
      user,
      cart,
      { cartLineId },
      { value: requirePositiveInt(body, 'quantity') },
    );
    res.status(200).json({
      cartId: updated.cartId,
      cartLines: updated.cartLines.map((l) => ({
        cartLineId: l.cartLineId,
        productId: l.productId,
        variantId: l.variantId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        subtotal: l.subtotal,
      })),
    });
  }

  async removeCartItem(req: Request, res: Response): Promise<void> {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    const cartLineId = requireParam(asString(req.params.cartLineId), 'cartLineId');
    const cart = await this.buyerService.consultMyCart(user);
    await this.buyerService.removeCartItem(user, cart, { cartLineId });
    res.status(204).send();
  }

  async cancelCart(req: Request, res: Response): Promise<void> {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    const cart = await this.buyerService.consultMyCart(user);
    await this.buyerService.cancelCart(user, cart);
    res.status(204).send();
  }

  async checkoutCart(req: Request, res: Response): Promise<void> {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    const body = requireObject(req.body);
    const cart = await this.buyerService.consultMyCart(user);
    const address = toDeliveryAddressDto(body.deliveryAddress ?? {});
    const paymentMethod = toPaymentMethodDto(body.paymentMethod ?? {});
    const order = await this.buyerService.checkoutCart(
      user,
      cart,
      address,
      paymentMethod,
    );
    res.status(201).json({
      orderId: order.orderId,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      total: order.total,
      orderStatus: order.orderStatus,
      creationDate: order.creationDate,
    });
  }

  async consultMyOrders(req: Request, res: Response): Promise<void> {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    const orders = await this.buyerService.consultMyOrders(user);
    res.status(200).json(
      orders.map((o) => ({
        orderId: o.orderId,
        buyerId: o.buyerId,
        sellerId: o.sellerId,
        total: o.total,
        orderStatus: o.orderStatus,
        creationDate: o.creationDate,
      })),
    );
  }

  async consultOrderDetails(req: Request, res: Response): Promise<void> {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    const orderId = requireParam(asString(req.params.orderId), 'orderId');
    const orders = await this.buyerService.consultMyOrders(user);
    const order = orders.find((o) => o.orderId === orderId);
    if (!order) {
      throw ApiError.notFound(`Order ${orderId} not found`);
    }
    const details = await this.buyerService.consultOrderDetails(user, order);
    res.status(200).json({
      orderId: details.orderId,
      total: details.total,
      status: details.orderStatus,
      orderStatus: details.orderStatus,
      items: details.orderLines.map((line) => ({
        lineId: line.orderLineId,
        product: { productId: line.productId },
        variantId: line.variantId,
        quantity: line.quantity,
        price: line.unitPrice,
        subtotal: line.subtotal,
      })),
    });
  }
}
