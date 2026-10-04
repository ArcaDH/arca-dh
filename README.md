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

```bash
# Backend (http://localhost:3000, Swagger at /api-docs)
cd backend && docker compose up -d   # Postgres + Adminer
npm run dev

# Frontend (http://localhost:3000)
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
