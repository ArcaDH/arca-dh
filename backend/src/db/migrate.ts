import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import path from "path";

/**
 * Applies any pending Drizzle migrations, then exits.
 *
 * Runs on backend startup (see package.json `predev`/`prestart`) so a fresh
 * `docker compose up` or `npm run dev` brings the database schema up to date
 *
 * Reads DATABASE_URL from the environment (same variable the app uses). The
 * migrations SQL lives in ./drizzle, generated via `npm run db:generate`.
 */
async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Cannot run migrations: DATABASE_URL is not set.");
    process.exit(1);
  }

  const migrationsFolder = path.resolve(process.cwd(), "drizzle");

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    console.log("Running database migrations...");
    await migrate(db, { migrationsFolder });
    console.log("Database migrations complete.");
  } catch (error) {
    console.error("Database migration failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runMigrations();
