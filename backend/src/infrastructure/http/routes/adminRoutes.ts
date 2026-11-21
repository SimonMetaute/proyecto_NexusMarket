/**
 * Routes: Administrator
 * Read endpoints allow ADMINISTRATOR and SUPERVISOR; mutations require
 * ADMINISTRATOR.
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
    requireRole('ADMINISTRATOR', 'SUPERVISOR'),
    asyncHandler((req: Request, res: Response) =>
      adminController.consultUsers(req, res),
    ),
  );

  router.patch(
    '/admin/users/:id/status',
    authMiddleware,
    requireRole('ADMINISTRATOR'),
    asyncHandler((req: Request, res: Response) =>
      adminController.changeUserStatus(req, res),
    ),
  );
  router.post(
    '/admin/sellers/onboarding',
    authMiddleware,
    requireRole('ADMINISTRATOR'),
    asyncHandler((req: Request, res: Response) =>
      adminController.onboardSeller(req, res),
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
    '/admin/audit-logs',
    authMiddleware,
    requireRole('ADMINISTRATOR', 'SUPERVISOR'),
    asyncHandler((req: Request, res: Response) =>
      adminController.consultAuditLogs(req, res),
    ),
  );
  router.get(
    '/admin/dashboard',
    authMiddleware,
    requireRole('ADMINISTRATOR', 'SUPERVISOR'),
    asyncHandler((req: Request, res: Response) =>
      adminController.consultOperationalDashboard(req, res),
    ),
  );

  return router;
}
