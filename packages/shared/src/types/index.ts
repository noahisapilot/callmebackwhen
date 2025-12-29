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

// Call types (Phase 2 - included for type completeness)
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
