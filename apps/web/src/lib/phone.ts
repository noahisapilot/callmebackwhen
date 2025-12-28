/**
 * Format a phone number for display (e.g., "(555) 123-4567")
 */
export function formatPhoneDisplay(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Handle +1 prefix
  const nationalNumber = digits.startsWith('1') ? digits.slice(1) : digits;

  if (nationalNumber.length !== 10) {
    return phone; // Return original if not a valid US number
  }

  const areaCode = nationalNumber.slice(0, 3);
  const exchange = nationalNumber.slice(3, 6);
  const subscriber = nationalNumber.slice(6, 10);

  return `(${areaCode}) ${exchange}-${subscriber}`;
}

/**
 * Convert a phone number to E.164 format (e.g., "+15551234567")
 */
export function toE164(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Add +1 if not present
  if (digits.startsWith('1') && digits.length === 11) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  return phone; // Return original if invalid
}

/**
 * Validate a US phone number
 */
export function isValidUSPhone(phone: string): boolean {
  const e164 = toE164(phone);
  return /^\+1[2-9]\d{9}$/.test(e164);
}
