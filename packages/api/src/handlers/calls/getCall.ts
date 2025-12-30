import type { APIGatewayProxyResult, Context } from 'aws-lambda';
import { getDataSource, Call, CallEvent } from '@callmebackwhen/db';
import { callIdParamSchema } from '@callmebackwhen/shared';
import { withErrorHandling } from '../../middleware/withErrorHandling.js';
import { withAuth, type AuthenticatedEvent } from '../../middleware/withAuth.js';
import { success, corsPreflightResponse } from '../../lib/response.js';
import { NotFoundError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';
import { toCallPublic, toCallEventPublic } from '../../lib/callHelpers.js';

async function handler(
  event: AuthenticatedEvent,
  _context: Context
): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') {
    return corsPreflightResponse();
  }

  const { userId } = event.auth;
  const { id: callId } = callIdParamSchema.parse(event.pathParameters);

  logger.info('Get call request', { userId, callId });

  const dataSource = await getDataSource();
  const callRepo = dataSource.getRepository(Call);
  const eventRepo = dataSource.getRepository(CallEvent);

  const call = await callRepo.findOne({
    where: { id: callId, userId },
  });

  if (!call) {
    throw new NotFoundError('Call');
  }

  const events = await eventRepo.find({
    where: { callId },
    order: { createdAt: 'ASC' },
  });

  return success({
    call: toCallPublic(call),
    events: events.map(toCallEventPublic),
  });
}

export const main = withErrorHandling(withAuth(handler));
