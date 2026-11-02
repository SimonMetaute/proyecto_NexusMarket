/**
 * Routes: Buyer
 * All endpoints require authentication (any role) and are scoped to BUYER.
 */
import type { Request, Response } from 'express';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import { BuyerController } from '../controllers/BuyerController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { requireRole } from '../middlewares/requireRole.js';

export function createBuyerRoutes(
  buyerController: BuyerController,
  authMiddleware: RequestHandler,
): Router {
  const router = Router();

  // Profile
  router.get(
    '/buyer/profile',
    authMiddleware,
    requireRole('BUYER'),
    asyncHandler((req: Request, res: Response) =>
      buyerController.consultMyProfile(req, res),
    ),
  );
  router.put(
    '/buyer/profile',
    authMiddleware,
    requireRole('BUYER'),
    asyncHandler((req: Request, res: Response) =>
      buyerController.updateMyProfile(req, res),
    ),
  );

  // Addresses
  router.get(
    '/buyer/addresses',
    authMiddleware,
    requireRole('BUYER'),
    asyncHandler((req: Request, res: Response) =>
      buyerController.consultMyDeliveryAddresses(req, res),
    ),
  );
  router.post(
    '/buyer/addresses',
    authMiddleware,
    requireRole('BUYER'),
    asyncHandler((req: Request, res: Response) =>
      buyerController.addDeliveryAddress(req, res),
    ),
  );
  router.put(
    '/buyer/addresses/:addressId/primary',
    authMiddleware,
    requireRole('BUYER'),
    asyncHandler((req: Request, res: Response) =>
      buyerController.setPrimaryDeliveryAddress(req, res),
    ),
  );
  router.delete(
    '/buyer/addresses/:addressId',
    authMiddleware,
    requireRole('BUYER'),
    asyncHandler((req: Request, res: Response) =>
      buyerController.removeDeliveryAddress(req, res),
    ),
  );

  // Payment methods
  router.get(
    '/buyer/payment-methods',
    authMiddleware,
    requireRole('BUYER'),
    asyncHandler((req: Request, res: Response) =>
      buyerController.consultMyPaymentMethods(req, res),
    ),
  );
  router.post(
    '/buyer/payment-methods',
    authMiddleware,
    requireRole('BUYER'),
    asyncHandler((req: Request, res: Response) =>
      buyerController.addPaymentMethod(req, res),
    ),
  );

  // Cart
  router.post(
    '/buyer/cart',
    authMiddleware,
    requireRole('BUYER'),
    asyncHandler((req: Request, res: Response) =>
      buyerController.createCart(req, res),
    ),
  );
  router.get(
    '/buyer/cart',
    authMiddleware,
    requireRole('BUYER'),
    asyncHandler((req: Request, res: Response) =>
      buyerController.consultMyCart(req, res),
    ),
  );
  router.post(
    '/buyer/cart/items',
    authMiddleware,
    requireRole('BUYER'),
    asyncHandler((req: Request, res: Response) =>
      buyerController.addItemToCart(req, res),
    ),
  );
  router.put(
    '/buyer/cart/items/:cartLineId',
    authMiddleware,
    requireRole('BUYER'),
    asyncHandler((req: Request, res: Response) =>
      buyerController.updateCartItem(req, res),
    ),
  );
  router.delete(
    '/buyer/cart/items/:cartLineId',
    authMiddleware,
    requireRole('BUYER'),
    asyncHandler((req: Request, res: Response) =>
      buyerController.removeCartItem(req, res),
    ),
  );
  router.delete(
    '/buyer/cart',
    authMiddleware,
    requireRole('BUYER'),
    asyncHandler((req: Request, res: Response) =>
      buyerController.cancelCart(req, res),
    ),
  );

  // Checkout & orders
  router.post(
    '/buyer/checkout',
    authMiddleware,
    requireRole('BUYER'),
    asyncHandler((req: Request, res: Response) =>
      buyerController.checkoutCart(req, res),
    ),
  );
  router.get(
    '/buyer/orders',
    authMiddleware,
    requireRole('BUYER'),
    asyncHandler((req: Request, res: Response) =>
      buyerController.consultMyOrders(req, res),
    ),
  );
  router.get(
    '/buyer/orders/:orderId',
    authMiddleware,
    requireRole('BUYER'),
    asyncHandler((req: Request, res: Response) =>
      buyerController.consultOrderDetails(req, res),
    ),
  );

  return router;
}
