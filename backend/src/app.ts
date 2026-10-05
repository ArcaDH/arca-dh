import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { config } from "./config";
import { authController } from "./controllers/auth.controller";
import { NotFoundError } from "./errors";
import { errorHandler } from "./middleware/errorHandler";

// The app is built separately from starting the server, so tests can use it without a port (15 points for api tests)
export const app = express()
  .use(cors({ origin: config.CORS_ORIGIN, credentials: true }))
  .use(express.json())
  .use(cookieParser())
  .use(authController)
  .use((req) => {
    throw new NotFoundError(`No endpoint ${req.method} ${req.path}.`);
  })
  .use(errorHandler);
