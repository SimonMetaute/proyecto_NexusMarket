/**
 * Controller: SupervisorController
 * Endpoints de supervisión (requieren autenticación, rol SUPERVISOR).
 */
import type { Request, Response } from 'express';
import type { SupervisorPort } from '../../../domain/ports/in/SupervisorPort.js';
import type { User } from '../../../domain/model/user.js';
import { ApiError } from '../errors/ApiError.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export class SupervisorController {
  private readonly supervisorService: SupervisorPort;

  constructor(supervisorService: SupervisorPort) {
    this.supervisorService = supervisorService;
  }

  private requireUser(req: Request): User {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    return user;
  }

  async consultOperationalDashboard(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const dashboard = await this.supervisorService.consultOperationalDashboard(user);
    res.status(200).json(dashboard);
  }

  async consultMarketplaceHealth(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const health = await this.supervisorService.consultMarketplaceHealth(user);
    res.status(200).json(health);
  }
}
