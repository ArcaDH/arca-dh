import { test, expect } from "@playwright/test";
import { API_URL, backendReachable, deleteUserByCredentials, freshCredentials } from "../support/backend";

// The signup → onboarding → app journey
//
// A new account is logged in automatically and sent to the onboarding (/welcome),
// which every app page redirects to until it's finished. Finishing it creates the
// first budget plan and lands on the budget page.

test.describe("signup flow", () => {
  test.beforeEach(async ({}, testInfo) => {
    const reachable = await backendReachable();
    testInfo.skip(!reachable, `No e2e backend reachable at ${API_URL}. Set E2E_API_URL to run signup tests.`);
  });

  test("registers a new account, goes through the onboarding and lands on the budget", async ({ page, context }) => {
    const creds = freshCredentials();

    await page.goto("/register");
    await page.getByLabel("First name").fill(creds.firstName);
    await page.getByLabel("Last name").fill(creds.lastName);
    await page.getByLabel("Username").fill(creds.username);
    await page.getByLabel("Email").fill(creds.email);
    await page.getByLabel("Password").fill(creds.password);
    await page.getByRole("button", { name: "Create account" }).click();

    // Registration auto-logs-in and starts the onboarding.
    await expect(page).toHaveURL(/\/welcome$/);
    await expect(page.getByRole("heading", { name: "Let's set up your budget" })).toBeVisible();

    // The app stays closed until the onboarding is done.
    await page.goto("/transactions");
    await expect(page).toHaveURL(/\/welcome$/);

    // Step 1: Continue is only possible once there is an income.
    const continueButton = page.getByRole("button", { name: "Continue" });
    await expect(continueButton).toBeDisabled();
    await page.getByLabel("How much do you get each month, after tax?").fill("18500");
    await continueButton.click();

    // Step 2: keep the suggested picks and create the budget.
    await expect(page.getByRole("heading", { name: "Where does your money go?" })).toBeVisible();
    await page.getByRole("button", { name: "Create my budget" }).click();

    // Lands on the budget with the new plan selected and the picked categories in it.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
    await expect(page.getByText("My budget")).toBeVisible();
    await expect(page.getByText("Rent")).toBeVisible();

    // Finished: the onboarding is no longer reachable.
    await page.goto("/welcome");
    await expect(page).toHaveURL(/\/$/);

    // Cleanup: delete the user we just created (cascades any of their data).
    await context.clearCookies();
    await deleteUserByCredentials(creds.email, creds.password);
  });
});
