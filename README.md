# Call Me Back When

Never wait on hold again. Our AI handles the call for you.

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+ (`npm install -g pnpm`)
- Docker
- LocalStack CLI (`pip install localstack`)
- cdklocal (`npm install -g aws-cdk-local aws-cdk`)

### Setup

```bash
./setup.sh
```

This will:
- Install dependencies
- Create `.env` from template
- Start PostgreSQL
- Build all packages
- Run database migrations
- Start LocalStack and deploy the API

Then start the frontend:

```bash
pnpm dev:web
```

Visit http://localhost:3000

---

<details>
<summary>Manual Setup (if you prefer step-by-step)</summary>

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
```

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
localstack start -d
```

### 7. Deploy to LocalStack

```bash
cd infra
cdklocal deploy --all --require-approval never
```

### 8. Start Frontend

```bash
pnpm dev:web
```

</details>

---

## Development Commands

```bash
pnpm dev:web              # Start frontend
pnpm build                # Build all packages
pnpm db:migrate           # Run migrations
pnpm lint                 # Run linting
pnpm typecheck            # Type checking
```

## Project Structure

```
callmebackwhen/
├── apps/web/             # Next.js frontend
├── packages/
│   ├── api/              # Lambda handlers
│   ├── db/               # TypeORM entities & migrations
│   └── shared/           # Shared types & utilities
├── infra/                # AWS CDK infrastructure
└── setup.sh              # One-command setup
```

## API Endpoints (Phase 1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/send-otp` | Send OTP to phone number |
| POST | `/auth/verify-otp` | Verify OTP, get JWT |
| POST | `/auth/logout` | Logout |
| GET | `/users/me` | Get current user (requires auth) |

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
Without Twilio configured, OTP codes are logged to the Lambda console:
```bash
localstack logs
```

## Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed development instructions.
