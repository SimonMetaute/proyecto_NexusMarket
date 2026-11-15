/**
 * Routes: Seller
 * All endpoints require authentication and SELLER role.
 */
import type { Request, Response } from 'express';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import { SellerController } from '../controllers/SellerController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { requireRole } from '../middlewares/requireRole.js';

export function createSellerRoutes(
  sellerController: SellerController,
  authMiddleware: RequestHandler,
): Router {
  const router = Router();

  // Profile
  router.get(
    '/seller/profile',
    authMiddleware,
    requireRole('SELLER'),
    asyncHandler((req: Request, res: Response) =>
      sellerController.consultMyProfile(req, res),
    ),
  );
  router.put(
    '/seller/profile',
    authMiddleware,
    requireRole('SELLER'),
    asyncHandler((req: Request, res: Response) =>
      sellerController.updateMyProfile(req, res),
    ),
  );

  // Warehouses
  router.get(
    '/seller/warehouses',
    authMiddleware,
    requireRole('SELLER'),
    asyncHandler((req: Request, res: Response) =>
      sellerController.consultMyWarehouses(req, res),
    ),
  );
  router.post(
    '/seller/warehouses',
    authMiddleware,
    requireRole('SELLER'),
    asyncHandler((req: Request, res: Response) =>
      sellerController.registerWarehouse(req, res),
    ),
  );

  // Products
  router.get(
    '/seller/products',
    authMiddleware,
    requireRole('SELLER'),
    asyncHandler((req: Request, res: Response) =>
      sellerController.consultMyProducts(req, res),
    ),
  );
  router.post(
    '/seller/products',
    authMiddleware,
    requireRole('SELLER'),
    asyncHandler((req: Request, res: Response) =>
      sellerController.createProduct(req, res),
    ),
  );
  router.put(
    '/seller/products/:productId',
    authMiddleware,
    requireRole('SELLER'),
    asyncHandler((req: Request, res: Response) =>
      sellerController.updateMyProduct(req, res),
    ),
  );
  router.get(
    '/seller/products/:productId/images',
    authMiddleware,
    requireRole('SELLER'),
    asyncHandler((req: Request, res: Response) =>
      sellerController.consultProductImages(req, res),
    ),
  );
  router.post(
    '/seller/products/:productId/images',
    authMiddleware,
    requireRole('SELLER'),
    asyncHandler((req: Request, res: Response) =>
      sellerController.addProductImage(req, res),
    ),
  );
  router.delete(
    '/seller/products/:productId/images/:imageId',
    authMiddleware,
    requireRole('SELLER'),
    asyncHandler((req: Request, res: Response) =>
      sellerController.removeProductImage(req, res),
    ),
  );
  router.post(
    '/seller/products/:productId/publish',
    authMiddleware,
    requireRole('SELLER'),
    asyncHandler((req: Request, res: Response) =>
      sellerController.publishProduct(req, res),
    ),
  );
  router.post(
    '/seller/products/:productId/variants',
    authMiddleware,
    requireRole('SELLER'),
    asyncHandler((req: Request, res: Response) =>
      sellerController.addProductVariant(req, res),
    ),
  );

  // Inventory
  router.get(
    '/seller/inventory',
    authMiddleware,
    requireRole('SELLER'),
    asyncHandler((req: Request, res: Response) =>
      sellerController.consultMyInventory(req, res),
    ),
  );
  router.post(
    '/seller/inventory/stock-entry',
    authMiddleware,
    requireRole('SELLER'),
    asyncHandler((req: Request, res: Response) =>
      sellerController.registerStockEntry(req, res),
    ),
  );

  // Orders
  router.get(
    '/seller/orders',
    authMiddleware,
    requireRole('SELLER'),
    asyncHandler((req: Request, res: Response) =>
      sellerController.consultMyOrdersForFulfillment(req, res),
    ),
  );
  router.post(
    '/seller/orders/:orderId/approve',
    authMiddleware,
    requireRole('SELLER'),
    asyncHandler((req: Request, res: Response) =>
      sellerController.approveOrder(req, res),
    ),
  );
  router.post(
    '/seller/orders/:orderId/prepare',
    authMiddleware,
    requireRole('SELLER'),
    asyncHandler((req: Request, res: Response) =>
      sellerController.prepareOrder(req, res),
    ),
  );

  // Dashboard
  router.get(
    '/seller/dashboard',
    authMiddleware,
    requireRole('SELLER'),
    asyncHandler((req: Request, res: Response) =>
      sellerController.consultMyDashboard(req, res),
    ),
  );

  return router;
}
