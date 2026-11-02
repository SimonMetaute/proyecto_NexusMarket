import type { Request, Response } from 'express';
import { Router } from 'express';
import { ProductController } from '../controllers/ProductController.js';

export function createProductRoutes(productController: ProductController): Router {
  const router = Router();

  router.post('/products', (req: Request, res: Response) => {
    void productController.createProduct(req, res);
  });

  router.get('/products', (req: Request, res: Response) => {
    void productController.listProducts(req, res);
  });

  return router;
}