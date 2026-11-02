/**
 * Routes: Administrator
 * All endpoints require authentication and ADMINISTRATOR role.
 */
import type { Request, Response } from 'express';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import { AdministratorController } from '../controllers/AdministratorController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { requireRole } from '../middlewares/requireRole.js';

export function createAdminRoutes(
  adminController: AdministratorController,
  authMiddleware: RequestHandler,
): Router {
  const router = Router();

  router.get(
    '/admin/users',
    authMiddleware,
    requireRole('ADMINISTRATOR'),
    asyncHandler((req: Request, res: Response) =>
      adminController.consultUsers(req, res),
    ),
  );
  router.post(
    '/admin/sellers/:sellerId/approve',
    authMiddleware,
    requireRole('ADMINISTRATOR'),
    asyncHandler((req: Request, res: Response) =>
      adminController.approveSeller(req, res),
    ),
  );
  router.post(
    '/admin/sellers/:sellerId/reject',
    authMiddleware,
    requireRole('ADMINISTRATOR'),
    asyncHandler((req: Request, res: Response) =>
      adminController.rejectSeller(req, res),
    ),
  );
  router.get(
    '/admin/dashboard',
    authMiddleware,
    requireRole('ADMINISTRATOR'),
    asyncHandler((req: Request, res: Response) =>
      adminController.consultOperationalDashboard(req, res),
    ),
  );

  return router;
}
