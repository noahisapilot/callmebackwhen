#!/bin/bash
set -e

echo "🚀 Setting up Call Me Back When..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js is required but not installed.${NC}" >&2; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo -e "${RED}pnpm is required but not installed. Run: npm install -g pnpm${NC}" >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker is required but not installed.${NC}" >&2; exit 1; }
command -v localstack >/dev/null 2>&1 || { echo -e "${RED}LocalStack CLI is required. Run: pip install localstack${NC}" >&2; exit 1; }
command -v cdklocal >/dev/null 2>&1 || { echo -e "${RED}cdklocal is required. Run: npm install -g aws-cdk-local aws-cdk${NC}" >&2; exit 1; }

# 1. Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pnpm install

# 2. Setup .env if not exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}Created .env - edit it if you need to change any values${NC}"
else
    echo -e "${GREEN}.env already exists${NC}"
fi

# 3. Start PostgreSQL
echo -e "${YELLOW}🐘 Starting PostgreSQL...${NC}"
docker compose up -d

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
until docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; do
    sleep 1
done
echo -e "${GREEN}PostgreSQL is ready${NC}"

# 4. Build packages
echo -e "${YELLOW}🔨 Building packages...${NC}"
pnpm build

# 5. Run migrations
echo -e "${YELLOW}🗃️  Running database migrations...${NC}"
pnpm db:migrate

# 6. Start LocalStack if not running
export MAIN_CONTAINER_NAME=callmebackwhen
if ! localstack status | grep -q "running"; then
    echo -e "${YELLOW}☁️  Starting LocalStack...${NC}"
    MAIN_CONTAINER_NAME=callmebackwhen localstack start -d
    sleep 5
else
    echo -e "${GREEN}LocalStack is already running${NC}"
fi

# 7. Bootstrap and deploy to LocalStack
echo -e "${YELLOW}🚀 Deploying to LocalStack...${NC}"
cd infra
cdklocal bootstrap
cdklocal deploy --all --require-approval never
cd ..

# Get the API URL
API_URL=$(cd infra && cdklocal outputs --all 2>/dev/null | grep -o 'http://[^"]*' | head -1 || echo "")

if [ -n "$API_URL" ]; then
    echo -e "${GREEN}API deployed at: ${API_URL}${NC}"

    # Update .env.local for frontend
    mkdir -p apps/web
    echo "NEXT_PUBLIC_API_URL=${API_URL}" > apps/web/.env.local
    echo -e "${GREEN}Updated apps/web/.env.local with API URL${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "To start the frontend:"
echo "  pnpm dev:web"
echo ""
echo "Then visit http://localhost:3000"
