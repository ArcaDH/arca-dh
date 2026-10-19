import { authedTest as test, expect } from "../support/fixtures";

// Authenticated budget-page flows against a seeded user + plan.

test.describe("budget page", () => {
  test("loads the seeded plan with its category instead of redirecting to login", async ({
    page,
    gotoAuthed,
    seeded,
  }) => {
    await gotoAuthed("/");

    // We stay on the app (not bounced to /login) because the auth cookie is set.
    await expect(page).toHaveURL(/\/$/);

    // The sidebar plan picker shows the seeded plan name.
    await expect(page.getByText(seeded.planName)).toBeVisible();

    // The budget table renders its headers and the seeded "Food" category.
    await expect(page.getByRole("columnheader", { name: "Category" })).toBeVisible();
    await expect(page.getByRole("cell", { name: `Add subcategory to ${seeded.categoryName}` })).toBeVisible();
  });

  test("adds a new category through the dialog", async ({ page, gotoAuthed }) => {
    await gotoAuthed("/");

    await expect(page.getByRole("button", { name: "New category" })).toBeVisible();
    await page.getByRole("button", { name: "New category" }).click();

    // The dialog exposes a Name field and a Save button.
    const name = `Transport ${Date.now().toString(36).slice(-4)}`;
    await page.getByLabel("Name").fill(name);
    await page.getByRole("button", { name: "Save" }).click();

    // The new category appears in the table.
    await expect(page.getByRole("cell", { name: `Add subcategory to ${name}` })).toBeVisible();
  });
});
