import type { Request, Response } from 'express';
import type {
  CreateUserParams,
  CreateUserUseCase,
} from '../../../application/use-cases/CreateUserUseCase.js';
import { UserType } from '../../../domain/model/user.js';
import { UserMapper } from '../mappers/UserMapper.js';
import {
  optionalString,
  requireEmail,
  requireEnum,
  requireObject,
  requirePassword,
  requireString,
} from '../validation/validator.js';

const USER_TYPES = Object.values(UserType);

export class UserController {
  private readonly createUserUseCase: CreateUserUseCase;

  constructor(createUserUseCase: CreateUserUseCase) {
    this.createUserUseCase = createUserUseCase;
  }

  async createUser(req: Request, res: Response): Promise<void> {
    const body = requireObject(req.body);

    // Legacy clients may send `phoneNumber` instead of `phone`.
    const data: Record<string, unknown> = { ...body };
    if (data.phone === undefined && data.phoneNumber !== undefined) {
      data.phone = data.phoneNumber;
    }

    const params: CreateUserParams = {
      userType: requireEnum(data, 'userType', USER_TYPES),
      firstName: requireString(data, 'firstName', { maxLength: 100 }),
      lastName: requireString(data, 'lastName', { maxLength: 100 }),
      email: requireEmail(data),
      password: requirePassword(data),
      phone: requireString(data, 'phone', { minLength: 5, maxLength: 50 }),
      identityDocumentType: requireString(data, 'identityDocumentType', { maxLength: 50 }),
      identityDocumentNumber: requireString(data, 'identityDocumentNumber', { maxLength: 100 }),
    };

    const status = optionalString(data, 'status', { maxLength: 50 });
    if (status !== undefined) {
      params.status = status;
    }

    const user = await this.createUserUseCase.execute(params);
    res.status(201).location(`/api/v1/users/${user.userId}`).json(UserMapper.toResponse(user));
  }
}
