import { authedTest as test, expect } from "../support/fixtures";

// Full login + logout round-trip through the real UI and backend.

test.describe("login / logout flow", () => {
  test("logs in through the form and lands on the budget page", async ({ page, context, seeded }) => {
    // Drop the pre-seeded auth cookie so we go through the real login form.
    await context.clearCookies();

    await page.goto("/login");
    await page.getByLabel("Email").fill(seeded.email);
    await page.getByLabel("Password").fill(seeded.password);
    await page.getByRole("button", { name: "Log in" }).click();

    // Successful login redirects to the app home.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText(seeded.planName)).toBeVisible();
  });

  test("logs out and is redirected back to login", async ({ page, gotoAuthed }) => {
    await gotoAuthed("/");
    await expect(page).toHaveURL(/\/$/);

    await page.getByRole("button", { name: "Log out" }).click();

    // Logging out clears the auth cookie and sends us back to /login.
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("rejects wrong credentials with an error and stays on /login", async ({ page, context, seeded }) => {
    await context.clearCookies();

    await page.goto("/login");
    await page.getByLabel("Email").fill(seeded.email);
    await page.getByLabel("Password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("alert").or(page.getByText(/incorrect|invalid|failed/i))).toBeVisible();
  });
});
