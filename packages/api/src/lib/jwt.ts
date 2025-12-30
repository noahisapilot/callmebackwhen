import jwt from 'jsonwebtoken';
import type { AuthTokenPayload } from '@callmebackwhen/shared';
import { logger } from './logger.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

export function signToken(userId: string, phoneNumber: string): string {
  logger.debug('Signing token', {
    secretPreview: `${JWT_SECRET.substring(0, 10)}...`,
    secretLength: JWT_SECRET.length
  });
  return jwt.sign({ userId, phoneNumber }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): AuthTokenPayload {
  logger.debug('Verifying token', {
    secretPreview: `${JWT_SECRET.substring(0, 10)}...`,
    secretLength: JWT_SECRET.length,
    tokenPreview: token ? `${token.substring(0, 30)}...` : 'none'
  });
  try {
    const result = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    logger.debug('Token verified successfully', { userId: result.userId });
    return result;
  } catch (err) {
    logger.error('JWT verify failed', {
      errorName: err instanceof Error ? err.name : 'unknown',
      errorMessage: err instanceof Error ? err.message : String(err),
      secretPreview: `${JWT_SECRET.substring(0, 10)}...`,
    });
    throw err;
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1] ?? null;
}
