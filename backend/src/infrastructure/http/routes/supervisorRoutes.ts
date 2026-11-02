/**
 * Routes: Supervisor
 * All endpoints require authentication and SUPERVISOR role.
 */
import type { Request, Response } from 'express';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import { SupervisorController } from '../controllers/SupervisorController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { requireRole } from '../middlewares/requireRole.js';

export function createSupervisorRoutes(
  supervisorController: SupervisorController,
  authMiddleware: RequestHandler,
): Router {
  const router = Router();

  router.get(
    '/supervisor/dashboard',
    authMiddleware,
    requireRole('SUPERVISOR'),
    asyncHandler((req: Request, res: Response) =>
      supervisorController.consultOperationalDashboard(req, res),
    ),
  );
  router.get(
    '/supervisor/health',
    authMiddleware,
    requireRole('SUPERVISOR'),
    asyncHandler((req: Request, res: Response) =>
      supervisorController.consultMarketplaceHealth(req, res),
    ),
  );

  return router;
}
