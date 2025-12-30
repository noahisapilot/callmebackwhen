import { VapiClient, Vapi } from '@vapi-ai/server-sdk';
import { getVapiApiKey } from './secrets.js';
import { logger } from './logger.js';

let vapiClient: VapiClient | null = null;

/**
 * Get or create Vapi client instance
 */
async function getVapiClient(): Promise<VapiClient> {
  if (vapiClient) {
    return vapiClient;
  }

  const apiKey = await getVapiApiKey();
  vapiClient = new VapiClient({ token: apiKey });
  return vapiClient;
}

/**
 * Build the system prompt for the AI assistant
 */
export function buildSystemPrompt(userPrompt: string): string {
  return `You are an AI assistant making a phone call on behalf of a customer. Your goal is to help them achieve their objective while being professional and efficient.

CUSTOMER'S GOAL:
${userPrompt}

INSTRUCTIONS:
1. Navigate any IVR/phone menu systems to reach the appropriate department
2. Wait on hold when necessary - this is expected and normal
3. When you reach a representative:
   - Introduce yourself: "Hi, I'm an AI assistant calling on behalf of a customer"
   - Explain the customer's goal clearly
   - If you can resolve the issue with information you have, do so
   - If you need information from the customer, use the REQUEST_INFO function
   - If the issue requires the customer to speak directly, use the TRANSFER function
4. If the IVR offers a callback option and the wait is long (>10 min), accept it and use REPORT_CALLBACK
5. If the IVR announces expected wait time, use REPORT_WAIT_TIME to inform the customer

AVAILABLE FUNCTIONS:
- REQUEST_INFO(question: string): Request information from customer via SMS. Use when the representative asks for information you don't have (account numbers, PINs, specific details).
- TRANSFER(reason: string): Initiate warm transfer to customer. Use when the issue requires the customer to speak directly with the representative.
- REPORT_CALLBACK(expectedMinutes: number): Report that you accepted a callback offer. Include the expected time.
- REPORT_WAIT_TIME(minutes: number): Report expected wait time announced by the IVR.
- MARK_RESOLVED(summary: string): Mark the issue as resolved. Include a brief summary of what was accomplished.

BEHAVIOR GUIDELINES:
- Always be polite and professional - you represent the customer
- Be patient during hold times - this is normal
- Listen carefully to IVR options and representative instructions
- If asked to verify identity, explain you're an AI assistant and may need to transfer to the customer
- Don't provide false information - if unsure, ask or transfer
- Keep the customer informed of progress through function calls`.trim();
}

/**
 * Helper to create a function tool for Vapi
 */
function createFunctionTool(
  name: string,
  description: string,
  parameters: Vapi.OpenAiFunctionParameters
): Vapi.CreateFunctionToolDto {
  return {
    type: 'function',
    function: {
      name,
      description,
      parameters,
    },
  };
}

/**
 * Vapi assistant configuration for function calling
 */
const assistantTools: Vapi.CreateFunctionToolDto[] = [
  createFunctionTool(
    'REQUEST_INFO',
    'Request information from the customer via SMS when you need details you don\'t have',
    {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The question to ask the customer',
        },
      },
      required: ['question'],
    }
  ),
  createFunctionTool(
    'TRANSFER',
    'Initiate a warm transfer to connect the customer directly with the representative',
    {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Why the transfer is needed',
        },
      },
      required: ['reason'],
    }
  ),
  createFunctionTool(
    'REPORT_CALLBACK',
    'Report that you accepted a callback offer from the IVR system',
    {
      type: 'object',
      properties: {
        expectedMinutes: {
          type: 'number',
          description: 'Expected time until callback in minutes',
        },
      },
      required: ['expectedMinutes'],
    }
  ),
  createFunctionTool(
    'REPORT_WAIT_TIME',
    'Report the expected wait time announced by the IVR',
    {
      type: 'object',
      properties: {
        minutes: {
          type: 'number',
          description: 'Expected wait time in minutes',
        },
      },
      required: ['minutes'],
    }
  ),
  createFunctionTool(
    'MARK_RESOLVED',
    'Mark the issue as resolved when the goal has been achieved',
    {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'Brief summary of what was accomplished',
        },
      },
      required: ['summary'],
    }
  ),
];

export interface CreateVapiCallParams {
  targetPhoneNumber: string;
  userPrompt: string;
  webhookUrl: string;
  phoneNumberId: string;
}

export interface VapiCallResult {
  vapiCallId: string;
  status: string;
}

/**
 * Create an outbound call via Vapi
 */
export async function createVapiCall(params: CreateVapiCallParams): Promise<VapiCallResult> {
  const { targetPhoneNumber, userPrompt, webhookUrl, phoneNumberId } = params;

  logger.info('Creating Vapi call', {
    targetPhoneNumber: targetPhoneNumber.slice(-4),
    webhookUrl,
  });

  const vapi = await getVapiClient();

  const response = await vapi.calls.create({
    phoneNumberId,
    customer: {
      number: targetPhoneNumber,
    },
    assistant: {
      firstMessage: "Hello, I'm an AI assistant calling on behalf of a customer. Please hold while I navigate to the right department.",
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: buildSystemPrompt(userPrompt),
          },
        ],
        tools: assistantTools,
      },
      voice: {
        provider: 'openai',
        voiceId: 'alloy',
      },
      maxDurationSeconds: 3600, // 1 hour max
      backgroundSound: 'off',
      server: {
        url: webhookUrl,
      },
    },
  });

  // Response can be Call or CallBatchResponse - we expect Call for single call creation
  if (!('id' in response) || typeof response.id !== 'string') {
    throw new Error('Unexpected response from Vapi: missing call ID');
  }

  const call = response;

  logger.info('Vapi call created', {
    vapiCallId: call.id,
    status: call.status,
  });

  return {
    vapiCallId: call.id,
    status: call.status ?? 'queued',
  };
}

/**
 * Cancel an active Vapi call
 */
export async function cancelVapiCall(vapiCallId: string): Promise<void> {
  logger.info('Cancelling Vapi call', { vapiCallId });

  const vapi = await getVapiClient();

  // Delete/end the call
  await vapi.calls.delete({ id: vapiCallId });

  logger.info('Vapi call cancelled', { vapiCallId });
}

/**
 * Get Vapi call details
 */
export async function getVapiCall(vapiCallId: string): Promise<unknown> {
  const vapi = await getVapiClient();
  return vapi.calls.get({ id: vapiCallId });
}
