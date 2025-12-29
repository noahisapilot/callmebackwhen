import type { APIGatewayProxyResult, Context } from 'aws-lambda';
import { getDataSource, User } from '@callmebackwhen/db';
import { withErrorHandling } from '../../middleware/withErrorHandling.js';
import { withAuth, type AuthenticatedEvent } from '../../middleware/withAuth.js';
import { success, corsPreflightResponse } from '../../lib/response.js';
import { NotFoundError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

async function handler(
  event: AuthenticatedEvent,
  _context: Context
): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') {
    return corsPreflightResponse();
  }

  const { userId } = event.auth;

  logger.info('Get current user request', { userId });

  const dataSource = await getDataSource();
  const userRepo = dataSource.getRepository(User);

  const user = await userRepo.findOne({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError('User');
  }

  return success({
    user: {
      id: user.id,
      phoneNumber: user.phoneNumber,
      phoneVerified: user.phoneVerified,
      balanceCents: user.balanceCents,
    },
  });
}

export const main = withErrorHandling(withAuth(handler));
