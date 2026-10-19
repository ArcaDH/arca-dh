import { test, expect } from "@playwright/test";
import { API_URL, backendReachable, freshCredentials } from "../support/backend";

// The signup → login journey, driven entirely through the registration form.
//
// On successful registration the app logs the new user in automatically and
// redirects to the dashboard (see RegisterPresenter), so this single flow
// covers "signup then land authenticated".

test.describe("signup flow", () => {
  test.beforeEach(async ({}, testInfo) => {
    const reachable = await backendReachable();
    testInfo.skip(!reachable, `No e2e backend reachable at ${API_URL}. Set E2E_API_URL to run signup tests.`);
  });

  test("registers a new account through the form and lands authenticated", async ({ page, context }) => {
    const creds = freshCredentials();

    await page.goto("/register");
    await page.getByLabel("First name").fill(creds.firstName);
    await page.getByLabel("Last name").fill(creds.lastName);
    await page.getByLabel("Username").fill(creds.username);
    await page.getByLabel("Email").fill(creds.email);
    await page.getByLabel("Password").fill(creds.password);

    await page.getByRole("button", { name: "Create account" }).click();

    // Registration auto-logs-in and redirects to the app home.
    await expect(page).toHaveURL(/\/$/);
    // The authenticated sidebar (with the logout control) is present.
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();

    // The signed-up user has no plan yet, so the plan picker shows the empty state.
    await expect(page.getByText(/No plan yet/i)).toBeVisible();

    // Cleanup: the fresh user owns no plan, so there is nothing to tear down
    // beyond the (uniquely-named) user row, which the backend has no route to
    // delete. The unique suffix keeps runs from colliding.
    await context.clearCookies();
  });
});
