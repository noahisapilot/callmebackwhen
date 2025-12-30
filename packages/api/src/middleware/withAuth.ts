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
    // Log all request info for debugging
    logger.info('Request received', {
      method: event.httpMethod,
      path: event.path,
      headerKeys: Object.keys(event.headers),
    });

    const authHeader = event.headers.Authorization || event.headers.authorization;
    logger.info('Auth header received', {
      hasHeader: !!authHeader,
      headerPreview: authHeader ? `${authHeader.substring(0, 40)}...` : 'none',
      authorizationCased: !!event.headers.Authorization,
      authorizationLower: !!event.headers.authorization,
    });

    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw new UnauthorizedError('Missing authorization token');
    }

    try {
      const payload = verifyToken(token);
      const authenticatedEvent = event as AuthenticatedEvent;
      authenticatedEvent.auth = payload;
      logger.appendKeys({ userId: payload.userId });
      return await handler(authenticatedEvent, context);
    } catch (err) {
      logger.error('Token verification failed', {
        error: err instanceof Error ? err.message : String(err),
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
      });
      throw new UnauthorizedError('Invalid or expired token');
    }
  };
}
