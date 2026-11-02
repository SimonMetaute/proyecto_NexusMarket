/**
 * Routes: catalog (public)
 * GET /api/v1/catalog/products
 * GET /api/v1/catalog/products/:productId
 */
import type { Request, Response } from 'express';
import { Router } from 'express';
import { CatalogController } from '../controllers/CatalogController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export function createCatalogRoutes(catalogController: CatalogController): Router {
  const router = Router();

  router.get(
    '/catalog/products',
    asyncHandler((req: Request, res: Response) =>
      catalogController.searchProducts(req, res),
    ),
  );

  router.get(
    '/catalog/products/:productId',
    asyncHandler((req: Request, res: Response) =>
      catalogController.getProductDetails(req, res),
    ),
  );

  return router;
}
