# ARCH-001: Technical Architecture Overview

## Document Info
- **Version**: 1.0
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
│  │  - Push notification handling                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Backend API (Railway/Render)                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Express.js Server                         │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐    │    │
│  │  │   Auth    │ │   Calls   │ │  Webhooks │ │   Users   │    │    │
│  │  │  Routes   │ │  Routes   │ │  Routes   │ │  Routes   │    │    │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘    │    │
│  │                                                              │    │
│  │  ┌───────────────────────────────────────────────────────┐  │    │
│  │  │              WebSocket Server (Socket.io)              │  │    │
│  │  │  - Real-time call status updates                       │  │    │
│  │  │  - Connection management per user                      │  │    │
│  │  └───────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
└────────────────┬──────────────────────────────────┬─────────────────┘
                 │                                  │
                 ▼                                  ▼
┌────────────────────────────┐      ┌────────────────────────────────┐
│      PostgreSQL (Neon)     │      │         Vapi.ai                │
│  ┌──────────────────────┐  │      │  ┌──────────────────────────┐  │
│  │  Users               │  │      │  │  Outbound Calls          │  │
│  │  Calls               │  │      │  │  AI Assistants           │  │
│  │  CallEvents          │  │      │  │  Phone Numbers           │  │
│  │  Subscriptions       │  │      │  │  Transcription           │  │
│  └──────────────────────┘  │      │  │  Call Transfer           │  │
└────────────────────────────┘      │  └──────────────────────────┘  │
                                    └────────────────────────────────┘
                                                   │
                                                   ▼
                                    ┌────────────────────────────────┐
                                    │         PSTN Network           │
                                    │  (Actual phone calls)          │
                                    └────────────────────────────────┘
```

## Technology Stack

### Frontend
| Component | Technology | Rationale |
|-----------|------------|-----------|
| Framework | React 18 | Ecosystem, hooks, concurrent features |
| Build Tool | Vite | Fast dev server, optimized builds |
| Styling | Tailwind CSS | Utility-first, mobile responsive |
| State | Zustand | Simple, lightweight state management |
| Forms | React Hook Form + Zod | Type-safe form validation |
| HTTP | TanStack Query | Caching, mutations, real-time sync |
| WebSocket | Socket.io-client | Reliable real-time connection |
| Notifications | Web Push API | Native push notifications |
| Router | React Router v6 | Standard routing solution |

### Backend
| Component | Technology | Rationale |
|-----------|------------|-----------|
| Runtime | Node.js 20 LTS | Stable, TypeScript support |
| Framework | Express.js | Mature, flexible, well-documented |
| Language | TypeScript 5 | Type safety, better DX |
| Database | PostgreSQL 15 | Reliable, ACID, good hosting options |
| ORM | Prisma | Type-safe queries, migrations |
| Validation | Zod | Runtime validation, TypeScript inference |
| WebSocket | Socket.io | Fallback handling, rooms |
| Voice AI | @vapi-ai/server-sdk | Official Vapi integration |
| Auth | Clerk | Managed auth, easy integration |
| Jobs | BullMQ + Redis | Background job processing |

### Infrastructure
| Component | Technology | Rationale |
|-----------|------------|-----------|
| Frontend Hosting | Vercel | Edge network, easy deploys |
| Backend Hosting | Railway | Docker support, easy scaling |
| Database | Neon | Serverless Postgres, branching |
| Redis | Upstash | Serverless Redis for jobs |
| Monitoring | Sentry | Error tracking |
| Analytics | PostHog | Product analytics |

## Database Schema

```prisma
// prisma/schema.prisma

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  clerkId       String   @unique
  name          String?
  phone         String?  // User's phone for transfers
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  calls         Call[]
  subscription  Subscription?
  settings      UserSettings?
}

model UserSettings {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id])

  notifyViaPush         Boolean  @default(true)
  notifyViaSms          Boolean  @default(false)
  defaultTransferPhone  String?
  aiIdentity            String   @default("assistant") // "assistant" | "user" | "custom"
  customIdentity        String?
}

model Subscription {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])

  tier          String   @default("free") // free, pro, unlimited, business
  callsUsed     Int      @default(0)
  callsLimit    Int      @default(2)
  periodStart   DateTime
  periodEnd     DateTime
  stripeId      String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Call {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])

  // Target
  targetPhone     String
  targetName      String?  // Optional friendly name
  purpose         String   // Why user is calling

  // Vapi
  vapiCallId      String?  @unique
  vapiAssistantId String?

  // Status
  status          CallStatus @default(PENDING)
  humanDetected   Boolean    @default(false)
  transferStatus  TransferStatus?

  // Timing
  scheduledFor    DateTime?
  startedAt       DateTime?
  humanDetectedAt DateTime?
  transferredAt   DateTime?
  endedAt         DateTime?

  // Results
  duration        Int?     // Total duration in seconds
  holdDuration    Int?     // Time on hold in seconds
  outcome         String?  // Success, failed, etc.
  transcript      String?  // Full call transcript
  summary         String?  // AI-generated summary

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  events          CallEvent[]
}

enum CallStatus {
  PENDING      // Call not started
  SCHEDULED    // Scheduled for later
  DIALING      // Currently dialing
  NAVIGATING   // Navigating IVR
  ON_HOLD      // Waiting for human
  HUMAN_READY  // Human detected, awaiting transfer
  TRANSFERRING // Transfer in progress
  TRANSFERRED  // Successfully transferred
  COMPLETED    // Call ended after transfer
  FAILED       // Call failed
  CANCELLED    // User cancelled
}

enum TransferStatus {
  PENDING
  ACCEPTED
  DECLINED
  TIMEOUT
  FAILED
}

model CallEvent {
  id        String   @id @default(cuid())
  callId    String
  call      Call     @relation(fields: [callId], references: [id])

  type      String   // status_change, transcript, error, etc.
  data      Json     // Event-specific data

  createdAt DateTime @default(now())
}
```

## API Design

### REST Endpoints

```yaml
# Authentication (handled by Clerk)
POST   /api/auth/webhook          # Clerk webhook for user sync

# Users
GET    /api/users/me              # Get current user
PATCH  /api/users/me              # Update current user
GET    /api/users/me/settings     # Get user settings
PATCH  /api/users/me/settings     # Update user settings

# Calls
GET    /api/calls                 # List user's calls
POST   /api/calls                 # Create new call
GET    /api/calls/:id             # Get call details
DELETE /api/calls/:id             # Cancel call
POST   /api/calls/:id/transfer    # Accept transfer
POST   /api/calls/:id/decline     # Decline transfer
POST   /api/calls/:id/message     # Take message instead

# Vapi Webhooks
POST   /api/webhooks/vapi         # Vapi call status webhook
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
    data?: Record<string, unknown>
  }
  'call:human_detected': {
    callId: string
    estimatedWait?: number
  }
  'call:transcript': {
    callId: string
    text: string
    speaker: 'ai' | 'human'
  }
  'call:transfer_ready': {
    callId: string
    expiresIn: number  // seconds to accept
  }
}
```

### Request/Response Examples

#### Create Call
```typescript
// POST /api/calls
// Request
{
  "targetPhone": "+14155551234",
  "targetName": "Comcast Support",
  "purpose": "Cancel my internet subscription",
  "scheduledFor": null  // null = immediate
}

// Response
{
  "id": "call_abc123",
  "status": "PENDING",
  "targetPhone": "+14155551234",
  "targetName": "Comcast Support",
  "purpose": "Cancel my internet subscription",
  "createdAt": "2024-12-20T10:30:00Z"
}
```

#### Call Status Update (WebSocket)
```typescript
// Server -> Client
{
  "event": "call:status",
  "data": {
    "callId": "call_abc123",
    "status": "ON_HOLD",
    "data": {
      "holdStartedAt": "2024-12-20T10:32:00Z",
      "estimatedWait": 720  // 12 minutes
    }
  }
}
```

## Vapi.ai Integration

### Assistant Configuration

```typescript
const assistantConfig = {
  name: "Secretary Assistant",
  model: {
    provider: "openai",
    model: "gpt-4-turbo",
    temperature: 0.7,
    systemPrompt: `You are a personal assistant making a phone call on behalf of the user.

Your task:
1. Navigate any automated phone menus to reach a human representative
2. When asked, state that you're calling about: {{purpose}}
3. Wait on hold patiently
4. When a human answers, politely inform them you're connecting them with {{userName}}

Important:
- Be polite and professional
- If asked if you're an AI, say "I'm an assistant calling on behalf of {{userName}}"
- Never hang up unless instructed
- Report any issues immediately`
  },
  voice: {
    provider: "11labs",
    voiceId: "rachel"  // Professional female voice
  },
  tools: [
    {
      type: "transferCall",
      destinations: [
        {
          type: "number",
          number: "{{userPhone}}"
        }
      ],
      messages: [
        {
          type: "request-start",
          content: "I'm connecting you with {{userName}} now."
        }
      ]
    }
  ]
}
```

### Webhook Handling

```typescript
// POST /api/webhooks/vapi
async function handleVapiWebhook(req: Request) {
  const { type, call } = req.body;

  switch (type) {
    case 'call-started':
      await updateCallStatus(call.id, 'DIALING');
      break;

    case 'speech-update':
      // Analyze for human detection
      if (await detectHuman(call.transcript)) {
        await updateCallStatus(call.id, 'HUMAN_READY');
        await notifyUser(call.userId);
      }
      break;

    case 'call-ended':
      await updateCallStatus(call.id, 'COMPLETED');
      await saveTranscript(call.id, call.transcript);
      break;

    case 'transfer-started':
      await updateCallStatus(call.id, 'TRANSFERRING');
      break;

    case 'transfer-completed':
      await updateCallStatus(call.id, 'TRANSFERRED');
      break;
  }
}
```

### Human Detection Strategy

```typescript
interface HumanDetectionSignals {
  // Speech patterns
  usedUserName: boolean;        // Said the user's name
  askedQuestion: boolean;       // Asked a question
  personalizedGreeting: boolean; // "Hi, this is John from..."

  // Timing patterns
  responseLatency: number;      // Humans respond slower than IVR
  pausePatterns: boolean;       // Natural pauses

  // Content patterns
  noMenuOptions: boolean;       // No "press 1 for..."
  acknowledgement: boolean;     // "I can help you with that"
}

function analyzeForHuman(transcript: string): HumanDetectionSignals {
  // Implement detection logic
  // Return confidence score
}
```

## Security Considerations

### Authentication
- All API endpoints require valid Clerk JWT
- WebSocket connections authenticated via token
- Webhook endpoints validate Vapi signature

### Data Protection
- Phone numbers encrypted at rest
- Transcripts stored encrypted
- PII redaction for analytics

### Rate Limiting
- 100 API requests per minute per user
- 5 concurrent calls per user (paid tiers)
- Webhook rate limiting by IP

### Call Recording Compliance
- Two-party consent states: Recording disabled or user notified
- All recordings stored encrypted
- Retention policy: 30 days (configurable)

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
1. **Transient**: Network issues, timeouts → Retry with backoff
2. **Client**: Invalid input, auth failure → Return error to client
3. **External**: Vapi errors, phone network → Log, notify, mark call failed
4. **Internal**: Bugs, unexpected state → Log, alert, graceful degradation

## Monitoring & Observability

### Key Metrics
- Call success rate
- Human detection accuracy
- Transfer success rate
- Average hold time
- API latency (p50, p95, p99)
- WebSocket connection count

### Alerting
- Call success rate < 80%
- API error rate > 5%
- P99 latency > 2s
- WebSocket disconnection spike

### Logging
- Structured JSON logs
- Request/response logging (sanitized)
- Call state machine transitions
- Vapi webhook payloads

## Deployment

### Environments
- **Development**: Local Docker Compose
- **Staging**: Railway preview deployments
- **Production**: Railway + Vercel

### CI/CD Pipeline
```yaml
# GitHub Actions
on:
  push:
    branches: [main]

jobs:
  test:
    - Run unit tests
    - Run integration tests
    - Type checking

  deploy-staging:
    - Deploy to Railway preview
    - Deploy to Vercel preview
    - Run E2E tests

  deploy-production:
    - Deploy to Railway (production)
    - Deploy to Vercel (production)
    - Smoke tests
```

## Future Considerations

### Scaling
- Horizontal API scaling with load balancer
- Redis cluster for WebSocket coordination
- Database read replicas

### Multi-region
- Edge functions for latency
- Regional phone numbers
- Data residency compliance

### Native Apps
- React Native for iOS/Android
- Push notification tokens
- Background call monitoring
