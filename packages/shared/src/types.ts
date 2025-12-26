export type CallStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'DIALING'
  | 'NAVIGATING'
  | 'ON_HOLD'
  | 'HUMAN_READY'
  | 'TRANSFERRING'
  | 'TRANSFERRED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type TransferStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'TIMEOUT'
  | 'FAILED';

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  id: string;
  userId: string;
  notifyViaPush: boolean;
  notifyViaSms: boolean;
  defaultTransferPhone: string | null;
  aiIdentity: 'assistant' | 'user' | 'custom';
  customIdentity: string | null;
}

export interface Call {
  id: string;
  userId: string;
  targetPhone: string;
  targetName: string | null;
  purpose: string;
  vapiCallId: string | null;
  status: CallStatus;
  humanDetected: boolean;
  transferStatus: TransferStatus | null;
  scheduledFor: Date | null;
  startedAt: Date | null;
  humanDetectedAt: Date | null;
  transferredAt: Date | null;
  endedAt: Date | null;
  duration: number | null;
  holdDuration: number | null;
  outcome: string | null;
  transcript: string | null;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CallEvent {
  id: string;
  callId: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: 'free' | 'pro' | 'unlimited' | 'business';
  callsUsed: number;
  callsLimit: number;
  periodStart: Date;
  periodEnd: Date;
  stripeId: string | null;
}

// API Request/Response types
export interface CreateCallRequest {
  targetPhone: string;
  targetName?: string;
  purpose: string;
  scheduledFor?: Date;
}

export interface CreateCallResponse {
  id: string;
  status: CallStatus;
  targetPhone: string;
  targetName: string | null;
  purpose: string;
  createdAt: Date;
}

// WebSocket event types
export interface CallStatusEvent {
  callId: string;
  status: CallStatus;
  data?: Record<string, unknown>;
}

export interface CallHumanDetectedEvent {
  callId: string;
  estimatedWait?: number;
}

export interface CallTranscriptEvent {
  callId: string;
  text: string;
  speaker: 'ai' | 'human';
}

export interface CallTransferReadyEvent {
  callId: string;
  expiresIn: number;
}
