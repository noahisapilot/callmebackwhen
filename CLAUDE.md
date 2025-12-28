# CLAUDE.md - Development Guide

## Project Overview

**Call Me Back When** is a web application that eliminates hold time frustration. Users provide a phone number and describe their goal, and our AI-powered system handles the call—navigating IVR menus, waiting on hold, and either resolving the issue autonomously or transferring the user when needed.

### Quick Links
- [Product Requirements](docs/prd/overview.md)
- [Technical Architecture](docs/prd/technical-architecture.md)
- [User Flows](docs/prd/user-flows.md)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js 20+, TypeScript, AWS Lambda |
| Database | PostgreSQL (Aurora Serverless v2) |
| Voice AI | Vapi.ai (@vapi-ai/server-sdk) |
| Payments | Stripe |
| SMS/OTP | Twilio |
| Infrastructure | AWS (CDK), Vercel (frontend) |

## Project Structure

```
callmebackwhen/
├── CLAUDE.md                 # This file
├── docs/
│   └── prd/                  # Product requirements
│       ├── overview.md
│       ├── technical-architecture.md
│       └── user-flows.md
├── apps/
│   └── web/                  # Next.js frontend
│       ├── app/              # App Router pages
│       ├── components/       # React components
│       └── lib/              # Utilities
├── packages/
│   ├── api/                  # Lambda functions
│   ├── db/                   # Database schema & migrations
│   └── shared/               # Shared types & utilities
└── infra/                    # AWS CDK infrastructure
```

## Development Commands

```bash
# Install dependencies (NEVER edit package.json manually)
pnpm install
pnpm add <package>           # Add a dependency
pnpm add -D <package>        # Add a dev dependency

# Development
pnpm dev                     # Start all services
pnpm dev:web                 # Start frontend only
pnpm dev:api                 # Start API locally (serverless-offline)

# Database
pnpm db:migrate              # Run migrations
pnpm db:generate             # Generate migration from schema changes
pnpm db:studio               # Open Prisma Studio (if using Prisma)

# Testing
pnpm test                    # Run all tests
pnpm test:unit               # Unit tests only
pnpm test:e2e                # E2E tests (Playwright)

# Code Quality
pnpm lint                    # ESLint
pnpm typecheck               # TypeScript check
pnpm format                  # Prettier

# Build & Deploy
pnpm build                   # Build all packages
pnpm deploy:staging          # Deploy to staging
pnpm deploy:prod             # Deploy to production
```

## Key Development Principles

### 1. Never Edit package.json Manually
Always use `pnpm add` or `pnpm add -D` to install packages. This ensures:
- Latest compatible versions
- No dependency conflicts
- Proper lockfile updates

### 2. Type Safety First
- All code must be TypeScript
- Enable strict mode
- Use Zod for runtime validation of external data (API requests, webhooks)

### 3. Mobile-First Design
- Design for 375px viewport first
- Test on actual mobile devices
- Critical flows must work perfectly on phones

### 4. API Design
- RESTful endpoints via API Gateway
- Consistent error response format:
  ```typescript
  {
    error: {
      code: "INSUFFICIENT_BALANCE",
      message: "Add funds to continue"
    }
  }
  ```
- Request validation with Zod schemas

## Environment Variables

### Required for Development

```bash
# .env.local (frontend)
NEXT_PUBLIC_API_URL=http://localhost:3001

# .env (backend)
DATABASE_URL=postgresql://...
VAPI_API_KEY=sk-...
VAPI_WEBHOOK_SECRET=whsec-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
JWT_SECRET=...
```

### Getting API Keys
- **Vapi**: https://dashboard.vapi.ai (sign up for free tier)
- **Stripe**: https://dashboard.stripe.com/test/apikeys
- **Twilio**: https://console.twilio.com (get trial number)

## Vapi Integration

### Creating Calls
```typescript
import Vapi from '@vapi-ai/server-sdk';

const vapi = new Vapi({ apiKey: process.env.VAPI_API_KEY });

const call = await vapi.calls.create({
  phoneNumber: targetPhoneNumber,
  assistant: {
    firstMessage: "Hello, I'm calling on behalf of...",
    model: {
      provider: "openai",
      model: "gpt-4",
      systemPrompt: buildSystemPrompt(userPrompt),
    },
  },
  serverUrl: `${API_URL}/webhooks/vapi`,
});
```

### Webhook Events to Handle
- `call-started`: Update call status to "dialing"
- `speech-update`: Log transcript in real-time
- `function-call`: Handle custom functions (REQUEST_INFO, TRANSFER, etc.)
- `call-ended`: Finalize call, calculate cost, store recording URL

## Database Conventions

### Naming
- Tables: `snake_case`, plural (e.g., `call_events`)
- Columns: `snake_case`
- Primary keys: `id` (UUID)
- Foreign keys: `<table>_id` (e.g., `user_id`)
- Timestamps: `created_at`, `updated_at`

### Migrations
- One migration per logical change
- Descriptive names: `20240115_add_callback_requested_to_calls.sql`
- Always include down migration

## Testing Strategy

### Unit Tests
- Business logic in isolation
- Mock external services (Vapi, Stripe, Twilio)
- Fast, run on every commit

### Integration Tests
- API endpoints with real database (test database)
- Use factories for test data
- Clean up after each test

### E2E Tests
- Critical user flows only
- Use Playwright
- Run before production deploys

## Common Tasks

### Adding a New API Endpoint

1. Define types in `packages/shared/types/`
2. Create Zod schema for request validation
3. Implement handler in `packages/api/handlers/`
4. Add route to API Gateway config
5. Write tests

### Adding a New Page

1. Create page in `apps/web/app/<route>/page.tsx`
2. Use existing components from `components/`
3. Fetch data with React Query
4. Handle loading, error, and empty states

### Modifying Database Schema

1. Update schema in `packages/db/schema/`
2. Generate migration: `pnpm db:generate`
3. Review generated SQL
4. Apply: `pnpm db:migrate`
5. Update TypeScript types if not auto-generated

## Error Handling

### Frontend
```typescript
// Use React Query's error handling
const { data, error, isLoading } = useQuery({
  queryKey: ['calls'],
  queryFn: fetchCalls,
});

if (error) {
  return <ErrorState error={error} />;
}
```

### Backend
```typescript
// Wrap handlers with error middleware
export const handler = withErrorHandling(async (event) => {
  // Handler code
  throw new AppError('INSUFFICIENT_BALANCE', 'Add funds to continue', 402);
});
```

## Security Checklist

- [ ] All endpoints require authentication (except /auth/*)
- [ ] Input validation on all user data
- [ ] Rate limiting on sensitive endpoints
- [ ] No secrets in code or logs
- [ ] SQL injection prevention (parameterized queries)
- [ ] CORS restricted to frontend domain
- [ ] Phone numbers hashed in logs

## Performance Guidelines

- Keep Lambda cold start time low (< 1s)
- Use connection pooling for database
- Cache Vapi assistant configurations
- Lazy load non-critical UI components
- Optimize images with Next.js Image component

## Deployment

### Staging
- Auto-deploys on merge to `main`
- URL: https://staging.callmebackwhen.com
- Uses test Stripe/Twilio keys

### Production
- Manual promotion from staging
- URL: https://callmebackwhen.com
- Requires passing all tests + manual QA

## Troubleshooting

### Common Issues

**Vapi webhook not receiving events**
- Check VAPI_WEBHOOK_SECRET matches dashboard
- Verify serverUrl is publicly accessible
- Check Lambda logs for errors

**Stripe payments failing in dev**
- Use Stripe test card: 4242 4242 4242 4242
- Check STRIPE_WEBHOOK_SECRET is set

**SMS not sending**
- Verify Twilio credentials
- Check phone number is E.164 format (+1...)
- Trial accounts can only send to verified numbers

## Architecture Decisions

### Why Serverless?
- Pay-per-use pricing ideal for variable traffic
- Auto-scaling for spiky call patterns
- Low operational overhead

### Why PostgreSQL over DynamoDB?
- Relational data model fits better (users → calls → events)
- Complex queries for history/analytics
- ACID transactions for payments

### Why Pre-funded Balance vs Auth/Capture?
- Simpler implementation
- Avoids per-transaction CC fees
- Better for small dollar amounts
- Creates slight user commitment

## Contact

For questions about the codebase, check the PRD documents first, then ask in the development channel.
