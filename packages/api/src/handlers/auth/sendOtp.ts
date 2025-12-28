import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { sendOtpSchema, OTP_CONFIG } from '@callmebackwhen/shared';
import { getDataSource, OtpCode } from '@callmebackwhen/db';
import { withErrorHandling } from '../../middleware/withErrorHandling.js';
import { success, corsPreflightResponse } from '../../lib/response.js';
import { generateOtpCode, getOtpExpiryDate } from '../../lib/otp.js';
import { sendOtpSms } from '../../lib/twilio.js';
import { logger } from '../../lib/logger.js';
import { AppError } from '../../lib/errors.js';

async function handler(
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') {
    return corsPreflightResponse();
  }

  const body = JSON.parse(event.body ?? '{}');
  const { phoneNumber } = sendOtpSchema.parse(body);

  logger.info('Send OTP request', { phoneNumber: phoneNumber.slice(-4) });

  const dataSource = await getDataSource();
  const otpRepo = dataSource.getRepository(OtpCode);

  // Check rate limiting - max 5 OTPs per phone per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentOtps = await otpRepo.count({
    where: {
      phoneNumber,
      createdAt: { $gte: oneHourAgo } as unknown as Date,
    },
  });

  if (recentOtps >= OTP_CONFIG.MAX_ATTEMPTS_PER_HOUR) {
    throw new AppError(
      'OTP_RATE_LIMITED',
      'Too many OTP requests. Please try again later.',
      429
    );
  }

  // Generate and save OTP
  const code = generateOtpCode();
  const expiresAt = getOtpExpiryDate();

  const otp = otpRepo.create({
    phoneNumber,
    code,
    expiresAt,
    used: false,
  });
  await otpRepo.save(otp);

  // Send SMS
  const sent = await sendOtpSms(phoneNumber, code);
  if (!sent) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Failed to send verification code', 503);
  }

  logger.info('OTP sent successfully', { phoneNumber: phoneNumber.slice(-4) });

  return success({
    success: true,
    expiresIn: OTP_CONFIG.EXPIRES_IN_SECONDS,
  });
}

export const main = withErrorHandling(handler);
