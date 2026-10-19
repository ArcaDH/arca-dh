import { test, expect } from "@playwright/test";

// These tests exercise the proxy (middleware) auth guard in proxy.ts.
// Unauthenticated users are redirected to /login; the only public pages
// are /login and /register. No backend is required - the guard runs purely
// off the presence of the `auth_token` cookie.

const PROTECTED_ROUTES = ["/", "/transactions", "/goals", "/analytics", "/budget"];

test.describe("auth guard (unauthenticated)", () => {
  for (const path of PROTECTED_ROUTES) {
    test(`redirects protected route ${path} to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test("renders the login page content after redirect", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  });

  test("allows access to /login without a session", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  });

  test("allows access to /register without a session", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
  });
});

test.describe("auth guard (authenticated)", () => {
  test.beforeEach(async ({ context }) => {
    // Seed a fake auth cookie so the guard treats us as logged in.
    // The guard only checks for the cookie's presence, not its validity.
    await context.addCookies([
      {
        name: "auth_token",
        value: "fake-e2e-token",
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  test("redirects /login to the app when already logged in", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/$/);
  });

  test("redirects /register to the app when already logged in", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/\/$/);
  });
});
