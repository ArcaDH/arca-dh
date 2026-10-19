import { authedTest as test, expect } from "../support/fixtures";

// Authenticated transaction flows against a seeded user + plan + category.

test.describe("transactions page", () => {
  test("shows the seeded transaction", async ({ page, gotoAuthed }) => {
    await gotoAuthed("/transactions");

    await expect(page).toHaveURL(/\/transactions$/);
    await expect(page.getByRole("heading", { name: "Transactions" })).toBeVisible();

    // The seeded expense description is listed.
    await expect(page.getByText("Seed groceries")).toBeVisible();
  });

  test("adds a new expense that then appears in the list", async ({ page, gotoAuthed, seeded }) => {
    await gotoAuthed("/transactions");

    // The "New transaction" form is enabled because the plan has a category.
    await expect(page.getByRole("heading", { name: "New transaction" })).toBeVisible();

    const description = `Lunch ${Date.now().toString(36).slice(-4)}`;
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-10`;

    // The form's Amount input vs. the filter min/max inputs: use exact label.
    await page.getByLabel("Amount", { exact: true }).fill("25,00");
    await page.getByLabel("Date").fill(date);
    await page.getByLabel("Description", { exact: true }).fill(description);
    // "For" is a grouped <select>; pick the seeded category.
    await page.getByLabel("For").selectOption({ label: seeded.categoryName });

    await page.getByRole("button", { name: "Add transaction" }).click();

    // The new transaction shows up in the transaction list.
    await expect(page.getByText(description)).toBeVisible();
  });
});
