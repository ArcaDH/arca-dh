This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## End-to-end tests

End-to-end tests are written with [Playwright](https://playwright.dev) and live in the `e2e/` directory.

The Playwright config (`playwright.config.ts`) automatically starts the Next.js dev
server before the run, so no separate server needs to be running.

```bash
# Install browsers once (first run only)
npx playwright install chromium

# Run the full suite (headless)
npm run test:e2e

# Run with the interactive UI
npm run test:e2e:ui

# Open the HTML report from the last run
npm run test:e2e:report
```

The current suite covers backend-independent flows: the auth-guard redirects
(driven by `proxy.ts`), and rendering, client-side validation, and navigation
of the login and register pages.

### Authenticated (seeded) tests

The specs in `e2e/authenticated/` drive real logged-in flows — loading the
budget page, adding a category and a transaction, creating a savings goal, and
the login/logout round-trip. Each test seeds its own fresh user, plan and
category through the backend API, so they need a running backend + database.

They are **skipped automatically** when no backend is reachable, so the rest of
the suite still runs without the stack.

To run them locally, start Postgres + the backend (the repo's docker-compose
dev stack), create the schema once, then point the tests at it:

```bash
# From the repo root — starts Postgres (:5434) and the backend (:3001)
docker compose up -d backend

# First time only: create the schema in the dev database
docker compose exec backend npm run db:push

# From frontend/ — run the whole suite against the local backend
E2E_API_URL=http://localhost:3001 npm run test:e2e
```

`E2E_API_URL` is passed through to the Next.js dev server as
`NEXT_PUBLIC_API_URL`, so the app and the seed helper both talk to the same
backend. Without it, the frontend would default to the hosted backend and the
authenticated tests would be skipped.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
