# arca-dh

Personal budgeting app. Monorepo with two apps:

- `backend/` — Express + TypeScript API (Drizzle ORM, PostgreSQL)
- `frontend/` — Next.js (App Router) + React + Tailwind

## Setup

Requires Node.js and Python (for pre-commit).

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Backend env: copy the template and fill in values
cd ../backend && cp .env.template .env

# 3. Install git hooks (run once, from the repo root)
cd .. && pre-commit install
```

## Running

### With Docker

```bash
docker compose up            # everything
docker compose up backend    # backend only (pulls in Postgres)
docker compose up frontend   # frontend only
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001 (Swagger at http://localhost:3001/api-docs)
- Adminer (DB UI): http://localhost:8080
- Postgres: localhost:5434

### Production build

Optimized standalone images, no source mounts. Requires `TOKEN_SECRET`:

```bash
TOKEN_SECRET=your-secret docker compose -f docker-compose.prod.yml up --build
```

### Without Docker

```bash
# Backend (needs a local Postgres and a filled-in .env)
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

## Formatting & hooks

Prettier formats both apps (each has its own `.prettierrc`). Hooks run on commit via [pre-commit](https://pre-commit.com).

```bash
npm run format        # write    (per app)
npm run format:check  # verify   (per app)
npm run lint          # frontend only
npm run typecheck     # per app

pre-commit run --all-files   # run every hook manually
```
