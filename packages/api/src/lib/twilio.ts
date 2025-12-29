import twilio from 'twilio';
import { logger } from './logger.js';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// Create client only if credentials are available
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

// Check if we're in dev mode (no Twilio configured)
export function isDevMode(): boolean {
  return !client || !fromNumber;
}

export async function sendOtpSms(phoneNumber: string, code: string): Promise<boolean> {
  if (isDevMode()) {
    // In development without Twilio, just log the code
    logger.warn('Twilio not configured, logging OTP code', { phoneNumber, code });
    console.log(`\n📱 OTP Code for ${phoneNumber}: ${code}\n`);
    return true;
  }

  try {
    await client.messages.create({
      body: `Your Call Me Back When verification code is: ${code}. Expires in 5 minutes.`,
      from: fromNumber,
      to: phoneNumber,
    });
    logger.info('OTP SMS sent successfully', { phoneNumber: phoneNumber.slice(-4) });
    return true;
  } catch (error) {
    logger.error('Failed to send OTP SMS', { error, phoneNumber: phoneNumber.slice(-4) });
    return false;
  }
}
