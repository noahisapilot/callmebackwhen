import type { APIGatewayProxyResult, Context } from 'aws-lambda';
import { getDataSource, Call } from '@callmebackwhen/db';
import { listCallsQuerySchema } from '@callmebackwhen/shared';
import { withErrorHandling } from '../../middleware/withErrorHandling.js';
import { withAuth, type AuthenticatedEvent } from '../../middleware/withAuth.js';
import { success, corsPreflightResponse } from '../../lib/response.js';
import { logger } from '../../lib/logger.js';
import { toCallPublic } from '../../lib/callHelpers.js';

async function handler(
  event: AuthenticatedEvent,
  _context: Context
): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') {
    return corsPreflightResponse();
  }

  const { userId } = event.auth;
  const query = listCallsQuerySchema.parse(event.queryStringParameters ?? {});
  const { page, limit } = query;

  logger.info('List calls request', { userId, page, limit });

  const dataSource = await getDataSource();
  const callRepo = dataSource.getRepository(Call);

  const [calls, total] = await callRepo.findAndCount({
    where: { userId },
    order: { createdAt: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });

  const totalPages = Math.ceil(total / limit);

  return success({
    calls: calls.map(toCallPublic),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
}

export const main = withErrorHandling(withAuth(handler));
