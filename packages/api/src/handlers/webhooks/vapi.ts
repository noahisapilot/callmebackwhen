import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { getDataSource, Call, CallEvent } from '@callmebackwhen/db';
import { withErrorHandling } from '../../middleware/withErrorHandling.js';
import { success, corsPreflightResponse } from '../../lib/response.js';
import { logger } from '../../lib/logger.js';
import { getVapiWebhookSecret } from '../../lib/secrets.js';
import { createHmac } from 'crypto';
import type { CallStatus, CallEventType, VapiFunctionName } from '@callmebackwhen/shared';

// Vapi webhook event types
interface VapiWebhookEvent {
  type: string;
  call?: {
    id: string;
    status?: string;
    endedReason?: string;
    recordingUrl?: string;
    transcript?: string;
    duration?: number;
  };
  functionCall?: {
    name: string;
    parameters: Record<string, unknown>;
  };
  transcript?: {
    text: string;
    role: 'assistant' | 'user';
  };
  message?: {
    role: string;
    content: string;
  };
}

/**
 * Verify Vapi webhook signature
 */
async function verifyWebhookSignature(
  payload: string,
  signature: string | undefined
): Promise<boolean> {
  if (!signature) {
    logger.warn('Missing webhook signature');
    return false;
  }

  try {
    const secret = await getVapiWebhookSecret();
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  } catch (error) {
    logger.error('Failed to verify webhook signature', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Map Vapi status to our CallStatus
 */
function mapVapiStatus(vapiStatus: string | undefined): CallStatus | null {
  const statusMap: Record<string, CallStatus> = {
    queued: 'pending',
    ringing: 'dialing',
    'in-progress': 'with_rep',
    forwarding: 'transferring',
    ended: 'completed',
    busy: 'failed',
    failed: 'failed',
    'no-answer': 'failed',
  };

  return vapiStatus ? statusMap[vapiStatus] ?? null : null;
}

/**
 * Map Vapi function call to CallEventType
 */
function mapFunctionToEventType(functionName: VapiFunctionName): CallEventType {
  const eventMap: Record<VapiFunctionName, CallEventType> = {
    REQUEST_INFO: 'info_requested',
    TRANSFER: 'transfer_initiated',
    REPORT_CALLBACK: 'callback_accepted',
    REPORT_WAIT_TIME: 'hold_started',
    MARK_RESOLVED: 'resolved',
  };

  return eventMap[functionName] ?? 'speech_update';
}

async function handler(
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') {
    return corsPreflightResponse();
  }

  const payload = event.body ?? '';
  const signature = event.headers['x-vapi-signature'] || event.headers['X-Vapi-Signature'];

  // Verify signature (skip in development if secret not set)
  const webhookSecretName = process.env.VAPI_WEBHOOK_SECRET_NAME;
  if (webhookSecretName) {
    const isValid = await verifyWebhookSignature(payload, signature);
    if (!isValid) {
      logger.warn('Invalid webhook signature');
      return success({ received: true }); // Return 200 to prevent retries
    }
  }

  const webhookEvent: VapiWebhookEvent = JSON.parse(payload);

  logger.info('Received Vapi webhook', {
    type: webhookEvent.type,
    callId: webhookEvent.call?.id,
  });

  const vapiCallId = webhookEvent.call?.id;
  if (!vapiCallId) {
    logger.warn('Webhook missing call ID');
    return success({ received: true });
  }

  const dataSource = await getDataSource();
  const callRepo = dataSource.getRepository(Call);
  const eventRepo = dataSource.getRepository(CallEvent);

  // Find our call record by Vapi call ID
  const call = await callRepo.findOne({
    where: { vapiCallId },
  });

  if (!call) {
    logger.warn('Call not found for Vapi call ID', { vapiCallId });
    return success({ received: true });
  }

  // Handle different webhook event types
  switch (webhookEvent.type) {
    case 'call-started':
      call.status = 'dialing';
      call.startedAt = call.startedAt ?? new Date();
      await callRepo.save(call);

      await eventRepo.save(
        eventRepo.create({
          callId: call.id,
          eventType: 'call_started',
          eventData: { vapiCallId },
        })
      );
      break;

    case 'status-update':
      const newStatus = mapVapiStatus(webhookEvent.call?.status);
      if (newStatus && newStatus !== call.status) {
        const previousStatus = call.status;
        call.status = newStatus;

        // Track when we connect with a representative
        if (newStatus === 'with_rep' && !call.connectedAt) {
          call.connectedAt = new Date();

          await eventRepo.save(
            eventRepo.create({
              callId: call.id,
              eventType: 'rep_available',
              eventData: { previousStatus },
            })
          );
        }

        await callRepo.save(call);
      }
      break;

    case 'speech-update':
      if (webhookEvent.transcript) {
        await eventRepo.save(
          eventRepo.create({
            callId: call.id,
            eventType: 'speech_update',
            eventData: {
              text: webhookEvent.transcript.text,
              role: webhookEvent.transcript.role,
            },
          })
        );
      }
      break;

    case 'function-call':
      if (webhookEvent.functionCall) {
        const functionName = webhookEvent.functionCall.name as VapiFunctionName;
        const params = webhookEvent.functionCall.parameters;

        const eventType = mapFunctionToEventType(functionName);

        await eventRepo.save(
          eventRepo.create({
            callId: call.id,
            eventType,
            eventData: {
              functionName,
              parameters: params,
            },
          })
        );

        // Handle specific function calls
        switch (functionName) {
          case 'REPORT_WAIT_TIME':
            call.expectedWaitMinutes = params.minutes as number;
            await callRepo.save(call);
            break;

          case 'REPORT_CALLBACK':
            call.callbackRequested = true;
            call.expectedWaitMinutes = params.expectedMinutes as number;
            await callRepo.save(call);
            break;

          case 'MARK_RESOLVED':
            call.outcome = 'resolved_auto';
            call.outcomeSummary = params.summary as string;
            await callRepo.save(call);
            break;

          case 'TRANSFER':
            call.status = 'transferring';
            await callRepo.save(call);
            break;
        }
      }
      break;

    case 'call-ended':
      call.status = 'completed';
      call.endedAt = new Date();

      if (webhookEvent.call?.duration) {
        call.durationSeconds = Math.floor(webhookEvent.call.duration);
      } else if (call.startedAt) {
        call.durationSeconds = Math.floor(
          (call.endedAt.getTime() - call.startedAt.getTime()) / 1000
        );
      }

      if (webhookEvent.call?.recordingUrl) {
        call.recordingUrl = webhookEvent.call.recordingUrl;
      }

      // Calculate hold duration if we tracked when hold started and rep connected
      if (call.startedAt && call.connectedAt) {
        call.holdDurationSeconds = Math.floor(
          (call.connectedAt.getTime() - call.startedAt.getTime()) / 1000
        );
      }

      // Set outcome if not already set
      if (!call.outcome) {
        const endReason = webhookEvent.call?.endedReason;
        if (endReason === 'customer-ended-call' || endReason === 'assistant-ended-call') {
          call.outcome = call.connectedAt ? 'resolved_transfer' : 'failed';
        } else {
          call.outcome = 'failed';
        }
      }

      // TODO: Calculate cost based on duration (Phase 3)
      // call.costCents = Math.ceil((call.durationSeconds ?? 0) / 60) * 5;

      await callRepo.save(call);

      await eventRepo.save(
        eventRepo.create({
          callId: call.id,
          eventType: 'resolved',
          eventData: {
            endReason: webhookEvent.call?.endedReason,
            duration: call.durationSeconds,
            outcome: call.outcome,
          },
        })
      );
      break;

    case 'hang':
    case 'error':
      call.status = 'failed';
      call.outcome = 'failed';
      call.endedAt = new Date();

      if (call.startedAt) {
        call.durationSeconds = Math.floor(
          (call.endedAt.getTime() - call.startedAt.getTime()) / 1000
        );
      }

      await callRepo.save(call);

      await eventRepo.save(
        eventRepo.create({
          callId: call.id,
          eventType: 'error',
          eventData: {
            type: webhookEvent.type,
            reason: webhookEvent.call?.endedReason,
          },
        })
      );
      break;

    default:
      logger.debug('Unhandled webhook event type', { type: webhookEvent.type });
  }

  return success({ received: true });
}

export const main = withErrorHandling(handler);
