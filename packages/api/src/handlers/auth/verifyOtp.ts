import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { verifyOtpSchema } from '@callmebackwhen/shared';
import { getDataSource, OtpCode, User } from '@callmebackwhen/db';
import { MoreThan } from 'typeorm';
import { withErrorHandling } from '../../middleware/withErrorHandling.js';
import { success, corsPreflightResponse } from '../../lib/response.js';
import { signToken } from '../../lib/jwt.js';
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
  const { phoneNumber, code } = verifyOtpSchema.parse(body);

  logger.info('Verify OTP request', { phoneNumber: phoneNumber.slice(-4) });

  const dataSource = await getDataSource();
  const otpRepo = dataSource.getRepository(OtpCode);
  const userRepo = dataSource.getRepository(User);

  // Find valid OTP
  const otp = await otpRepo.findOne({
    where: {
      phoneNumber,
      code,
      used: false,
      expiresAt: MoreThan(new Date()),
    },
    order: { createdAt: 'DESC' },
  });

  if (!otp) {
    // Check if there's an expired OTP to give better error message
    const expiredOtp = await otpRepo.findOne({
      where: { phoneNumber, code, used: false },
      order: { createdAt: 'DESC' },
    });

    if (expiredOtp) {
      throw new AppError('OTP_EXPIRED', 'Verification code has expired. Please request a new one.');
    }
    throw new AppError('OTP_INVALID', 'Invalid verification code.');
  }

  // Mark OTP as used
  otp.used = true;
  await otpRepo.save(otp);

  // Find or create user
  let user = await userRepo.findOne({ where: { phoneNumber } });

  if (!user) {
    user = userRepo.create({
      phoneNumber,
      phoneVerified: true,
      balanceCents: 0,
    });
    await userRepo.save(user);
    logger.info('New user created', { userId: user.id });
  } else if (!user.phoneVerified) {
    user.phoneVerified = true;
    await userRepo.save(user);
  }

  // Generate JWT
  const token = signToken(user.id, user.phoneNumber);

  logger.info('OTP verified successfully', {
    userId: user.id,
    phoneNumber: phoneNumber.slice(-4),
  });

  return success({
    token,
    user: {
      id: user.id,
      phoneNumber: user.phoneNumber,
      phoneVerified: user.phoneVerified,
      balanceCents: user.balanceCents,
    },
  });
}

export const main = withErrorHandling(handler);
