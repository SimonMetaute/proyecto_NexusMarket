import type { Request, Response } from 'express';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import { UserController } from '../controllers/UserController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { requireRole } from '../middlewares/requireRole.js';

/**
 * Legacy user-administration endpoint. Account onboarding for sellers and
 * employee accounts is an ADMINISTRATOR-only capability
 * (SDD/enunciado.md §7.3), so the route is protected accordingly.
 */
export function createUserRoutes(
  userController: UserController,
  authMiddleware: RequestHandler,
): Router {
  const router = Router();

  router.post(
    '/users',
    authMiddleware,
    requireRole('ADMINISTRATOR'),
    asyncHandler((req: Request, res: Response) => userController.createUser(req, res)),
  );

  return router;
}
