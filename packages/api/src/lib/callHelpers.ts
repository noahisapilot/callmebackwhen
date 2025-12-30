import type { CallPublic, CallEventPublic } from '@callmebackwhen/shared';
import type { Call, CallEvent } from '@callmebackwhen/db';

/**
 * Convert a Call entity to a public API response
 */
export function toCallPublic(call: Call): CallPublic {
  return {
    id: call.id,
    targetPhoneNumber: call.targetPhoneNumber,
    userPrompt: call.userPrompt,
    status: call.status,
    startedAt: call.startedAt?.toISOString(),
    connectedAt: call.connectedAt?.toISOString(),
    endedAt: call.endedAt?.toISOString(),
    durationSeconds: call.durationSeconds ?? undefined,
    holdDurationSeconds: call.holdDurationSeconds ?? undefined,
    costCents: call.costCents ?? undefined,
    outcome: call.outcome ?? undefined,
    outcomeSummary: call.outcomeSummary ?? undefined,
    expectedWaitMinutes: call.expectedWaitMinutes ?? undefined,
    callbackRequested: call.callbackRequested,
    createdAt: call.createdAt.toISOString(),
    updatedAt: call.updatedAt.toISOString(),
  };
}

/**
 * Convert a CallEvent entity to a public API response
 */
export function toCallEventPublic(event: CallEvent): CallEventPublic {
  return {
    id: event.id,
    eventType: event.eventType as CallEventPublic['eventType'],
    eventData: event.eventData ?? undefined,
    createdAt: event.createdAt.toISOString(),
  };
}

/**
 * Check if a call is in an active (non-terminal) state
 */
export function isCallActive(status: string): boolean {
  return ['pending', 'dialing', 'in_ivr', 'on_hold', 'with_rep', 'transferring'].includes(status);
}
