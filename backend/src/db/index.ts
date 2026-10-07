import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";

if (!process.env.DATABASE_URL) {
  console.log(`No database url specified...`);
}

export const db = drizzle(process.env.DATABASE_URL!);
