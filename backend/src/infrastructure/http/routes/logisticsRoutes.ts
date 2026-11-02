/**
 * Routes: Logistics Operator
 * All endpoints require authentication and LOGISTICS_OPERATOR role.
 */
import type { Request, Response } from 'express';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import { LogisticsController } from '../controllers/LogisticsController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { requireRole } from '../middlewares/requireRole.js';

export function createLogisticsRoutes(
  logisticsController: LogisticsController,
  authMiddleware: RequestHandler,
): Router {
  const router = Router();

  router.get(
    '/logistics/warehouses',
    authMiddleware,
    requireRole('LOGISTICS_OPERATOR'),
    asyncHandler((req: Request, res: Response) =>
      logisticsController.consultOperationalWarehouses(req, res),
    ),
  );
  router.post(
    '/logistics/inventory/stock-entry',
    authMiddleware,
    requireRole('LOGISTICS_OPERATOR'),
    asyncHandler((req: Request, res: Response) =>
      logisticsController.registerStockEntry(req, res),
    ),
  );
  router.post(
    '/logistics/shipments/:shipmentId/dispatch',
    authMiddleware,
    requireRole('LOGISTICS_OPERATOR'),
    asyncHandler((req: Request, res: Response) =>
      logisticsController.dispatchShipment(req, res),
    ),
  );
  router.post(
    '/logistics/shipments/:shipmentId/confirm-delivery',
    authMiddleware,
    requireRole('LOGISTICS_OPERATOR'),
    asyncHandler((req: Request, res: Response) =>
      logisticsController.confirmDelivery(req, res),
    ),
  );

  return router;
}
