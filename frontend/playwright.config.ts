import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const BASE_URL = `http://localhost:${PORT}`;

// Where the frontend should send its API calls during e2e. Defaults to the
// local docker-compose backend. Authenticated specs use the same value to seed
// data (see e2e/support/backend.ts) and are skipped when it isn't reachable.
const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001";

export default defineConfig({
  testDir: "./e2e",
  // Fail the build on CI if test.only was left in the source.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel workers on CI for more deterministic runs.
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL: BASE_URL,
    // Capture a trace (with DOM snapshots) on CI retries to keep artifacts small.
    trace: "on-first-retry",
    // Always grab a screenshot so the UI/HTML report has a visual for every step.
    screenshot: "on",
    // Record video of each test; shown in the UI mode "Attachments"/trace panes.
    video: "on",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Start the Next.js dev server automatically so e2e runs are self-contained.
  // NEXT_PUBLIC_API_URL is inlined at dev-server start, so it must be set here
  // (before `next dev` boots) to point the app at the e2e backend.
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_API_URL: API_URL,
    },
  },
});
