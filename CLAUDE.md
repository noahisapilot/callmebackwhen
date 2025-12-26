# CallMeBackWhen - AI Personal Secretary

## Project Overview

CallMeBackWhen is a web application (mobile-optimized) that acts as your personal AI secretary for phone calls. It makes calls on your behalf, waits on hold, and transfers the call to you when a human representative becomes available.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Frontend**: React with TypeScript, mobile-first responsive design
- **Backend**: Express.js API server
- **Voice AI**: vapi.ai (@vapi-ai/server-sdk)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk or Auth0
- **Hosting**: Vercel (frontend) + Railway/Render (backend)
- **Real-time**: WebSocket for call status updates

## Project Structure

```
callmebackwhen/
├── CLAUDE.md              # This file - project context
├── docs/
│   ├── prd/               # Product requirement documents
│   └── architecture/      # Technical architecture docs
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
└── package.json           # Root workspace package
```

## Key Concepts

### Call Flow
1. User enters target phone number and reason for call
2. AI assistant calls the number on user's behalf
3. AI navigates phone menus (IVR) and waits on hold
4. When human detected, AI notifies user
5. User accepts transfer, call is warm-transferred to user's phone
6. If user declines, AI can take a message or schedule callback

### Vapi.ai Integration

We use vapi.ai for voice AI capabilities:

- **Outbound Calls**: `vapi.calls.create()` to initiate calls
- **Call Transfer**: `transferCall` tool for warm/blind transfers
- **Live Call Control**: Monitor calls via `controlUrl`
- **Call Listen**: WebSocket audio streaming via `listenUrl`
- **Webhooks**: Real-time call status updates

Key vapi.ai docs:
- https://docs.vapi.ai/quickstart/phone
- https://docs.vapi.ai/call-forwarding
- https://docs.vapi.ai/calls/call-features

### AI Assistant Behavior

The AI assistant should:
1. Identify itself appropriately when asked (configurable)
2. Navigate IVR menus based on user's stated purpose
3. Detect when a human representative answers
4. Notify user immediately when human is available
5. Provide context to the human before transferring
6. Handle edge cases (disconnects, callbacks offered, etc.)

## Development Guidelines

### Code Style
- Use TypeScript strict mode
- Prefer functional components with hooks in React
- Use async/await over raw promises
- Meaningful variable names, minimal comments
- Error handling at boundaries, not everywhere

### API Design
- RESTful endpoints for CRUD operations
- WebSocket for real-time call status
- Use proper HTTP status codes
- Validate inputs with zod

### Database
- Use Prisma for type-safe database access
- Migrations for schema changes
- Soft deletes for user data

### Testing
- Jest for unit tests
- Playwright for E2E tests
- Test critical paths: call creation, transfer, webhooks

## Environment Variables

```bash
# Vapi.ai
VAPI_API_KEY=           # Vapi API key from dashboard
VAPI_PHONE_NUMBER_ID=   # Vapi phone number ID

# Database
DATABASE_URL=           # PostgreSQL connection string

# Auth
AUTH_SECRET=            # Session secret
CLERK_SECRET_KEY=       # If using Clerk

# App
API_URL=                # Backend API URL
WEB_URL=                # Frontend URL
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
```

## Current Status

**Phase**: Planning & Documentation

Next steps:
1. Complete PRD documentation
2. Set up project scaffolding
3. Implement authentication
4. Build core call flow
5. Add real-time notifications
6. Polish UI/UX

## Important Notes

- Vapi free tier has limitations; we may need paid plan for production
- Call transfer works best with Twilio integration for warm transfers
- Focus on US market first (phone number availability)
- Mobile-first design but should work on desktop too
