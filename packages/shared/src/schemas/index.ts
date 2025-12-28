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

// Type exports from schemas
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
