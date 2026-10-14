import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import path from "path";

/**
 * Applies any pending Drizzle migrations, then exits.
 *
 * Runs on backend startup (see package.json `predev` / `start`) so a fresh
 * `docker compose up` or `npm run dev` brings the database schema up to date
 * automatically — no manual `drizzle-kit` step required.
 *
 * Reads DATABASE_URL from the environment (same variable the app uses). The
 * migrations SQL lives in ./drizzle, generated via `npm run db:generate`.
 */
async function runMigrations(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Cannot run migrations: DATABASE_URL is not set.");
  }

  // The compiled app runs from dist/, but the SQL migrations stay at the
  // project root under ./drizzle, so resolve relative to the working directory.
  const migrationsFolder = path.resolve(process.cwd(), "drizzle");

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    console.log("Running database migrations...");
    await migrate(db, { migrationsFolder });
    console.log("Database migrations complete.");
  } finally {
    await pool.end();
  }
}

runMigrations().catch((error) => {
  // Exit non-zero so startup aborts instead of running the server against an
  // un-migrated database (the container will restart and retry).
  console.error("Database migration failed:", error);
  process.exitCode = 1;
});
