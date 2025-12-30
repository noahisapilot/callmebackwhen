import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getDataSource, Call, CallEvent } from '@callmebackwhen/db';
import { verifyToken, extractTokenFromHeader } from '../../lib/jwt.js';
import { logger } from '../../lib/logger.js';
import { isCallActive, toCallEventPublic } from '../../lib/callHelpers.js';
import type { CallStreamEvent, CallStatus } from '@callmebackwhen/shared';

/**
 * Format an SSE event
 */
function formatSSE(event: CallStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Handle SSE streaming for call updates
 * This handler returns current call state - for real-time updates,
 * the frontend should poll this endpoint or use the full streaming implementation
 */
export async function main(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  // Extract call ID from query parameters
  const callId = event.queryStringParameters?.callId;
  if (!callId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { code: 'MISSING_CALL_ID', message: 'Call ID is required' } }),
    };
  }

  // Extract and verify auth token
  const authHeader = event.headers?.authorization || event.headers?.Authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Missing authorization token' } }),
    };
  }

  let userId: string;
  try {
    const payload = verifyToken(token);
    userId = payload.userId;
  } catch {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } }),
    };
  }

  logger.info('SSE stream request', { userId, callId });

  const dataSource = await getDataSource();
  const callRepo = dataSource.getRepository(Call);
  const eventRepo = dataSource.getRepository(CallEvent);

  // Verify call belongs to user
  const call = await callRepo.findOne({
    where: { id: callId, userId },
  });

  if (!call) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Call not found' } }),
    };
  }

  // Get events
  const events = await eventRepo.find({
    where: { callId },
    order: { createdAt: 'ASC' },
  });

  // Build SSE response body
  let body = '';

  // Send initial call state
  const initialEvent: CallStreamEvent = {
    type: 'status_update',
    data: {
      callId: call.id,
      status: call.status as CallStatus,
      timestamp: new Date().toISOString(),
    },
  };
  body += formatSSE(initialEvent);

  // Send existing events
  for (const evt of events) {
    const eventData: CallStreamEvent = {
      type: 'event',
      data: {
        callId: call.id,
        event: toCallEventPublic(evt),
        timestamp: evt.createdAt.toISOString(),
      },
    };
    body += formatSSE(eventData);
  }

  // Send final status if call is not active
  if (!isCallActive(call.status)) {
    const finalEvent: CallStreamEvent = {
      type: 'status_update',
      data: {
        callId: call.id,
        status: call.status as CallStatus,
        timestamp: new Date().toISOString(),
      },
    };
    body += formatSSE(finalEvent);
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body,
  };
}
