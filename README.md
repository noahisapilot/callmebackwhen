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

## API Endpoints

### Authentication (Phase 1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/send-otp` | Send OTP to phone number |
| POST | `/auth/verify-otp` | Verify OTP, get JWT |
| POST | `/auth/logout` | Logout |
| GET | `/users/me` | Get current user (requires auth) |

### Calls (Phase 2)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/calls` | Initiate a new call |
| GET | `/calls` | List call history (paginated) |
| GET | `/calls/active` | Get current active call |
| GET | `/calls/:id` | Get call details with events |
| POST | `/calls/:id/cancel` | Cancel an active call |
| GET | `/calls/:id/stream` | SSE stream for real-time updates |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhooks/vapi` | Vapi webhook for call events |

## Vapi Setup (for Call Functionality)

1. Sign up at [dashboard.vapi.ai](https://dashboard.vapi.ai)
2. Get your API key from Settings > API Keys
3. Import or create a phone number (Twilio, Vonage, or Vapi number)
4. Set up secrets in LocalStack:
   ```bash
   awslocal secretsmanager put-secret-value \
     --secret-id "callmebackwhen-api-local/vapi-api-key" \
     --secret-string "your-vapi-api-key"
   ```
5. Set environment variables:
   ```bash
   export VAPI_PHONE_NUMBER_ID=your-phone-number-id
   export VAPI_WEBHOOK_URL=https://your-tunnel-url/webhooks/vapi
   ```

### Local Webhook Testing

Vapi needs a public URL for webhooks. Use cloudflared:

```bash
# Start a tunnel to LocalStack
cloudflared tunnel --url http://localhost:4566

# Use the generated URL (e.g., https://random.trycloudflare.com)
# Set VAPI_WEBHOOK_URL to this URL + /webhooks/vapi
```

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
