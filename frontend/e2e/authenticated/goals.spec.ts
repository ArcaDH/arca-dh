import { authedTest as test, expect } from "../support/fixtures";

// Authenticated savings-goal flows against a seeded user + plan.

test.describe("savings goals page", () => {
  test("starts with an empty-state and creates a goal", async ({ page, gotoAuthed }) => {
    await gotoAuthed("/goals");

    await expect(page).toHaveURL(/\/goals$/);
    await expect(page.getByRole("heading", { name: "Savings goals" })).toBeVisible();

    await page.getByRole("button", { name: "New savings goal" }).click();

    const name = `Trip ${Date.now().toString(36).slice(-4)}`;
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Target").fill("30000");
    await page.getByRole("button", { name: "Save" }).click();

    // The new goal card appears on the page.
    await expect(page.getByText(name)).toBeVisible();
  });
});
