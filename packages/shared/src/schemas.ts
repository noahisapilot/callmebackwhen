import { z } from 'zod';

export const CallStatusSchema = z.enum([
  'PENDING',
  'SCHEDULED',
  'DIALING',
  'NAVIGATING',
  'ON_HOLD',
  'HUMAN_READY',
  'TRANSFERRING',
  'TRANSFERRED',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);

export const TransferStatusSchema = z.enum([
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'TIMEOUT',
  'FAILED',
]);

export const CreateCallSchema = z.object({
  targetPhone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format'),
  targetName: z.string().max(100).optional(),
  purpose: z
    .string()
    .min(5, 'Purpose must be at least 5 characters')
    .max(500, 'Purpose must be less than 500 characters'),
  scheduledFor: z.coerce.date().optional(),
});

export const UpdateUserSettingsSchema = z.object({
  notifyViaPush: z.boolean().optional(),
  notifyViaSms: z.boolean().optional(),
  defaultTransferPhone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format')
    .nullable()
    .optional(),
  aiIdentity: z.enum(['assistant', 'user', 'custom']).optional(),
  customIdentity: z.string().max(100).nullable().optional(),
});

export const UpdateUserSchema = z.object({
  name: z.string().max(100).optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format')
    .nullable()
    .optional(),
});

export type CreateCallInput = z.infer<typeof CreateCallSchema>;
export type UpdateUserSettingsInput = z.infer<typeof UpdateUserSettingsSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
