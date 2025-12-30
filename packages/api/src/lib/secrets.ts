import { getSecret } from '@aws-lambda-powertools/parameters/secrets';
import { logger } from './logger.js';

// Cache secrets in memory to avoid repeated API calls
let vapiApiKey: string | null = null;
let vapiWebhookSecret: string | null = null;

/**
 * Get Vapi API key from Secrets Manager
 * Uses Powertools Parameters with built-in caching
 */
export async function getVapiApiKey(): Promise<string> {
  if (vapiApiKey) {
    return vapiApiKey;
  }

  const secretName = process.env.VAPI_API_KEY_SECRET_NAME;
  if (!secretName) {
    throw new Error('VAPI_API_KEY_SECRET_NAME environment variable not set');
  }

  logger.debug('Fetching Vapi API key from Secrets Manager', { secretName });

  const secret = await getSecret(secretName, { maxAge: 300 }); // Cache for 5 minutes
  if (!secret || typeof secret !== 'string') {
    throw new Error('Failed to retrieve Vapi API key from Secrets Manager');
  }

  vapiApiKey = secret;
  return vapiApiKey;
}

/**
 * Get Vapi webhook secret from Secrets Manager
 * Used to verify webhook signatures
 */
export async function getVapiWebhookSecret(): Promise<string> {
  if (vapiWebhookSecret) {
    return vapiWebhookSecret;
  }

  const secretName = process.env.VAPI_WEBHOOK_SECRET_NAME;
  if (!secretName) {
    throw new Error('VAPI_WEBHOOK_SECRET_NAME environment variable not set');
  }

  logger.debug('Fetching Vapi webhook secret from Secrets Manager', { secretName });

  const secret = await getSecret(secretName, { maxAge: 300 }); // Cache for 5 minutes
  if (!secret || typeof secret !== 'string') {
    throw new Error('Failed to retrieve Vapi webhook secret from Secrets Manager');
  }

  vapiWebhookSecret = secret;
  return vapiWebhookSecret;
}

/**
 * Clear cached secrets (useful for testing)
 */
export function clearSecretCache(): void {
  vapiApiKey = null;
  vapiWebhookSecret = null;
}
