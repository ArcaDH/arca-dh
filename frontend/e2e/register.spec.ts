import { test, expect } from "@playwright/test";

// UI-level tests for the register page. No backend required.

test.describe("register page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("renders all registration fields and the submit button", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
    await expect(page.getByLabel("First name")).toBeVisible();
    await expect(page.getByLabel("Last name")).toBeVisible();
    await expect(page.getByLabel("Username")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  });

  test("keeps the user on /register when submitting an empty form (HTML validation)", async ({ page }) => {
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/register$/);
  });

  test("enforces the minimum password length via HTML validation", async ({ page }) => {
    await page.getByLabel("First name").fill("Ada");
    await page.getByLabel("Last name").fill("Lovelace");
    await page.getByLabel("Username").fill("ada");
    await page.getByLabel("Email").fill("ada@example.com");
    // 7 chars — below the minLength of 8.
    await page.getByLabel("Password").fill("short12");

    await page.getByRole("button", { name: "Create account" }).click();

    // Submission is blocked by the minLength constraint, so we stay put.
    await expect(page).toHaveURL(/\/register$/);
    const passwordValid = await page.getByLabel("Password").evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(passwordValid).toBe(false);
  });

  test("navigates back to the login page via the 'Log in' link", async ({ page }) => {
    await page.getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  });
});
