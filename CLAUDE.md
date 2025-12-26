# CallMeBackWhen - AI Personal Secretary

## Project Overview

CallMeBackWhen is a mobile-optimized web app that acts as your personal AI secretary for phone calls. It makes calls on your behalf, navigates phone menus, waits on hold, and transfers the call to you when a human representative becomes available.

## How It Works

### Two Operating Modes

**Mode 1: IVR Callback (when available)**
1. AI calls the target number
2. AI detects when IVR offers callback option ("press 1 for callback")
3. AI accepts callback and provides our system number
4. When company calls back, AI answers and verifies human
5. AI calls your phone (warm transfer)
6. You're connected to the rep

**Mode 2: Standard Hold (no callback offered)**
1. AI calls the target number
2. AI navigates IVR menus
3. AI waits on hold indefinitely
4. When human answers, AI says "I'm connecting you, one moment"
5. AI calls your phone (warm transfer)
6. If you don't answer: AI tells rep "still connecting", sends you SMS, retries (up to 3x)
7. You answer, connected to rep

## Tech Stack

- **Runtime**: Node.js 20 LTS with TypeScript
- **Frontend**: React 18 + Vite, Tailwind CSS, mobile-first
- **Backend**: Express.js API server
- **Voice AI**: vapi.ai (@vapi-ai/server-sdk)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Phone + SMS (Twilio)
- **Payments**: Stripe (pre-auth + capture)
- **Real-time**: Socket.io for call status
- **Hosting**: Vercel (frontend) + Railway (backend) + Neon (database)

## Project Structure

```
callmebackwhen/
├── CLAUDE.md              # This file
├── docs/
│   ├── prd/               # Product requirements
│   │   ├── PRD-001-product-overview.md
│   │   ├── PRD-002-mvp-milestones.md
│   │   └── PRD-003-payment-billing.md
│   └── architecture/
│       └── ARCH-001-technical-overview.md
├── packages/
│   ├── web/               # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   └── package.json
│   ├── api/               # Express backend
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   └── types/
│   │   └── package.json
│   └── shared/            # Shared types and utilities
│       └── src/
└── package.json           # Root workspace (pnpm)
```

## Key Features (MVP)

1. **Phone Auth**: Sign up/in with phone number + SMS code
2. **Make Calls**: Enter target number + reason, AI handles the rest
3. **Real-time Status**: See call progress (dialing, navigating, on hold, etc.)
4. **Estimated Wait**: Display wait time when IVR announces it
5. **Automatic Transfer**: AI calls you when human available
6. **Retry Logic**: If you miss the call, AI keeps rep engaged and retries
7. **Call History**: View past calls with duration and cost
8. **Pay-per-minute**: $0.05/min with $1.00 minimum, pre-auth on start

## Pricing Model

- **Cost to us**: ~$0.03/minute (Vapi)
- **Price to user**: $0.05/minute (hold time only)
- **Minimum charge**: $1.00 per call
- **Payment flow**: Pre-authorize $5, capture actual amount on call end

## Development Guidelines

### Code Style
- TypeScript strict mode
- Functional components with hooks in React
- async/await over raw promises
- Meaningful names, minimal comments
- Error handling at boundaries

### API Design
- RESTful endpoints for CRUD
- WebSocket for real-time updates
- Validate inputs with Zod
- Use proper HTTP status codes

### Database
- Prisma for type-safe access
- Migrations for schema changes
- Indexes on frequently queried fields

### Dependencies
- Use `npm install` or `pnpm add` to add packages (never edit package.json manually)
- Keep dependencies minimal and up-to-date

### Testing
- Jest for unit tests
- Playwright for E2E tests
- Test critical paths: auth, calls, transfer, payments

## Environment Variables

```bash
# App
NODE_ENV=development
API_URL=http://localhost:3001
WEB_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://...

# Vapi.ai
VAPI_API_KEY=
VAPI_PHONE_NUMBER_ID=

# Twilio (SMS)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Auth
JWT_SECRET=
```

## Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev                # Start all services
pnpm dev:web           # Frontend only
pnpm dev:api           # Backend only

# Build
pnpm build             # Build all packages

# Test
pnpm test              # Run all tests
pnpm test:e2e          # E2E tests

# Database
pnpm db:migrate        # Run migrations
pnpm db:generate       # Generate Prisma client
pnpm db:studio         # Open Prisma Studio

# Lint
pnpm lint              # Lint all packages
pnpm lint:fix          # Auto-fix lint issues
```

## API Endpoints

### Authentication
```
POST /api/auth/send-code     # Send SMS verification
POST /api/auth/verify-code   # Verify code, get session
GET  /api/auth/me            # Get current user
POST /api/auth/logout        # End session
```

### Calls
```
GET    /api/calls            # List user's calls
POST   /api/calls            # Create and start call
GET    /api/calls/:id        # Get call details
DELETE /api/calls/:id        # Cancel call
```

### Payment
```
POST   /api/payment/setup-intent        # Add payment method
GET    /api/payment/methods             # List payment methods
DELETE /api/payment/methods/:id         # Remove method
POST   /api/payment/methods/:id/default # Set default
```

### Webhooks
```
POST /api/webhooks/vapi      # Vapi call events
POST /api/webhooks/stripe    # Stripe payment events
```

## Call States

```
PENDING           → Not started
DIALING           → Currently dialing target
NAVIGATING        → In IVR menus
AWAITING_CALLBACK → Used callback feature, waiting
ON_HOLD           → Waiting for human
HUMAN_READY       → Human detected, initiating transfer
TRANSFERRING      → Transfer in progress
TRANSFERRED       → User connected to rep
COMPLETED         → Call ended
FAILED            → Call failed
CANCELLED         → User cancelled
```

## Current Status

**Phase**: Planning & Documentation (Complete)

**Next Steps**:
1. Set up project scaffolding (M1)
2. Implement phone authentication (M2)
3. Build call creation + Vapi integration (M3)
4. Add real-time status + human detection (M4)
5. Implement transfer + retry logic (M5)
6. Add payment system (M6)
7. Polish + launch (M7)

## Important Notes

- **Vapi.ai**: Check pricing tiers; free tier has limits
- **Twilio**: Need for both SMS auth and potentially better transfer quality
- **US Market First**: Focus on US phone numbers initially
- **Mobile-First**: Design for phones, but should work on desktop
- **Pre-auth Expiry**: Stripe holds expire after 7 days; long calls need handling

## Documentation

- [PRD-001: Product Overview](docs/prd/PRD-001-product-overview.md)
- [PRD-002: MVP Milestones](docs/prd/PRD-002-mvp-milestones.md)
- [PRD-003: Payment & Billing](docs/prd/PRD-003-payment-billing.md)
- [ARCH-001: Technical Overview](docs/architecture/ARCH-001-technical-overview.md)
