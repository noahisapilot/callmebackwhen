// User types
export interface User {
  id: string;
  phoneNumber: string;
  phoneVerified: boolean;
  balanceCents: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPublic {
  id: string;
  phoneNumber: string;
  phoneVerified: boolean;
  balanceCents: number;
}

// Auth types
export interface OtpCode {
  id: string;
  phoneNumber: string;
  code: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export interface AuthTokenPayload {
  userId: string;
  phoneNumber: string;
  iat: number;
  exp: number;
}

// API Request/Response types
export interface SendOtpRequest {
  phoneNumber: string;
}

export interface SendOtpResponse {
  success: boolean;
  expiresIn: number;
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  code: string;
}

export interface VerifyOtpResponse {
  token: string;
  user: UserPublic;
}

export interface LogoutResponse {
  success: boolean;
}

export interface GetMeResponse {
  user: UserPublic;
}

// API Error types
export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// Call types
export type CallStatus =
  | 'pending'
  | 'dialing'
  | 'in_ivr'
  | 'on_hold'
  | 'with_rep'
  | 'transferring'
  | 'completed'
  | 'failed';

export type CallOutcome =
  | 'resolved_auto'
  | 'resolved_transfer'
  | 'failed'
  | 'cancelled';

export interface Call {
  id: string;
  userId: string;
  targetPhoneNumber: string;
  userPrompt: string;
  status: CallStatus;
  vapiCallId?: string;
  startedAt?: Date;
  connectedAt?: Date;
  endedAt?: Date;
  durationSeconds?: number;
  holdDurationSeconds?: number;
  costCents?: number;
  outcome?: CallOutcome;
  outcomeSummary?: string;
  recordingUrl?: string;
  transcriptUrl?: string;
  expectedWaitMinutes?: number;
  callbackRequested: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Call public type (for API responses)
export interface CallPublic {
  id: string;
  targetPhoneNumber: string;
  userPrompt: string;
  status: CallStatus;
  startedAt?: string;
  connectedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  holdDurationSeconds?: number;
  costCents?: number;
  outcome?: CallOutcome;
  outcomeSummary?: string;
  expectedWaitMinutes?: number;
  callbackRequested: boolean;
  createdAt: string;
  updatedAt: string;
}

// Call event types
export type CallEventType =
  | 'call_started'
  | 'ivr_detected'
  | 'hold_started'
  | 'hold_ended'
  | 'callback_offered'
  | 'callback_accepted'
  | 'rep_available'
  | 'transfer_initiated'
  | 'transfer_completed'
  | 'info_requested'
  | 'info_received'
  | 'speech_update'
  | 'resolved'
  | 'error';

export interface CallEvent {
  id: string;
  callId: string;
  eventType: CallEventType;
  eventData?: Record<string, unknown>;
  createdAt: Date;
}

export interface CallEventPublic {
  id: string;
  eventType: CallEventType;
  eventData?: Record<string, unknown>;
  createdAt: string;
}

// Call API Request/Response types
export interface CreateCallRequest {
  targetPhoneNumber: string;
  prompt: string;
}

export interface CreateCallResponse {
  call: CallPublic;
}

export interface ListCallsResponse {
  calls: CallPublic[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetCallResponse {
  call: CallPublic;
  events: CallEventPublic[];
}

export interface GetActiveCallResponse {
  call: CallPublic | null;
  events: CallEventPublic[];
}

export interface CancelCallResponse {
  success: boolean;
}

// SSE event types for call streaming
export type CallStreamEventType =
  | 'status_update'
  | 'event'
  | 'transcript'
  | 'error'
  | 'heartbeat';

export interface CallStreamEvent {
  type: CallStreamEventType;
  data: {
    callId: string;
    status?: CallStatus;
    event?: CallEventPublic;
    transcript?: string;
    message?: string;
    timestamp: string;
  };
}

// Vapi function call types (for AI actions)
export type VapiFunctionName =
  | 'REQUEST_INFO'
  | 'TRANSFER'
  | 'REPORT_CALLBACK'
  | 'REPORT_WAIT_TIME'
  | 'MARK_RESOLVED';

export interface VapiFunctionCall {
  name: VapiFunctionName;
  arguments: Record<string, unknown>;
}
