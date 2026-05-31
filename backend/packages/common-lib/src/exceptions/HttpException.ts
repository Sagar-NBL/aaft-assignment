/**
 * Base HTTP exception. All custom domain exceptions extend this so the global
 * error-handler middleware can serialize them uniformly into `{ message }` JSON.
 */
export class HttpException extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class BadRequestException extends HttpException {
  constructor(message = 'Bad request', details?: unknown) {
    super(400, message, details);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class NotFoundException extends HttpException {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

export class ConflictException extends HttpException {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}

export class UnprocessableEntityException extends HttpException {
  constructor(message = 'Unprocessable entity', details?: unknown) {
    super(422, message, details);
  }
}

export class InternalServerException extends HttpException {
  constructor(message = 'Internal server error') {
    super(500, message);
  }
}
