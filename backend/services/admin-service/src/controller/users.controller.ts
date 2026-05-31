import { Request, Response, NextFunction } from 'express';
import { Controller } from '@aaft/common-lib';
import { UsersService } from '../service/users.service';
import type { ListUsersQueryDto, CreateUserDto, UpdateUserDto } from '../validator/users.dto';

export class UsersController extends Controller {
  constructor(private readonly users: UsersService) {
    super();
  }

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.query as unknown as ListUsersQueryDto;
      const result = await this.users.listUsers(q);
      this.paginated(res, result);
    } catch (e) {
      next(e);
    }
  };

  getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await this.users.getUser(req.params.id);
      this.ok(res, dto);
    } catch (e) {
      next(e);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await this.users.createUser(req.body as CreateUserDto);
      this.created(res, dto);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await this.users.updateUser(req.params.id, req.body as UpdateUserDto);
      this.ok(res, dto);
    } catch (e) {
      next(e);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.users.softDeleteUser(req.params.id);
      this.success(res);
    } catch (e) {
      next(e);
    }
  };
}
