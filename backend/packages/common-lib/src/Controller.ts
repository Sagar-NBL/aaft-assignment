import { Response } from 'express';

/**
 * Base controller. Provides uniform response helpers so every service produces
 * the exact JSON shape the frontend contract demands:
 *   - Success: raw JSON body (no { data: ... } wrapping)
 *   - Paginated: { items, meta: { page, limit, totalItems, totalPages } }
 *   - Error: { message: string } + appropriate HTTP status (handled by errorHandler middleware)
 *
 * Subclasses should construct their domain services in the constructor and
 * keep handler methods thin — delegate to services.
 */
export interface PaginatedMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedBody<T> {
  items: T[];
  meta: PaginatedMeta;
}

export class Controller {
  /** Send a JSON response. Defaults to 200. */
  protected ok<T>(res: Response, body: T, status = 200): void {
    res.status(status).json(body);
  }

  protected created<T>(res: Response, body: T): void {
    res.status(201).json(body);
  }

  protected noContent(res: Response): void {
    res.status(204).end();
  }

  protected paginated<T>(res: Response, body: PaginatedBody<T>, status = 200): void {
    res.status(status).json(body);
  }

  /**
   * For simple "success" replies where the frontend only checks status, return
   * `{ success: true }`. Used by enrollment bulk endpoints, delete endpoints, etc.
   */
  protected success(res: Response, extra: Record<string, unknown> = {}): void {
    res.status(200).json({ success: true, ...extra });
  }
}
