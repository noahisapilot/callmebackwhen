import type { APIGatewayProxyResult, Context } from 'aws-lambda';
import { getDataSource, Call, CallEvent } from '@callmebackwhen/db';
import { In } from 'typeorm';
import { withErrorHandling } from '../../middleware/withErrorHandling.js';
import { withAuth, type AuthenticatedEvent } from '../../middleware/withAuth.js';
import { success, corsPreflightResponse } from '../../lib/response.js';
import { logger } from '../../lib/logger.js';
import { toCallPublic, toCallEventPublic } from '../../lib/callHelpers.js';

const ACTIVE_STATUSES = ['pending', 'dialing', 'in_ivr', 'on_hold', 'with_rep', 'transferring'];

async function handler(
  event: AuthenticatedEvent,
  _context: Context
): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') {
    return corsPreflightResponse();
  }

  const { userId } = event.auth;

  logger.info('Get active call request', { userId });

  const dataSource = await getDataSource();
  const callRepo = dataSource.getRepository(Call);
  const eventRepo = dataSource.getRepository(CallEvent);

  // Find the most recent active call
  const activeCall = await callRepo.findOne({
    where: {
      userId,
      status: In(ACTIVE_STATUSES),
    },
    order: { createdAt: 'DESC' },
  });

  if (!activeCall) {
    return success({
      call: null,
      events: [],
    });
  }

  const events = await eventRepo.find({
    where: { callId: activeCall.id },
    order: { createdAt: 'ASC' },
  });

  return success({
    call: toCallPublic(activeCall),
    events: events.map(toCallEventPublic),
  });
}

export const main = withErrorHandling(withAuth(handler));
