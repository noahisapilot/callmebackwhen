import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { withErrorHandling } from '../../middleware/withErrorHandling.js';
import { success, corsPreflightResponse } from '../../lib/response.js';
import { logger } from '../../lib/logger.js';

async function handler(
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') {
    return corsPreflightResponse();
  }

  // JWT is stateless, so logout is handled client-side by removing the token
  // This endpoint exists for API completeness and potential future token blacklisting
  logger.info('Logout request');

  return success({ success: true });
}

export const main = withErrorHandling(handler);
