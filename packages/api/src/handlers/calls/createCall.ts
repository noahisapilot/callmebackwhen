import type { APIGatewayProxyResult, Context } from 'aws-lambda';
import { getDataSource, Call, CallEvent } from '@callmebackwhen/db';
import { createCallSchema } from '@callmebackwhen/shared';
import { withErrorHandling } from '../../middleware/withErrorHandling.js';
import { withAuth, type AuthenticatedEvent } from '../../middleware/withAuth.js';
import { success, corsPreflightResponse } from '../../lib/response.js';
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';
import { createVapiCall } from '../../lib/vapi.js';
import { toCallPublic } from '../../lib/callHelpers.js';

async function handler(
  event: AuthenticatedEvent,
  _context: Context
): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') {
    return corsPreflightResponse();
  }

  const { userId } = event.auth;
  const body = JSON.parse(event.body ?? '{}');
  const { targetPhoneNumber, prompt } = createCallSchema.parse(body);

  logger.info('Create call request', {
    userId,
    targetPhoneNumber: targetPhoneNumber.slice(-4),
  });

  const dataSource = await getDataSource();
  const callRepo = dataSource.getRepository(Call);
  const eventRepo = dataSource.getRepository(CallEvent);

  // Check if user already has an active call
  const activeStatuses = ['pending', 'dialing', 'in_ivr', 'on_hold', 'with_rep', 'transferring'];
  const existingActiveCall = await callRepo
    .createQueryBuilder('call')
    .where('call.userId = :userId', { userId })
    .andWhere('call.status IN (:...statuses)', { statuses: activeStatuses })
    .getOne();

  if (existingActiveCall) {
    throw new AppError(
      'ACTIVE_CALL_EXISTS',
      'You already have an active call. Please wait for it to complete or cancel it.',
      409
    );
  }

  // Get required environment variables
  const webhookUrl = process.env.VAPI_WEBHOOK_URL;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

  if (!webhookUrl) {
    logger.error('VAPI_WEBHOOK_URL not configured');
    throw new AppError('SERVICE_UNAVAILABLE', 'Call service is not properly configured', 503);
  }

  if (!phoneNumberId) {
    logger.error('VAPI_PHONE_NUMBER_ID not configured');
    throw new AppError('SERVICE_UNAVAILABLE', 'Call service is not properly configured', 503);
  }

  // Create the call record in pending state
  const call = callRepo.create({
    userId,
    targetPhoneNumber,
    userPrompt: prompt,
    status: 'pending',
    callbackRequested: false,
  });
  await callRepo.save(call);

  logger.info('Call record created', { callId: call.id });

  try {
    // Initiate the Vapi call
    const vapiResult = await createVapiCall({
      targetPhoneNumber,
      userPrompt: prompt,
      webhookUrl,
      phoneNumberId,
    });

    // Update call with Vapi call ID
    call.vapiCallId = vapiResult.vapiCallId;
    call.status = 'dialing';
    call.startedAt = new Date();
    await callRepo.save(call);

    // Create initial call event
    const callEvent = eventRepo.create({
      callId: call.id,
      eventType: 'call_started',
      eventData: {
        vapiCallId: vapiResult.vapiCallId,
        targetPhoneNumber: targetPhoneNumber.slice(-4), // Only log last 4 digits
      },
    });
    await eventRepo.save(callEvent);

    logger.info('Vapi call initiated', {
      callId: call.id,
      vapiCallId: vapiResult.vapiCallId,
    });

    return success({ call: toCallPublic(call) }, 201);
  } catch (error) {
    // If Vapi call fails, mark the call as failed
    call.status = 'failed';
    call.outcome = 'failed';
    call.outcomeSummary = error instanceof Error ? error.message : 'Failed to initiate call';
    call.endedAt = new Date();
    await callRepo.save(call);

    logger.error('Failed to initiate Vapi call', {
      callId: call.id,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new AppError('CALL_INITIATION_FAILED', 'Failed to start the call. Please try again.', 500);
  }
}

export const main = withErrorHandling(withAuth(handler));
