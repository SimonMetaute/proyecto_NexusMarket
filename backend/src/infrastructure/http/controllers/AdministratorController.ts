/**
 * Controller: AdministratorController
 * Endpoints de administración (requieren autenticación, rol ADMINISTRATOR).
 */
import type { Request, Response } from 'express';
import type { AdministratorPort } from '../../../domain/ports/in/AdministratorPort.js';
import type { User } from '../../../domain/model/user.js';
import { ApiError } from '../errors/ApiError.js';
import { requireObject, requireString, requireParam } from '../validation/validator.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

function asString(value: string | string[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

export class AdministratorController {
  private readonly administratorService: AdministratorPort;

  constructor(administratorService: AdministratorPort) {
    this.administratorService = administratorService;
  }

  private requireUser(req: Request): User {
    const user = req.user as User;
    if (!user) {
      throw ApiError.authenticationRequired();
    }
    return user;
  }

  async consultUsers(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const users = await this.administratorService.consultUsers(user, {});
    res.status(200).json(users);
  }

  async approveSeller(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const sellerId = requireParam(asString(req.params.sellerId), 'sellerId');
    const seller = {
      sellerId, userId: '', commercialName: '', personType: 'Natural',
      verificationStatus: 'Pending',
    } as any;
    const updated = await this.administratorService.approveSeller(user, seller);
    res.status(200).json({
      sellerId: updated.sellerId,
      verificationStatus: updated.verificationStatus,
    });
  }

  async rejectSeller(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const sellerId = requireParam(asString(req.params.sellerId), 'sellerId');
    const body = requireObject(req.body);
    const seller = {
      sellerId, userId: '', commercialName: '', personType: 'Natural',
      verificationStatus: 'Pending',
    } as any;
    const updated = await this.administratorService.rejectSeller(
      user, seller, requireString(body, 'reason', { maxLength: 500 }),
    );
    res.status(200).json({
      sellerId: updated.sellerId,
      verificationStatus: updated.verificationStatus,
    });
  }

  async consultOperationalDashboard(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const dashboard = await this.administratorService.consultOperationalDashboard(user);
    res.status(200).json(dashboard);
  }
}
