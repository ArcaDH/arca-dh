import { test, expect } from "@playwright/test";

// UI-level tests for the login page. These do not hit the backend - they
// verify rendering, client-side validation, and navigation between the
// auth pages.

test.describe("login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders the email and password fields and submit button", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  });

  test("keeps the user on /login when submitting an empty form (HTML validation)", async ({ page }) => {
    await page.getByRole("button", { name: "Log in" }).click();
    // Required fields block submission, so we stay on the login page.
    await expect(page).toHaveURL(/\/login$/);
  });

  test("lets the user type into the fields", async ({ page }) => {
    const email = page.getByLabel("Email");
    const password = page.getByLabel("Password");

    await email.fill("user@example.com");
    await password.fill("super-secret");

    await expect(email).toHaveValue("user@example.com");
    await expect(password).toHaveValue("super-secret");
  });

  test("navigates to the register page via the 'Create one' link", async ({ page }) => {
    await page.getByRole("link", { name: "Create one" }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
  });
});
