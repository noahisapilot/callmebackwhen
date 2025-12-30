import type { APIGatewayProxyResult, Context } from 'aws-lambda';
import { getDataSource, Call, CallEvent } from '@callmebackwhen/db';
import { callIdParamSchema } from '@callmebackwhen/shared';
import { withErrorHandling } from '../../middleware/withErrorHandling.js';
import { withAuth, type AuthenticatedEvent } from '../../middleware/withAuth.js';
import { success, corsPreflightResponse } from '../../lib/response.js';
import { NotFoundError, AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';
import { cancelVapiCall } from '../../lib/vapi.js';
import { isCallActive } from '../../lib/callHelpers.js';

async function handler(
  event: AuthenticatedEvent,
  _context: Context
): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') {
    return corsPreflightResponse();
  }

  const { userId } = event.auth;
  const { id: callId } = callIdParamSchema.parse(event.pathParameters);

  logger.info('Cancel call request', { userId, callId });

  const dataSource = await getDataSource();
  const callRepo = dataSource.getRepository(Call);
  const eventRepo = dataSource.getRepository(CallEvent);

  const call = await callRepo.findOne({
    where: { id: callId, userId },
  });

  if (!call) {
    throw new NotFoundError('Call');
  }

  if (!isCallActive(call.status)) {
    throw new AppError(
      'CALL_NOT_ACTIVE',
      'This call is no longer active and cannot be cancelled',
      400
    );
  }

  try {
    // Cancel the Vapi call if it has a Vapi call ID
    if (call.vapiCallId) {
      await cancelVapiCall(call.vapiCallId);
    }

    // Update call status
    call.status = 'completed';
    call.outcome = 'cancelled';
    call.outcomeSummary = 'Call cancelled by user';
    call.endedAt = new Date();

    if (call.startedAt) {
      call.durationSeconds = Math.floor(
        (call.endedAt.getTime() - call.startedAt.getTime()) / 1000
      );
    }

    await callRepo.save(call);

    // Create cancellation event
    const cancelEvent = eventRepo.create({
      callId: call.id,
      eventType: 'error',
      eventData: {
        reason: 'cancelled_by_user',
        message: 'Call cancelled by user',
      },
    });
    await eventRepo.save(cancelEvent);

    logger.info('Call cancelled successfully', { callId });

    return success({ success: true });
  } catch (error) {
    logger.error('Failed to cancel call', {
      callId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new AppError('CANCEL_FAILED', 'Failed to cancel the call. Please try again.', 500);
  }
}

export const main = withErrorHandling(withAuth(handler));
