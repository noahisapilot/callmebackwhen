# ARCH-001: Technical Architecture Overview

## Document Info
- **Version**: 2.0
- **Status**: Draft
- **Last Updated**: 2024-12

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           User Devices                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   Mobile    │  │   Desktop   │  │   Tablet    │                  │
│  │   Browser   │  │   Browser   │  │   Browser   │                  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │
└─────────┼────────────────┼────────────────┼─────────────────────────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (Vercel)                             │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    React SPA (Vite)                          │    │
│  │  - Mobile-first responsive UI                               │    │
│  │  - Real-time call status via WebSocket                      │    │
│  │  - Stripe Elements for payment                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Backend API (Railway/Render)                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Express.js Server                         │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐    │    │
│  │  │   Auth    │ │   Calls   │ │  Payment  │ │  Webhooks │    │    │
│  │  │  Routes   │ │  Routes   │ │  Routes   │ │  Routes   │    │    │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘    │    │
│  │                                                              │    │
│  │  ┌───────────────────────────────────────────────────────┐  │    │
│  │  │              WebSocket Server (Socket.io)              │  │    │
│  │  └───────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
└───────┬─────────────────┬─────────────────┬─────────────────┬───────┘
        │                 │                 │                 │
        ▼                 ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   PostgreSQL  │ │    Vapi.ai    │ │    Stripe     │ │    Twilio     │
│    (Neon)     │ │               │ │               │ │     SMS       │
│               │ │ - Outbound    │ │ - Payments    │ │               │
│ - Users       │ │   calls       │ │ - Pre-auth    │ │ - Auth codes  │
│ - Calls       │ │ - AI voice    │ │ - Capture     │ │ - Transfer    │
│ - Payments    │ │ - Transfer    │ │               │ │   alerts      │
└───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │  PSTN Network │
                  │ (Phone calls) │
                  └───────────────┘
```

## Technology Stack

### Frontend
| Component | Technology | Rationale |
|-----------|------------|-----------|
| Framework | React 18 | Ecosystem, hooks, concurrent features |
| Build Tool | Vite | Fast dev server, optimized builds |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Utility-first, mobile responsive |
| State | Zustand | Simple, lightweight |
| HTTP | TanStack Query | Caching, mutations |
| Forms | React Hook Form + Zod | Type-safe validation |
| WebSocket | Socket.io-client | Real-time updates |
| Payments | @stripe/react-stripe-js | Card input UI |
| Router | React Router v6 | Routing |

### Backend
| Component | Technology | Rationale |
|-----------|------------|-----------|
| Runtime | Node.js 20 LTS | Stable, TypeScript support |
| Framework | Express.js | Mature, flexible |
| Language | TypeScript 5 | Type safety |
| Database | PostgreSQL 15 | Reliable, ACID |
| ORM | Prisma | Type-safe queries |
| Validation | Zod | Runtime validation |
| WebSocket | Socket.io | Rooms, reconnection |
| Voice AI | @vapi-ai/server-sdk | Call handling |
| Payments | stripe | Payment processing |
| SMS | twilio | Auth codes, notifications |

### Infrastructure
| Component | Technology | Rationale |
|-----------|------------|-----------|
| Frontend Hosting | Vercel | Edge, easy deploys |
| Backend Hosting | Railway | Docker, scaling |
| Database | Neon | Serverless Postgres |
| Monitoring | Sentry | Error tracking |

## Database Schema

```prisma
// prisma/schema.prisma

model User {
  id                  String   @id @default(cuid())
  phone               String   @unique        // Phone number (primary identifier)
  phoneVerified       Boolean  @default(false)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  // Stripe
  stripeCustomerId    String?  @unique
  hasValidPayment     Boolean  @default(false)

  calls               Call[]
  paymentMethods      PaymentMethod[]
  verificationCodes   VerificationCode[]
}

model VerificationCode {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])

  code        String                    // 6-digit code
  expiresAt   DateTime
  attempts    Int      @default(0)      // Rate limiting
  used        Boolean  @default(false)

  createdAt   DateTime @default(now())

  @@index([userId, code])
}

model PaymentMethod {
  id                    String   @id @default(cuid())
  userId                String
  user                  User     @relation(fields: [userId], references: [id])

  stripePaymentMethodId String   @unique
  brand                 String   // visa, mastercard, etc.
  last4                 String
  expMonth              Int
  expYear               Int
  isDefault             Boolean  @default(false)

  createdAt             DateTime @default(now())
}

model Call {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])

  // Target
  targetPhone       String
  targetName        String?
  purpose           String

  // Vapi
  vapiCallId        String?  @unique
  vapiAssistantId   String?

  // Status
  status            CallStatus @default(PENDING)
  callMode          CallMode?  // Standard hold or IVR callback
  humanDetected     Boolean    @default(false)

  // Transfer
  transferAttempts  Int        @default(0)
  transferStatus    TransferStatus?

  // Timing
  startedAt         DateTime?
  holdStartedAt     DateTime?
  humanDetectedAt   DateTime?
  transferredAt     DateTime?
  endedAt           DateTime?

  // Wait time (from IVR)
  estimatedWaitMinutes  Int?

  // Payment
  paymentIntentId   String?
  billableMinutes   Int?
  amountCharged     Int?      // cents
  paymentStatus     PaymentStatus @default(PENDING)

  // Results
  outcome           String?
  transcript        String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  events            CallEvent[]

  @@index([userId, createdAt])
}

enum CallStatus {
  PENDING           // Not started
  DIALING           // Currently dialing
  NAVIGATING        // In IVR menus
  AWAITING_CALLBACK // Used IVR callback, waiting for callback
  ON_HOLD           // Waiting for human
  HUMAN_READY       // Human detected, initiating transfer
  TRANSFERRING      // Transfer in progress
  TRANSFERRED       // Successfully transferred to user
  COMPLETED         // Call ended after transfer
  FAILED            // Call failed
  CANCELLED         // User cancelled
}

enum CallMode {
  STANDARD          // AI waits on hold
  IVR_CALLBACK      // AI used IVR's callback feature
}

enum TransferStatus {
  PENDING           // About to transfer
  RINGING           // Calling user's phone
  RETRYING          // User didn't answer, trying again
  CONNECTED         // User answered
  FAILED            // All attempts failed
}

enum PaymentStatus {
  PENDING           // Auth not yet created
  AUTHORIZED        // Funds held
  CAPTURED          // Charged
  FAILED            // Charge failed
  REFUNDED          // Refunded
  VOID              // Auth released
}

model CallEvent {
  id        String   @id @default(cuid())
  callId    String
  call      Call     @relation(fields: [callId], references: [id])

  type      String   // status_change, transcript, transfer_attempt, etc.
  data      Json

  createdAt DateTime @default(now())

  @@index([callId, createdAt])
}
```

## API Design

### Authentication Endpoints

```yaml
# Phone + SMS Auth
POST   /api/auth/send-code       # Send SMS verification code
POST   /api/auth/verify-code     # Verify code, create session
GET    /api/auth/me              # Get current user
POST   /api/auth/logout          # End session
```

### Call Endpoints

```yaml
GET    /api/calls                # List user's calls
POST   /api/calls                # Create and start call
GET    /api/calls/:id            # Get call details
DELETE /api/calls/:id            # Cancel call
```

### Payment Endpoints

```yaml
POST   /api/payment/setup-intent      # Create SetupIntent for adding card
GET    /api/payment/methods           # List saved payment methods
DELETE /api/payment/methods/:id       # Remove payment method
POST   /api/payment/methods/:id/default # Set default method
```

### Webhook Endpoints

```yaml
POST   /api/webhooks/vapi        # Vapi call events
POST   /api/webhooks/stripe      # Stripe payment events
```

### WebSocket Events

```typescript
// Client -> Server
interface ClientEvents {
  'subscribe:call': { callId: string }
  'unsubscribe:call': { callId: string }
}

// Server -> Client
interface ServerEvents {
  'call:status': {
    callId: string
    status: CallStatus
    data?: {
      estimatedWaitMinutes?: number
      holdDurationSeconds?: number
      transferAttempt?: number
    }
  }
  'call:human_detected': {
    callId: string
  }
  'call:transfer_started': {
    callId: string
    attempt: number
  }
  'call:transfer_complete': {
    callId: string
  }
  'call:cost_update': {
    callId: string
    currentCostCents: number
  }
}
```

## Call Flow: Standard Hold Mode

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │     │   API   │     │  Vapi   │     │ Target  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ Create Call   │               │               │
     ├──────────────►│               │               │
     │               │ Pre-auth $5   │               │
     │               ├───────────────────────────────┤ (Stripe)
     │               │               │               │
     │               │ Start Call    │               │
     │               ├──────────────►│               │
     │               │               │ Dial          │
     │               │               ├──────────────►│
     │               │               │               │
     │               │ Webhook:      │ IVR answers   │
     │               │◄──────────────┤◄──────────────┤
     │ WS: NAVIGATING│               │               │
     │◄──────────────┤               │               │
     │               │               │ Navigate IVR  │
     │               │               ├──────────────►│
     │               │               │               │
     │               │ Webhook:      │ On hold       │
     │               │◄──────────────┤◄──────────────┤
     │ WS: ON_HOLD   │               │               │
     │◄──────────────┤               │               │
     │               │               │               │
     │   (waiting)   │               │   (holding)   │
     │               │               │               │
     │               │ Webhook:      │ Human answers │
     │               │◄──────────────┤◄──────────────┤
     │               │               │               │
     │               │ Send SMS      │ "Please hold" │
     │               ├───────────────┤──────────────►│
     │ SMS received  │               │               │
     │               │               │               │
     │               │ WS: HUMAN     │ Transfer      │
     │◄──────────────┤◄──────────────┤               │
     │               │               │ Call user     │
     │               │               ├───────────────┤
     │ Phone rings   │               │               │
     │◄──────────────┼───────────────┼───────────────┤
     │               │               │               │
     │ Answer        │               │               │
     ├───────────────┼───────────────┼──────────────►│
     │               │               │               │
     │ Connected!    │               │ Transfer done │
     ├───────────────┼───────────────┼──────────────►│
     │               │               │               │
     │ Hang up       │               │               │
     ├───────────────┼───────────────┼──────────────►│
     │               │               │               │
     │               │ Webhook: end  │               │
     │               │◄──────────────┤               │
     │               │ Capture $X.XX │               │
     │               ├───────────────────────────────┤ (Stripe)
     │ WS: COMPLETED │               │               │
     │◄──────────────┤               │               │
```

## Call Flow: IVR Callback Mode

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │     │   API   │     │  Vapi   │     │ Target  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ Create Call   │               │               │
     ├──────────────►│ Pre-auth $5   │               │
     │               ├───────────────┤               │
     │               │ Start Call    │               │
     │               ├──────────────►│ Dial          │
     │               │               ├──────────────►│
     │               │               │               │
     │ WS: NAVIGATING│               │ IVR: "Wait    │
     │◄──────────────┤◄──────────────┤ time 20 min,  │
     │               │               │ press 1 for   │
     │               │               │ callback"     │
     │               │               │               │
     │               │ Detected      │ AI presses 1  │
     │               │ callback      ├──────────────►│
     │               │◄──────────────┤               │
     │               │               │ Provides our  │
     │ WS: AWAITING  │               │ phone number  │
     │ _CALLBACK     │               ├──────────────►│
     │◄──────────────┤               │               │
     │               │               │ IVR: "You'll  │
     │               │               │ receive call" │
     │               │               │◄──────────────┤
     │               │               │               │
     │               │               │ Call ends     │
     │               │◄──────────────┤               │
     │               │               │               │
     │   (waiting for callback)      │               │
     │               │               │               │
     │               │ Inbound call  │               │
     │               │◄──────────────┼───────────────┤
     │               │               │               │
     │               │ Vapi answers  │               │
     │               ├──────────────►│               │
     │               │               │ Verify human  │
     │               │               ├──────────────►│
     │ WS: HUMAN     │               │               │
     │◄──────────────┤◄──────────────┤               │
     │               │ Send SMS      │               │
     │               ├───────────────┤               │
     │               │               │ Transfer      │
     │ Phone rings   │               ├───────────────┤
     │◄──────────────┼───────────────┼───────────────┤
     │               │               │               │
     │ Answer        │               │               │
     ├───────────────┼───────────────┼──────────────►│
     │ Connected!    │               │               │
```

## Transfer Retry Logic

```
┌─────────────────────────────────────────────────────────────┐
│                  HUMAN DETECTED                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Attempt = 1          │
              │  Call user's phone    │
              │  Send SMS: "Rep is    │
              │  waiting!"            │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  User answers?        │
              └───────────┬───────────┘
                    │           │
                   YES          NO (15 sec timeout)
                    │           │
                    ▼           ▼
           ┌────────────┐  ┌────────────────────┐
           │ TRANSFER   │  │ Tell rep: "Still   │
           │ COMPLETE   │  │ connecting..."     │
           └────────────┘  └─────────┬──────────┘
                                     │
                                     ▼
                          ┌───────────────────────┐
                          │  Attempt < 3?         │
                          └───────────┬───────────┘
                                │           │
                               YES          NO
                                │           │
                                ▼           ▼
                    ┌────────────────┐  ┌────────────────┐
                    │ Wait 30 sec    │  │ Offer to take  │
                    │ Attempt++      │  │ message or     │
                    │ Send SMS       │  │ schedule       │
                    │ Try again      │  │ callback       │
                    └───────┬────────┘  └────────────────┘
                            │
                            │ (loop back to "Call user's phone")
```

## Authentication Flow

### Phone + SMS Auth

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │     │   API   │     │ Twilio  │
└────┬────┘     └────┬────┘     └────┬────┘
     │               │               │
     │ Enter phone   │               │
     ├──────────────►│               │
     │               │ Generate code │
     │               │ Store in DB   │
     │               │               │
     │               │ Send SMS      │
     │               ├──────────────►│
     │               │               │
     │ SMS received  │               │
     │◄──────────────┼───────────────┤
     │               │               │
     │ Enter code    │               │
     ├──────────────►│               │
     │               │ Verify code   │
     │               │               │
     │               │ Create/get    │
     │               │ user          │
     │               │               │
     │               │ Generate JWT  │
     │               │               │
     │ JWT (cookie)  │               │
     │◄──────────────┤               │
     │               │               │
     │ Authenticated │               │
```

### JWT Token Structure

```typescript
interface JWTPayload {
  sub: string          // User ID
  phone: string        // Phone number
  iat: number          // Issued at
  exp: number          // Expires (7 days)
}
```

### Session Management

- JWT stored in httpOnly cookie
- 7-day expiration
- Refresh on each API request (sliding window)
- Logout clears cookie

## Payment Flow

### Pre-Authorization

```typescript
// On call creation
async function preAuthorize(userId: string, callId: string) {
  const user = await getUser(userId);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 500, // $5.00 (100 minutes max)
    currency: 'usd',
    customer: user.stripeCustomerId,
    payment_method: user.defaultPaymentMethodId,
    capture_method: 'manual',
    confirm: true,
    metadata: { callId, userId }
  });

  await updateCall(callId, {
    paymentIntentId: paymentIntent.id,
    paymentStatus: 'AUTHORIZED'
  });
}
```

### Capture

```typescript
// On call end
async function capturePayment(call: Call) {
  const billableMinutes = calculateBillableMinutes(call);
  const amountCents = Math.max(100, billableMinutes * 5); // $1 min, $0.05/min

  await stripe.paymentIntents.capture(call.paymentIntentId, {
    amount_to_capture: amountCents
  });

  await updateCall(call.id, {
    billableMinutes,
    amountCharged: amountCents,
    paymentStatus: 'CAPTURED'
  });
}
```

## Vapi.ai Integration

### Assistant Configuration

```typescript
const assistantConfig = {
  name: "CallMeBackWhen Assistant",
  model: {
    provider: "openai",
    model: "gpt-4-turbo",
    temperature: 0.7,
    systemPrompt: `You are a personal assistant making a phone call on behalf of a user.

Your task:
1. Navigate any automated phone menus to reach a human representative
2. When asked why you're calling, state: "{{purpose}}"
3. Listen for callback options. If offered (e.g., "press 1 for callback"), take it and provide our callback number: {{callbackNumber}}
4. If no callback offered, wait on hold patiently
5. When a human representative answers:
   - Say: "Hi, I'm connecting you with the person I'm calling for. One moment please."
   - Trigger the transfer immediately
6. If the user doesn't answer the transfer, say: "They're just finishing up, one moment" and try again

Important:
- If asked if you're an AI, say "I'm an assistant calling on behalf of someone"
- Never hang up unless instructed
- Stay calm and polite at all times
- Report any issues or disconnects`
  },
  voice: {
    provider: "11labs",
    voiceId: "rachel"
  },
  tools: [
    {
      type: "transferCall",
      destinations: [{
        type: "number",
        number: "{{userPhone}}"
      }]
    }
  ]
};
```

### Webhook Events

| Vapi Event | Our Action |
|------------|------------|
| `call-started` | Update status → DIALING |
| `speech-update` | Analyze for human detection |
| `transcript` | Store, detect wait time |
| `tool-calls` | Handle transfer initiation |
| `transfer-started` | Update status → TRANSFERRING |
| `transfer-completed` | Update status → TRANSFERRED |
| `call-ended` | Calculate cost, capture payment |

## Security

### Authentication
- All API endpoints require valid JWT (except auth endpoints)
- WebSocket connections authenticated via token
- Webhook endpoints verify signatures (Vapi, Stripe)

### Rate Limiting
- SMS send: 3 per phone per 10 minutes
- Auth attempts: 5 per phone per hour
- API requests: 100 per user per minute
- Calls: 5 concurrent per user

### Data Protection
- Phone numbers stored in plain text (not PCI sensitive)
- Payment methods: only Stripe IDs stored, never card numbers
- Transcripts: stored encrypted at rest

## Error Handling

### Retry Strategy
```typescript
const retryConfig = {
  maxRetries: 3,
  backoffMultiplier: 2,
  initialDelay: 1000,
  maxDelay: 10000
};
```

### Error Categories
1. **Transient**: Network issues → Retry with backoff
2. **Client**: Invalid input → Return 400 error
3. **Payment**: Card declined → Block calls, notify user
4. **External**: Vapi down → Log, fail gracefully
5. **Internal**: Bugs → Log to Sentry, 500 error

## Monitoring

### Key Metrics
- Call success rate
- Transfer success rate
- Human detection accuracy
- Payment capture rate
- API latency (p50, p95, p99)

### Alerts
- Call success rate < 80%
- Payment failure rate > 5%
- API error rate > 5%
- P99 latency > 2s
