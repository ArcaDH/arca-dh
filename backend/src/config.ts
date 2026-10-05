import "dotenv/config";
import { z } from "zod";

// Read and check the environment once at startup, so a missing variable fails fast with a message
const Env = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.url(),
  TOKEN_SECRET: z.string().min(1, "TOKEN_SECRET must be set"),
  CORS_ORIGIN: z.url().default("http://localhost:3000"),
});

export const config = Env.parse(process.env);
