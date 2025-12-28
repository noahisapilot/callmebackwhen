# Technical Architecture

## Overview

Call Me Back When is built as a serverless, event-driven application on AWS with a mobile-optimized web frontend. The architecture prioritizes scalability, cost-efficiency at low volumes, and reliability for voice operations.

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query) for server state
- **Real-time Updates**: Server-Sent Events (SSE) or WebSocket via API Gateway

### Backend
- **Runtime**: Node.js 20+ on AWS Lambda
- **Language**: TypeScript
- **API**: REST via API Gateway (consider tRPC for type safety)
- **Database**: PostgreSQL via Aurora Serverless v2
- **ORM**: TypeORM (entities, migrations, type-safe queries)
- **Lambda Utilities**: AWS Lambda Powertools for TypeScript (logging, tracing, metrics)

### External Services
- **Voice AI**: Vapi.ai (@vapi-ai/server-sdk)
- **Payments**: Stripe
- **SMS**: Twilio (for OTP and user notifications)

### Frontend Hosting
- **S3 + CloudFront**: Static export of Next.js (client-side rendering)
- Next.js configured with `output: 'export'` for static HTML/JS/CSS
- CloudFront CDN for global distribution and caching

### Infrastructure
- **Cloud**: AWS
- **IaC**: AWS CDK (TypeScript)
- **CI/CD**: GitHub Actions

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│                    (Next.js Static Export on S3 + CloudFront)           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Landing   │  │  Dashboard  │  │ Call Status │  │   History   │   │
│  │    Page     │  │    Home     │  │    Live     │  │    View     │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                    │
│                     (AWS API Gateway HTTP API)                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  /auth/*  │  /calls/*  │  /payments/*  │  /users/*  │  /ws     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          LAMBDA FUNCTIONS                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Auth        │  │  Call        │  │  Payment     │                  │
│  │  Handler     │  │  Handler     │  │  Handler     │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Vapi        │  │  Twilio      │  │  User        │                  │
│  │  Webhook     │  │  Webhook     │  │  Handler     │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐
│  PostgreSQL │  │    Vapi     │  │       Stripe        │
│   (Aurora)  │  │     API     │  │     + Twilio        │
└─────────────┘  └─────────────┘  └─────────────────────┘
```

## Database Schema

### Core Tables

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    phone_verified BOOLEAN DEFAULT FALSE,
    balance_cents INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calls table
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    target_phone_number VARCHAR(20) NOT NULL,
    user_prompt TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- pending, dialing, in_ivr, on_hold, with_rep, transferring, completed, failed
    vapi_call_id VARCHAR(100),
    started_at TIMESTAMP WITH TIME ZONE,
    connected_at TIMESTAMP WITH TIME ZONE, -- when rep answered
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    hold_duration_seconds INTEGER,
    cost_cents INTEGER,
    outcome VARCHAR(50), -- resolved_auto, resolved_transfer, failed, cancelled
    outcome_summary TEXT,
    recording_url TEXT,
    transcript_url TEXT,
    expected_wait_minutes INTEGER, -- from IVR if provided
    callback_requested BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call events (for detailed logging)
CREATE TABLE call_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES calls(id) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    -- ivr_detected, hold_started, callback_offered, rep_available,
    -- transfer_initiated, transfer_completed, info_requested, etc.
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    type VARCHAR(20) NOT NULL, -- topup, call_charge, refund
    amount_cents INTEGER NOT NULL,
    balance_after_cents INTEGER NOT NULL,
    stripe_payment_intent_id VARCHAR(100),
    call_id UUID REFERENCES calls(id),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OTP codes (short-lived, could use Redis instead)
CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_calls_user_id ON calls(user_id);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_created_at ON calls(created_at);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_call_events_call_id ON call_events(call_id);
```

## API Endpoints

### Authentication
```
POST /auth/send-otp
  Request:  { phoneNumber: string }
  Response: { success: boolean, expiresIn: number }

POST /auth/verify-otp
  Request:  { phoneNumber: string, code: string }
  Response: { token: string, user: User }

POST /auth/logout
  Response: { success: boolean }
```

### Calls
```
POST /calls
  Request:  { targetPhoneNumber: string, prompt: string }
  Response: { callId: string, status: string }

GET /calls
  Response: { calls: Call[], pagination: {...} }

GET /calls/:id
  Response: { call: Call, events: CallEvent[] }

POST /calls/:id/cancel
  Response: { success: boolean }

GET /calls/:id/recording
  Response: { url: string } (signed URL, expires in 1 hour)

GET /calls/active
  Response: { call: Call | null, events: CallEvent[] }
```

### Payments
```
POST /payments/create-intent
  Request:  { amountCents: number } // 500, 1000, or 2500
  Response: { clientSecret: string }

POST /payments/confirm
  Request:  { paymentIntentId: string }
  Response: { success: boolean, newBalance: number }

GET /payments/history
  Response: { transactions: Transaction[] }
```

### Users
```
GET /users/me
  Response: { user: User }

PATCH /users/me
  Request:  { ... }
  Response: { user: User }
```

### Webhooks (Internal)
```
POST /webhooks/vapi
  -- Handles all Vapi call events

POST /webhooks/twilio
  -- Handles SMS delivery status

POST /webhooks/stripe
  -- Handles payment confirmations
```

## Vapi Integration

### Call Flow

1. **Initiate Call**
```typescript
import Vapi from '@vapi-ai/server-sdk';

const vapi = new Vapi({ apiKey: process.env.VAPI_API_KEY });

const call = await vapi.calls.create({
  phoneNumber: targetPhoneNumber,
  assistant: {
    firstMessage: "Hello, I'm calling on behalf of a customer...",
    model: {
      provider: "openai",
      model: "gpt-4",
      systemPrompt: buildSystemPrompt(userPrompt),
    },
    voice: {
      provider: "11labs",
      voiceId: "...",
    },
  },
  // Webhook for real-time updates
  serverUrl: `${API_BASE_URL}/webhooks/vapi`,
  serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET,
});
```

2. **System Prompt Construction**
```typescript
function buildSystemPrompt(userPrompt: string): string {
  return `
You are an AI assistant making a phone call on behalf of a customer.

CUSTOMER'S GOAL:
${userPrompt}

INSTRUCTIONS:
1. Navigate any IVR/phone menu systems to reach the appropriate department
2. Wait on hold when necessary
3. When you reach a representative:
   - If you can resolve the issue with information you have, do so
   - If you need information from the customer, use the REQUEST_INFO function
   - If the issue requires the customer to speak directly, use the TRANSFER function
4. If the IVR offers a callback option and the wait is long (>10 min), accept it

AVAILABLE FUNCTIONS:
- REQUEST_INFO: Request information from customer via SMS
- TRANSFER: Initiate warm transfer to customer
- REPORT_CALLBACK: Report that a callback was requested
- REPORT_WAIT_TIME: Report expected wait time from IVR
- MARK_RESOLVED: Mark the issue as resolved

Always be polite and professional. You are representing a real customer.
  `.trim();
}
```

3. **Webhook Handler**
```typescript
async function handleVapiWebhook(event: VapiWebhookEvent) {
  switch (event.type) {
    case 'call-started':
      await updateCallStatus(event.callId, 'dialing');
      break;
    case 'speech-update':
      // Log transcript updates
      break;
    case 'function-call':
      await handleFunctionCall(event);
      break;
    case 'call-ended':
      await finalizeCall(event);
      break;
  }
}
```

## Real-time Updates

For the live call dashboard, we need real-time updates:

### Option A: Server-Sent Events (Simpler)
```typescript
// API endpoint
app.get('/calls/:id/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  const subscription = subscribeToCallUpdates(req.params.id, (update) => {
    res.write(`data: ${JSON.stringify(update)}\n\n`);
  });

  req.on('close', () => subscription.unsubscribe());
});
```

### Option B: WebSocket via API Gateway
- More complex setup but better for bidirectional communication
- Recommended if we need real-time SMS responses during calls

## Security Considerations

### Authentication
- JWT tokens with 7-day expiry
- Refresh token rotation
- Rate limiting on OTP endpoints (5 attempts per phone per hour)

### API Security
- All endpoints require authentication except /auth/*
- CORS restricted to frontend domain
- Request validation with Zod
- SQL injection prevention via parameterized queries

### Data Protection
- Phone numbers hashed in logs
- Call recordings access-controlled
- PCI compliance via Stripe (no card data touches our servers)

### Rate Limiting
- 10 calls per user per hour
- 100 API requests per user per minute
- 5 OTP attempts per phone number per hour

## Monitoring & Observability

### Logging
- Structured JSON logs via Winston/Pino
- CloudWatch Logs for Lambda
- Request IDs for tracing

### Metrics
- CloudWatch Metrics for Lambda
- Custom metrics: calls initiated, success rate, avg hold time
- Stripe Dashboard for payment metrics

### Alerting
- Lambda errors > threshold
- Vapi API failures
- Payment failures spike
- Unusual usage patterns

## Cost Estimation (MVP Scale)

### Monthly Costs at 1,000 calls/month (avg 15 min hold)
| Service | Estimated Cost |
|---------|---------------|
| Vapi (15k minutes @ $0.03) | $450 |
| Aurora Serverless v2 | $50-100 |
| Lambda | <$10 |
| API Gateway | <$10 |
| Twilio SMS | ~$20 |
| S3 + CloudFront | <$5 |
| **Total** | ~$555 |

### Revenue at 1,000 calls
- 15,000 minutes @ $0.05 = $750
- **Gross Margin**: ~$200 (27%)

*Note: Margins improve with scale as fixed costs stay constant*

## Development Environment

### Local Setup
```bash
# Prerequisites
node >= 20
pnpm (preferred) or npm
docker (for LocalStack + PostgreSQL)
aws-cdk-local (cdklocal) for deploying to LocalStack

# Environment variables
cp .env.example .env.local
# Fill in: VAPI_API_KEY, TWILIO_*, DATABASE_URL

# Start LocalStack + PostgreSQL
docker-compose up -d

# Install dependencies
pnpm install

# Deploy infrastructure to LocalStack
cdklocal deploy

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

### LocalStack Services
Local development uses LocalStack to emulate AWS services:
- **API Gateway**: HTTP API endpoints
- **Lambda**: Function execution
- **S3**: Static asset hosting (frontend)
- **Secrets Manager**: API keys and secrets
- **CloudWatch**: Logs (viewable via LocalStack dashboard)

PostgreSQL runs as a separate Docker container (LocalStack's RDS emulation is limited).

### CDK Deployment
```bash
# Local (LocalStack)
cdklocal deploy --all

# AWS Staging/Production
cdk deploy --all --context env=staging
cdk deploy --all --context env=production
```

### Testing Strategy
- **Unit Tests**: Jest for business logic
- **Integration Tests**: Supertest for API endpoints
- **E2E Tests**: Playwright for critical user flows
- **Load Tests**: k6 for performance (pre-launch)

## Deployment

### Environments
- **Development**: Auto-deploy on PR (preview URLs)
- **Staging**: Auto-deploy on merge to `main`
- **Production**: Manual promotion from staging

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
- Lint & Type Check
- Unit Tests
- Build
- Deploy to Preview/Staging
- Integration Tests
- (Manual) Deploy to Production
```
