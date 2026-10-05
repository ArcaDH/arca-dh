import { CookieOptions, Router } from "express";
import { config } from "../config";
import { TOKEN_COOKIE, TOKEN_LIFETIME_MS } from "../lib/token";
import { requireAuth } from "../middleware/requireAuth";
import { LoginInput, RegisterInput } from "../models/auth.model";
import { authService } from "../services/auth.service";

// httpOnly
const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: config.NODE_ENV === "production",
  path: "/",
};

export const authController = Router();

authController.post("/auth/register", async (req, res) => {
  res.status(201).json(await authService.register(RegisterInput.parse(req.body)));
});

authController.post("/auth/login", async (req, res) => {
  const { user, token } = await authService.login(LoginInput.parse(req.body));
  res.cookie(TOKEN_COOKIE, token, { ...cookieOptions, maxAge: TOKEN_LIFETIME_MS }).json(user);
});

authController.post("/auth/logout", (_req, res) => {
  res.clearCookie(TOKEN_COOKIE, cookieOptions).status(204).end();
});

authController.get("/auth/me", requireAuth, async (_req, res) => {
  res.json(await authService.getCurrentUser(res.locals.userId));
});
