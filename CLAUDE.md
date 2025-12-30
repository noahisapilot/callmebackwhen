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
| Backend | Node.js 20+, TypeScript, AWS Lambda, Lambda Powertools |
| Database | PostgreSQL (Aurora Serverless v2), TypeORM |
| Voice AI | Vapi.ai (@vapi-ai/server-sdk) |
| Payments | Stripe (Phase 3) |
| SMS/OTP | Twilio |
| Infrastructure | AWS (CDK, Lambda, API Gateway, S3 + CloudFront) |
| Local Dev | LocalStack, Docker, cdklocal |

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

# Local Environment (LocalStack + PostgreSQL)
docker-compose up -d         # Start LocalStack + PostgreSQL
docker-compose down          # Stop all containers
cdklocal deploy --all        # Deploy CDK stack to LocalStack

# Development
pnpm dev                     # Start all services (frontend + watch mode)
pnpm dev:web                 # Start frontend only
pnpm dev:api                 # Start API locally (hot reload)

# Database (TypeORM)
pnpm db:migrate              # Run migrations
pnpm db:migrate:generate     # Generate migration from entity changes
pnpm db:migrate:revert       # Revert last migration

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
cdk deploy --context env=staging   # Deploy to AWS staging
cdk deploy --context env=prod      # Deploy to AWS production
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
NEXT_PUBLIC_API_URL=http://localhost:4566/restapis/<api-id>/local/_user_request_

# .env (backend)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/callmebackwhen
VAPI_API_KEY=sk-...
VAPI_WEBHOOK_SECRET=whsec-...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
JWT_SECRET=...

# LocalStack
LOCALSTACK_ENDPOINT=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1

# Phase 3 (Stripe - not needed yet)
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
```

### Getting API Keys
- **Vapi**: https://dashboard.vapi.ai (sign up for free tier)
- **Twilio**: https://console.twilio.com (get trial number)
- **Stripe**: https://dashboard.stripe.com/test/apikeys (Phase 3)

## AWS Lambda Powertools

We use [AWS Lambda Powertools for TypeScript](https://docs.powertools.aws.dev/lambda/typescript/latest/) for structured logging, tracing, and metrics in all Lambda functions.

**LLM Documentation**: https://docs.aws.amazon.com/powertools/typescript/latest/llms-full.txt

### Core Utilities
- **Logger**: Structured JSON logs with Lambda context, cold start detection
- **Tracer**: AWS X-Ray integration for distributed tracing
- **Metrics**: Custom CloudWatch metrics

### Installation
```bash
pnpm add @aws-lambda-powertools/logger @aws-lambda-powertools/tracer @aws-lambda-powertools/metrics
```

### Usage Example
```typescript
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';

const logger = new Logger({ serviceName: 'call-handler' });
const tracer = new Tracer({ serviceName: 'call-handler' });
const metrics = new Metrics({ serviceName: 'call-handler' });

export const handler = async (event: APIGatewayEvent) => {
  logger.info('Processing call request', { callId: event.pathParameters?.id });
  metrics.addMetric('CallsProcessed', MetricUnit.Count, 1);
  // ... handler logic
};
```

## Vapi Integration

### Creating Calls
```typescript
import { VapiClient } from '@vapi-ai/server-sdk';

const vapi = new VapiClient({ token: apiKey });

const call = await vapi.calls.create({
  phoneNumberId: 'your-vapi-phone-number-id',
  customer: {
    number: targetPhoneNumber,
  },
  assistant: {
    firstMessage: "Hello, I'm calling on behalf of...",
    model: {
      provider: 'openai',
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }],
      tools: assistantTools, // CreateFunctionToolDto[]
    },
    voice: { provider: 'openai', voiceId: 'alloy' },
    server: { url: webhookUrl },
  },
});
```

### AI Function Tools
The assistant uses these function tools to communicate with the user:
- `REQUEST_INFO`: Request information from customer via SMS
- `TRANSFER`: Initiate warm transfer to customer
- `REPORT_CALLBACK`: Report accepted callback offer
- `REPORT_WAIT_TIME`: Report IVR-announced wait time
- `MARK_RESOLVED`: Mark issue as resolved

### Webhook Events Handled
- `call-started`: Update call status to "in_progress"
- `status-update`: Track call status changes
- `speech-update`: Log transcript in real-time
- `function-call`: Handle AI function calls (REQUEST_INFO, TRANSFER, etc.)
- `call-ended`: Finalize call, calculate duration, store recording URL
- `error`: Log and handle call errors

### Local Development with Vapi Webhooks

For local development, Vapi needs a publicly accessible URL to send webhooks. Use **cloudflared** to create a tunnel:

```bash
# 1. Start LocalStack and your API
docker-compose up -d
cdklocal deploy --all

# 2. Get the LocalStack API Gateway URL (from CDK output)
# Example: http://localhost:4566/restapis/abc123/local/_user_request_

# 3. Start cloudflared tunnel to expose your webhook endpoint
cloudflared tunnel --url http://localhost:4566

# This will output a public URL like:
# https://random-subdomain.trycloudflare.com

# 4. Set the webhook URL in your environment
export VAPI_WEBHOOK_URL=https://random-subdomain.trycloudflare.com/webhooks/vapi

# 5. Redeploy to update Lambda environment
cdklocal deploy --all
```

**Important**: The cloudflared URL changes each time you restart the tunnel. Update `VAPI_WEBHOOK_URL` accordingly.

### Setting Up Vapi

1. Sign up at [dashboard.vapi.ai](https://dashboard.vapi.ai)
2. Get your API key from Settings > API Keys
3. Import or create a phone number (Twilio, Vonage, or use a free Vapi number)
4. Note the Phone Number ID from the dashboard
5. Set up secrets in AWS:
   ```bash
   # For LocalStack
   awslocal secretsmanager put-secret-value \
     --secret-id "callmebackwhen-api-local/vapi-api-key" \
     --secret-string "your-vapi-api-key"

   awslocal secretsmanager put-secret-value \
     --secret-id "callmebackwhen-api-local/vapi-webhook-secret" \
     --secret-string "your-webhook-secret"
   ```
6. Set environment variables:
   ```bash
   export VAPI_PHONE_NUMBER_ID=your-phone-number-id
   export VAPI_WEBHOOK_URL=https://your-cloudflared-url.trycloudflare.com/webhooks/vapi
   ```

## Database Conventions (TypeORM)

### Naming
- Tables: `snake_case`, plural (e.g., `call_events`)
- Columns: `snake_case`
- Primary keys: `id` (UUID)
- Foreign keys: `<table>_id` (e.g., `user_id`)
- Timestamps: `created_at`, `updated_at`

### Entities
- Located in `packages/db/entities/`
- Use decorators: `@Entity()`, `@Column()`, `@PrimaryGeneratedColumn()`
- Relations: `@OneToMany()`, `@ManyToOne()`, `@JoinColumn()`

### Migrations
- Generated from entity changes: `pnpm db:migrate:generate`
- Descriptive names: `1705312345678-AddCallbackRequestedToCalls.ts`
- Review generated SQL before applying
- Always include up and down methods

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

### Modifying Database Schema (TypeORM)

1. Update entity in `packages/db/entities/`
2. Generate migration: `pnpm db:migrate:generate MigrationName`
3. Review generated migration in `packages/db/migrations/`
4. Apply: `pnpm db:migrate`
5. TypeScript types are automatically updated from entities

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

**LocalStack not starting**
- Ensure Docker is running
- Check port 4566 is not in use
- Try `docker-compose down && docker-compose up -d`

**CDK deployment to LocalStack failing**
- Ensure `aws-cdk-local` is installed globally: `npm install -g aws-cdk-local`
- Check LOCALSTACK_ENDPOINT is set correctly
- Verify LocalStack is running: `curl http://localhost:4566/_localstack/health`

**Vapi webhook not receiving events**
- Check VAPI_WEBHOOK_SECRET matches dashboard
- Verify serverUrl is publicly accessible (use `cloudflared tunnel --url http://localhost:4566` for local dev)
- Ensure VAPI_WEBHOOK_URL environment variable is set correctly
- Check Lambda logs for errors: `awslocal logs tail /aws/lambda/callmebackwhen-api-local-vapi-webhook`

**SMS not sending**
- Verify Twilio credentials
- Check phone number is E.164 format (+1...)
- Trial accounts can only send to verified numbers

**Database connection issues**
- Ensure PostgreSQL container is running: `docker-compose ps`
- Check DATABASE_URL is correct
- Verify database exists: `docker-compose exec postgres psql -U postgres -l`

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

### Why S3 + CloudFront vs Vercel?
- Single cloud provider (all AWS)
- Lower cost at scale
- Static export works well for SPA with API backend
- No need for SSR/Server Components (data fetched via React Query)

### Why TypeORM?
- Decorator-based entities familiar to many developers
- Mature ecosystem with good documentation
- Supports migrations with up/down methods
- Works well with PostgreSQL and TypeScript

### Why LocalStack for Local Dev?
- Emulates AWS services locally (Lambda, API Gateway, S3, Secrets Manager)
- CDK deployments work via cdklocal
- Faster iteration than deploying to real AWS
- Free for local development

## Contact

For questions about the codebase, check the PRD documents first, then ask in the development channel.
