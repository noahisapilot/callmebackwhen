# Call Me Back When

Never wait on hold again. Our AI handles the call for you.

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker (for PostgreSQL)
- LocalStack CLI (`pip install localstack`)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` with your values (Twilio is optional for local dev - OTP codes will be logged to console).

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Build Packages

```bash
pnpm build
```

### 5. Run Database Migration

```bash
pnpm db:migrate
```

### 6. Start LocalStack

```bash
localstack start
```

### 7. Deploy to LocalStack

```bash
cdklocal deploy --all
```

Note the API URL from the output (something like `http://localhost:4566/restapis/xxx/local/_user_request_`).

### 8. Update Frontend API URL

Edit `apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=<your-api-url-from-step-7>
```

### 9. Start Frontend

```bash
pnpm dev:web
```

Visit http://localhost:3000

## Development Commands

```bash
# Start all services
pnpm dev

# Start frontend only
pnpm dev:web

# Build all packages
pnpm build

# Run linting
pnpm lint

# Type checking
pnpm typecheck

# Database migrations
pnpm db:migrate              # Run migrations
pnpm db:migrate:generate     # Generate new migration
pnpm db:migrate:revert       # Revert last migration
```

## Project Structure

```
callmebackwhen/
├── apps/
│   └── web/                  # Next.js frontend
├── packages/
│   ├── api/                  # Lambda handlers
│   ├── db/                   # TypeORM entities & migrations
│   └── shared/               # Shared types & utilities
├── infra/                    # AWS CDK infrastructure
├── docker-compose.yml        # PostgreSQL
└── CLAUDE.md                 # Detailed dev guide
```

## API Endpoints (Phase 1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/send-otp` | Send OTP to phone number |
| POST | `/auth/verify-otp` | Verify OTP, get JWT |
| POST | `/auth/logout` | Logout |
| GET | `/users/me` | Get current user (requires auth) |

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, React Query
- **Backend**: Node.js, TypeScript, AWS Lambda, Lambda Powertools
- **Database**: PostgreSQL, TypeORM
- **Infrastructure**: AWS CDK, LocalStack (local dev)
- **SMS**: Twilio (optional for local dev)

## Troubleshooting

### LocalStack not starting
```bash
localstack status  # Check if running
localstack start   # Start it
```

### Database connection issues
```bash
docker compose ps              # Check if PostgreSQL is running
docker compose logs postgres   # View logs
```

### OTP not sending
Without Twilio configured, OTP codes are logged to the Lambda console. Check LocalStack logs:
```bash
localstack logs
```

## Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed development instructions and architecture decisions.
