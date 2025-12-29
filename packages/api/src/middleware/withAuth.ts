import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { extractTokenFromHeader, verifyToken } from '../lib/jwt.js';
import { UnauthorizedError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import type { AuthTokenPayload } from '@callmebackwhen/shared';

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  auth: AuthTokenPayload;
}

type AuthenticatedHandler = (
  event: AuthenticatedEvent,
  context: Context
) => Promise<APIGatewayProxyResult>;

type Handler = (
  event: APIGatewayProxyEvent,
  context: Context
) => Promise<APIGatewayProxyResult>;

export function withAuth(handler: AuthenticatedHandler): Handler {
  return async (event, context) => {
    const token = extractTokenFromHeader(event.headers.Authorization || event.headers.authorization);

    if (!token) {
      throw new UnauthorizedError('Missing authorization token');
    }

    try {
      const payload = verifyToken(token);
      const authenticatedEvent = event as AuthenticatedEvent;
      authenticatedEvent.auth = payload;
      logger.appendKeys({ userId: payload.userId });
      return await handler(authenticatedEvent, context);
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  };
}
