import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';
import { error } from '../lib/response.js';
import { logger } from '../lib/logger.js';

type Handler = (
  event: APIGatewayProxyEvent,
  context: Context
) => Promise<APIGatewayProxyResult>;

export function withErrorHandling(handler: Handler): Handler {
  return async (event, context) => {
    try {
      return await handler(event, context);
    } catch (err) {
      if (err instanceof AppError) {
        logger.warn('Application error', {
          code: err.code,
          message: err.message,
          statusCode: err.statusCode,
        });
        return error(err.code, err.message, err.statusCode);
      }

      if (err instanceof ZodError) {
        const message = err.errors.map((e) => e.message).join(', ');
        logger.warn('Validation error', { errors: err.errors });
        return error('VALIDATION_ERROR', message, 400);
      }

      logger.error('Unexpected error', { error: err });
      return error('INTERNAL_ERROR', 'An unexpected error occurred', 500);
    }
  };
}
