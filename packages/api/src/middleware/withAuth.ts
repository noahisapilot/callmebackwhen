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
    const authHeader = event.headers.Authorization || event.headers.authorization;

    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw new UnauthorizedError('Missing authorization token');
    }

    // Only wrap token verification in try-catch, not the handler
    let payload: AuthTokenPayload;
    try {
      payload = verifyToken(token);
    } catch (err) {
      logger.error('Token verification failed', {
        error: err instanceof Error ? err.message : String(err),
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
      });
      throw new UnauthorizedError('Invalid or expired token');
    }

    const authenticatedEvent = event as AuthenticatedEvent;
    authenticatedEvent.auth = payload;
    logger.appendKeys({ userId: payload.userId });

    // Let handler errors propagate to withErrorHandling
    return await handler(authenticatedEvent, context);
  };
}
