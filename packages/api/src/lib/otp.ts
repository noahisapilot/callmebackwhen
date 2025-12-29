import { OTP_CONFIG } from '@callmebackwhen/shared';

export function generateOtpCode(): string {
  // Generate a cryptographically secure 6-digit code
  const randomValues = new Uint32Array(1);
  crypto.getRandomValues(randomValues);
  const code = (randomValues[0]! % 1000000).toString().padStart(OTP_CONFIG.LENGTH, '0');
  return code;
}

export function getOtpExpiryDate(): Date {
  return new Date(Date.now() + OTP_CONFIG.EXPIRES_IN_SECONDS * 1000);
}

export function isOtpExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
