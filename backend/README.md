# Backend

Express + TypeScript API using Drizzle ORM and PostgreSQL.

See the [root README](../README.md) for the full setup, Docker, and script reference.

## Quick start

```bash
npm install
cp .env.template .env   # then fill in values
npm run dev             # starts on http://localhost:3001
```

Swagger docs: http://localhost:3001/api-docs

## Database (Drizzle ORM)

```bash
npm run db:generate   # generate migrations from schema
npm run db:migrate    # apply migrations
npm run db:push       # push schema directly (dev)
```

If `db:push` fails with `permission denied for schema public`, grant your DB user the needed privileges:

```sql
GRANT USAGE, CREATE ON SCHEMA public TO <user>;
GRANT ALL PRIVILEGES ON SCHEMA public TO <user>;
```
