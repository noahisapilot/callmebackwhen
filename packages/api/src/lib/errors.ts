import type { ErrorCode } from '@callmebackwhen/shared';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('USER_NOT_FOUND', `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
    this.name = 'ValidationError';
  }
}
