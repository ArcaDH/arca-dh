# arca-dh

A personal budgeting app. Monorepo with a TypeScript API and a Next.js web client.

## Tech Stack

- **Backend:** Node.js, Express, TypeScript, Drizzle ORM, PostgreSQL
- **Frontend:** Next.js (App Router), React, TanStack Query, Tailwind CSS, Recharts
- **Tooling:** Docker Compose, Prettier, ESLint, Vitest, pre-commit

## Requirements

- Node.js
- Docker (optional, for containerized runs)
- Python with [pre-commit](https://pre-commit.com) (for git hooks)

## Setup

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Configure backend environment
cd ../backend && cp .env.template .env   # then fill in values

# Install git hooks (once, from repo root)
cd .. && pre-commit install
```

## Running

### With Docker

```bash
docker compose up            # everything
docker compose up backend    # backend + Postgres
docker compose up frontend   # frontend only
```

| Service      | URL                            |
| ------------ | ------------------------------ |
| Frontend     | http://localhost:3000          |
| Backend      | http://localhost:3001          |
| Swagger docs | http://localhost:3001/api-docs |
| Adminer (DB) | http://localhost:8080          |
| Postgres     | localhost:5434                 |

Production build (standalone images, requires `TOKEN_SECRET`):

```bash
TOKEN_SECRET=your-secret docker compose -f docker-compose.prod.yml up --build
```

### Without Docker

```bash
cd backend && npm run dev     # needs local Postgres and filled-in .env
cd frontend && npm run dev
```

## Scripts

Run per app (`backend/` or `frontend/`):

```bash
npm run format        # format with Prettier
npm run format:check  # verify formatting
npm run typecheck     # type-check
npm run lint          # frontend only
npm test              # backend only (Vitest)

pre-commit run --all-files   # run all hooks manually
```

### Frontend end-to-end tests (Playwright)

```bash
cd frontend
npx playwright install chromium   # first run only
npm run test:e2e                  # headless
npm run test:e2e:ui               # interactive UI
```

Authenticated specs need a running backend + database and are skipped when none
is reachable. To run them, start the dev stack and point the tests at it:

```bash
docker compose up -d backend              # Postgres + backend
docker compose exec backend npm run db:push   # first time only
cd frontend && E2E_API_URL=http://localhost:3001 npm run test:e2e
```

See [frontend/README.md](frontend/README.md) for details.

## License

Released under the [MIT License](LICENSE).
