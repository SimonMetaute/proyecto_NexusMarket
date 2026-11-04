import type { Request, Response } from 'express';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { AuthController } from '../controllers/AuthController.js';

export function createAuthRoutes(
  authController: AuthController,
  authMiddleware: RequestHandler,
): Router {
  const router = Router();

  // Public (SDD/Adapters/Api-rest-endpoints.md §2).
  router.post('/auth/login', asyncHandler((req: Request, res: Response) => authController.login(req, res)));
  router.post('/auth/register/buyer', asyncHandler((req: Request, res: Response) => authController.registerBuyer(req, res)));

  // Requires a valid token; any role.
  router.post(
    '/auth/logout',
    authMiddleware,
    asyncHandler((req: Request, res: Response) => authController.logout(req, res)),
  );

  return router;
}
