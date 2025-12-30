import { z } from 'zod';

// Phone number validation (E.164 format for US numbers)
const phoneNumberRegex = /^\+1[2-9]\d{9}$/;

export const phoneNumberSchema = z
  .string()
  .regex(phoneNumberRegex, 'Please enter a valid US phone number');

// OTP code validation (6 digits)
export const otpCodeSchema = z
  .string()
  .length(6, 'Code must be 6 digits')
  .regex(/^\d{6}$/, 'Code must contain only numbers');

// Auth schemas
export const sendOtpSchema = z.object({
  phoneNumber: phoneNumberSchema,
});

export const verifyOtpSchema = z.object({
  phoneNumber: phoneNumberSchema,
  code: otpCodeSchema,
});

// User schemas
export const userPublicSchema = z.object({
  id: z.string().uuid(),
  phoneNumber: z.string(),
  phoneVerified: z.boolean(),
  balanceCents: z.number().int().min(0),
});

// Response schemas
export const sendOtpResponseSchema = z.object({
  success: z.boolean(),
  expiresIn: z.number().int().positive(),
});

export const verifyOtpResponseSchema = z.object({
  token: z.string(),
  user: userPublicSchema,
});

export const getMeResponseSchema = z.object({
  user: userPublicSchema,
});

export const logoutResponseSchema = z.object({
  success: z.boolean(),
});

// Error schema
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

// Call schemas
export const callStatusSchema = z.enum([
  'pending',
  'dialing',
  'in_ivr',
  'on_hold',
  'with_rep',
  'transferring',
  'completed',
  'failed',
]);

export const callOutcomeSchema = z.enum([
  'resolved_auto',
  'resolved_transfer',
  'failed',
  'cancelled',
]);

export const createCallSchema = z.object({
  targetPhoneNumber: phoneNumberSchema,
  prompt: z
    .string()
    .min(10, 'Please provide more details about what you need')
    .max(2000, 'Prompt is too long'),
});

export const listCallsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const callIdParamSchema = z.object({
  id: z.string().uuid('Invalid call ID'),
});

export const callPublicSchema = z.object({
  id: z.string().uuid(),
  targetPhoneNumber: z.string(),
  userPrompt: z.string(),
  status: callStatusSchema,
  startedAt: z.string().optional(),
  connectedAt: z.string().optional(),
  endedAt: z.string().optional(),
  durationSeconds: z.number().int().optional(),
  holdDurationSeconds: z.number().int().optional(),
  costCents: z.number().int().optional(),
  outcome: callOutcomeSchema.optional(),
  outcomeSummary: z.string().optional(),
  expectedWaitMinutes: z.number().int().optional(),
  callbackRequested: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const callEventTypeSchema = z.enum([
  'call_started',
  'ivr_detected',
  'hold_started',
  'hold_ended',
  'callback_offered',
  'callback_accepted',
  'rep_available',
  'transfer_initiated',
  'transfer_completed',
  'info_requested',
  'info_received',
  'speech_update',
  'resolved',
  'error',
]);

export const callEventPublicSchema = z.object({
  id: z.string().uuid(),
  eventType: callEventTypeSchema,
  eventData: z.record(z.unknown()).optional(),
  createdAt: z.string(),
});

// Response schemas
export const createCallResponseSchema = z.object({
  call: callPublicSchema,
});

export const listCallsResponseSchema = z.object({
  calls: z.array(callPublicSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export const getCallResponseSchema = z.object({
  call: callPublicSchema,
  events: z.array(callEventPublicSchema),
});

export const getActiveCallResponseSchema = z.object({
  call: callPublicSchema.nullable(),
  events: z.array(callEventPublicSchema),
});

export const cancelCallResponseSchema = z.object({
  success: z.boolean(),
});

// Type exports from schemas
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type CreateCallInput = z.infer<typeof createCallSchema>;
export type ListCallsQuery = z.infer<typeof listCallsQuerySchema>;
export type CallIdParam = z.infer<typeof callIdParamSchema>;
