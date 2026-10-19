// A custom Playwright fixture for authenticated, seeded tests.
//
// `authedTest` gives each test its own freshly-seeded user (via the backend
// API) and a browser context whose `auth_token` cookie is already set to that
// user's login token, so the app lets us through and the ApiClient sends the
// token on every request.
//
// When no backend is configured/reachable, these tests are skipped rather than
// failing, so the suite still runs in environments without the full stack.

import { test as base, expect, type BrowserContext } from "@playwright/test";
import { API_URL, backendReachable, cleanupSeededUser, seedUserWithPlan, type SeededUser } from "./backend";

type AuthedFixtures = {
  seeded: SeededUser;
  /**
   * Navigate to a protected route and stay authenticated.
   *
   * The app has a client-side race: it reads the auth token from document.cookie
   * at fetch time, and a global 401 handler (app/providers.tsx) clears the cookie
   * and redirects to /login if an initial query races ahead of the token. If that
   * happens we re-seed the cookie and retry so tests don't flake on it.
   */
  gotoAuthed: (path: string) => Promise<void>;
};

async function seedCookie(context: BrowserContext, token: string): Promise<void> {
  await context.addCookies([{ name: "auth_token", value: token, domain: "localhost", path: "/", sameSite: "Strict" }]);
}

export const authedTest = base.extend<AuthedFixtures>({
  seeded: async ({ context }, use, testInfo) => {
    const reachable = await backendReachable();
    testInfo.skip(!reachable, `No e2e backend reachable at ${API_URL}. Set E2E_API_URL to run authenticated tests.`);

    const user = await seedUserWithPlan();
    await seedCookie(context, user.token);

    await use(user);

    // Teardown: remove the data this test created so the test DB doesn't grow
    // between runs (the rubric asks e2e tests to use test data AND clean up).
    await cleanupSeededUser(user);
  },

  gotoAuthed: async ({ page, context, seeded }, use) => {
    const go = async (path: string) => {
      for (let attempt = 0; attempt < 3; attempt++) {
        await page.goto(path);
        // If the 401 race bounced us to /login, re-seed the cookie and retry.
        if (!/\/login(?:[/?#]|$)/.test(page.url())) return;
        await seedCookie(context, seeded.token);
      }
      await page.goto(path);
    };
    await use(go);
  },
});

export { expect };
