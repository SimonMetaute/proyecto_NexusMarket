/**
 * Controller: AdministratorController
 * Endpoints de administración (requieren autenticación, rol ADMINISTRATOR).
 */
import type { Request, Response } from 'express';
import type {
  AdministratorPort,
  AuditFilterCriteria,
  OnboardSellerParams,
  UserFilterCriteria,
} from '../../../domain/ports/in/AdministratorPort.js';
import type { User } from '../../../domain/model/user.js';
import { resolveUserRole } from '../../../domain/model/user.js';
import { ApiError } from '../errors/ApiError.js';
import {
  requireEmail,
  requireEnum,
  requireObject,
  optionalString,
  requireParam,
  requirePassword,
  requirePositiveInt,
  requireString,
} from '../validation/validator.js';
import { UserMapper } from '../mappers/UserMapper.js';
import { toAuditLogResponse } from '../mappers/AuditLogMapper.js';

function asString(value: string | string[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

function parseDate(value: string | undefined, field: string): Date | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw ApiError.invalidRequest(`'${field}' must be a valid ISO-8601 date.`, { field });
  }
  return parsed;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw ApiError.invalidRequest('Pagination values must be positive integers.');
  }
  return parsed;
}

const USER_ROLES = [
  'BUYER',
  'SELLER',
  'ADMINISTRATOR',
  'SUPERVISOR',
  'LOGISTICS_OPERATOR',
] as const;

const USER_STATUSES = ['Active', 'Inactive', 'Blocked', 'PendingVerification'] as const;

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
    const criteria: UserFilterCriteria = {};
    const role = asString(req.query.role as string | string[] | undefined);
    if (role !== undefined) {
      const normalized = role.toUpperCase();
      if (!(USER_ROLES as readonly string[]).includes(normalized)) {
        throw ApiError.invalidRequest(`Unknown role '${role}'.`, { field: 'role' });
      }
      criteria.role = normalized;
    }
    const status = asString(req.query.status as string | string[] | undefined);
    if (status !== undefined) {
      if (!(USER_STATUSES as readonly string[]).includes(status)) {
        throw ApiError.invalidRequest(`Unknown status '${status}'.`, { field: 'status' });
      }
      criteria.status = status;
    }

    const users = await this.administratorService.consultUsers(user, criteria);
    res.status(200).json(
      users.map((candidate) => ({
        ...UserMapper.toResponse(candidate),
        role: resolveUserRole(candidate.userType),
      })),
    );
  }

  async changeUserStatus(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const userId = requireParam(asString(req.params.id), 'id');
    const body = requireObject(req.body);
    const newStatus = requireEnum(body, 'status', [
      'Active',
      'Inactive',
      'Blocked',
    ] as const);
    const reason = optionalString(body, 'reason', { maxLength: 500 });

    if (userId === user.userId && newStatus !== 'Active') {
      throw ApiError.forbidden('Cannot block or deactivate your own account');
    }

    const target = {
      userId,
      userType: 'BUYER',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      identityDocument: { type: 'Citizenship Card', number: '' },
      registrationDate: new Date(),
      status: 'Active',
      updateDate: new Date(),
    } as any;

    const updated = await this.administratorService.changeUserStatus(
      user,
      target,
      newStatus,
      reason,
    );

    res.status(200).json({
      userId: updated.userId,
      status: updated.status,
    });
  }

  async onboardSeller(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const body = requireObject(req.body);
    const account = requireObject(body.account, 'account');
    const seller = requireObject(body.seller, 'seller');
    const warehouse = requireObject(body.warehouse, 'warehouse');

    const params: OnboardSellerParams = {
      account: {
        firstName: requireString(account, 'firstName', { maxLength: 100 }),
        lastName: requireString(account, 'lastName', { maxLength: 100 }),
        email: requireEmail(account),
        password: requirePassword(account),
        phone: requireString(account, 'phone', { maxLength: 50 }),
        identityDocumentType: requireString(account, 'identityDocumentType', {
          maxLength: 50,
        }),
        identityDocumentNumber: requireString(account, 'identityDocumentNumber', {
          maxLength: 100,
        }),
      },
      seller: {
        commercialName: requireString(seller, 'commercialName', { maxLength: 255 }),
        personType: requireEnum(seller, 'personType', ['Natural', 'Legal'] as const) as
          | 'Natural'
          | 'Legal',
      },
      warehouse: {
        name: requireString(warehouse, 'name', { maxLength: 255 }),
        country: requireString(warehouse, 'country', { maxLength: 100 }),
        department: requireString(warehouse, 'department', { maxLength: 100 }),
        city: requireString(warehouse, 'city', { maxLength: 100 }),
        address: requireString(warehouse, 'address', { maxLength: 255 }),
        postalCode: requireString(warehouse, 'postalCode', { maxLength: 20 }),
        capacity: requirePositiveInt(warehouse, 'capacity'),
      },
    };

    const created = await this.administratorService.onboardSeller(user, params);
    res.status(201).json(created);
  }

  async consultAuditLogs(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const criteria: AuditFilterCriteria = {};
    const actorId = asString(req.query.actorId as string | string[] | undefined);
    if (actorId !== undefined) {
      criteria.actorId = actorId;
    }
    const action = asString(req.query.action as string | string[] | undefined);
    if (action !== undefined) {
      criteria.action = action;
    }
    const from = parseDate(
      asString(req.query.from as string | string[] | undefined),
      'from',
    );
    if (from !== undefined) {
      criteria.from = from;
    }
    const to = parseDate(asString(req.query.to as string | string[] | undefined), 'to');
    if (to !== undefined) {
      criteria.to = to;
    }

    const page = parsePositiveInt(
      asString(req.query.page as string | string[] | undefined),
      1,
    );
    const limit = parsePositiveInt(
      asString(req.query.limit as string | string[] | undefined),
      20,
    );

    const result = await this.administratorService.consultAuditLogs(
      user,
      criteria,
      page,
      limit,
    );
    res.status(200).json({
      items: result.items.map(toAuditLogResponse),
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  }

  async approveSeller(req: Request, res: Response): Promise<void> {
    const user = this.requireUser(req);
    const sellerId = requireParam(asString(req.params.sellerId), 'sellerId');
    const seller = {
      sellerId,
      userId: '',
      commercialName: '',
      personType: 'Natural',
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
      sellerId,
      userId: '',
      commercialName: '',
      personType: 'Natural',
      verificationStatus: 'Pending',
    } as any;
    const updated = await this.administratorService.rejectSeller(
      user,
      seller,
      requireString(body, 'reason', { maxLength: 500 }),
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
