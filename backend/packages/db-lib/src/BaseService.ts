/**
 * BaseService<T> — Generic CRUD operations shared across all domain services.
 *
 * Each domain service (e.g. UsersService, CoursesService) extends this class
 * and provides the Prisma model delegate via the `model` getter. This is the
 * single source of truth for create / find / update / delete / paginate logic,
 * keeping every domain service DRY and focused only on business rules.
 *
 * Single Responsibility: this class owns persistence; domain services own
 * business logic; controllers own HTTP shape.
 */

export interface PaginateParams<TWhere = unknown, TOrderBy = unknown, TInclude = unknown> {
  page?: number;
  limit?: number;
  where?: TWhere;
  orderBy?: TOrderBy;
  include?: TInclude;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginatedMeta;
}

/**
 * Minimal interface a Prisma model delegate must satisfy to be used with BaseService.
 * Using `any` for params here is intentional — Prisma's generated types are model-specific
 * and a strict union would lose autocompletion in subclasses.
 */
export interface PrismaModelDelegate {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(args: { data: any; include?: any; select?: any }): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findMany(args?: any): Promise<any[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findUnique(args: { where: any; include?: any; select?: any }): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findFirst(args?: any): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(args: { where: any; data: any; include?: any; select?: any }): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete(args: { where: any }): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  count(args?: { where?: any }): Promise<number>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  upsert(args: { where: any; create: any; update: any }): Promise<any>;
}

export abstract class BaseService<
  TEntity,
  TCreateInput = unknown,
  TUpdateInput = unknown,
  TWhereUniqueInput = { id: string },
  TWhereInput = unknown,
  TOrderByInput = unknown,
  TIncludeInput = unknown,
> {
  /** Subclass provides the Prisma model delegate (e.g. `prisma.user`). */
  protected abstract get model(): PrismaModelDelegate;

  /** Subclass exposes a human-readable name for logging / error messages. */
  protected abstract get entityName(): string;

  // -------------------------------------------------------------------
  // CRUD
  // -------------------------------------------------------------------

  async create(data: TCreateInput, include?: TIncludeInput): Promise<TEntity> {
    return this.model.create({ data, include }) as Promise<TEntity>;
  }

  async findById(id: string, include?: TIncludeInput): Promise<TEntity | null> {
    return this.model.findUnique({ where: { id }, include }) as Promise<TEntity | null>;
  }

  async findUnique(where: TWhereUniqueInput, include?: TIncludeInput): Promise<TEntity | null> {
    return this.model.findUnique({ where, include }) as Promise<TEntity | null>;
  }

  async findFirst(
    where?: TWhereInput,
    orderBy?: TOrderByInput,
    include?: TIncludeInput,
  ): Promise<TEntity | null> {
    return this.model.findFirst({ where, orderBy, include }) as Promise<TEntity | null>;
  }

  async findAll(
    where?: TWhereInput,
    orderBy?: TOrderByInput,
    include?: TIncludeInput,
  ): Promise<TEntity[]> {
    return this.model.findMany({ where, orderBy, include }) as Promise<TEntity[]>;
  }

  async update(id: string, data: TUpdateInput, include?: TIncludeInput): Promise<TEntity> {
    return this.model.update({ where: { id }, data, include }) as Promise<TEntity>;
  }

  async delete(id: string): Promise<TEntity> {
    return this.model.delete({ where: { id } }) as Promise<TEntity>;
  }

  /**
   * Soft delete — only valid for models that have an `isActive` boolean field
   * (e.g. User, Enrollment). For models without it, override this method or use `delete()`.
   */
  async softDelete(id: string): Promise<TEntity> {
    return this.model.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { isActive: false } as any,
    }) as Promise<TEntity>;
  }

  async count(where?: TWhereInput): Promise<number> {
    return this.model.count({ where });
  }

  // -------------------------------------------------------------------
  // PAGINATION
  // -------------------------------------------------------------------

  async paginate(
    params: PaginateParams<TWhereInput, TOrderByInput, TIncludeInput> = {},
  ): Promise<PaginatedResult<TEntity>> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, Math.min(100, params.limit ?? 10));
    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      this.model.findMany({
        where: params.where,
        orderBy: params.orderBy,
        include: params.include,
        skip,
        take: limit,
      }) as Promise<TEntity[]>,
      this.model.count({ where: params.where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      },
    };
  }
}
