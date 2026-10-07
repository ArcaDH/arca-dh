import { sql } from "drizzle-orm";
import { hashPassword } from "../services/passwordService";
import { User } from "./schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres"; // adjust the path accordingly

export async function dbMock(db: NodePgDatabase<Record<string, never>>) {
  console.log("Mocking Data base started...");

  // Totally clear database and reset id generation
  await db.execute(sql`TRUNCATE TABLE public."User" RESTART IDENTITY CASCADE;`);

  console.log("Mocking Data base finished...");
}
