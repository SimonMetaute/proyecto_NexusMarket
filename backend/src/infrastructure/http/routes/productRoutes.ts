import type { Request, Response } from 'express';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import { ProductController } from '../controllers/ProductController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { requireRole } from '../middlewares/requireRole.js';

export function createProductRoutes(
  productController: ProductController,
  authMiddleware: RequestHandler,
): Router {
  const router = Router();

  // Contract §5.4 defines product creation under the SELLER role. The legacy
  // `/api/v1/products` alias keeps the old path while enforcing the same rule.
  router.post(
    '/products',
    authMiddleware,
    requireRole('SELLER'),
    asyncHandler((req: Request, res: Response) => productController.createProduct(req, res)),
  );

  // Public catalogue visibility (contract §2).
  router.get(
    '/products',
    asyncHandler((req: Request, res: Response) => productController.listProducts(req, res)),
  );

  return router;
}
