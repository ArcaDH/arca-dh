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

  test("shows the seeded subcategory with its funding progress", async ({ page, gotoAuthed, seeded }) => {
    await gotoAuthed("/");

    // The seeded subcategory line renders with a selection checkbox.
    await expect(page.getByRole("checkbox", { name: `Select ${seeded.subcategoryName}` })).toBeVisible();
    // Its funding progress bar is labelled with the subcategory name.
    await expect(page.getByLabel(new RegExp(`^${seeded.subcategoryName}:`))).toBeVisible();
  });

  test("adds a subcategory with a monthly target", async ({ page, gotoAuthed, seeded }) => {
    await gotoAuthed("/");

    await page.getByRole("button", { name: `Add subcategory to ${seeded.categoryName}` }).click();

    const name = `Restaurants ${Date.now().toString(36).slice(-4)}`;
    await page.getByLabel("Name").fill(name);
    // The subcategory form exposes the optional monthly-target field.
    await page.getByLabel("Monthly target (optional)").fill("200");
    await page.getByRole("button", { name: "Save" }).click();

    // The new subcategory line appears, selectable like the others.
    await expect(page.getByRole("checkbox", { name: `Select ${name}` })).toBeVisible();
  });

  test("assigns money to a subcategory inline", async ({ page, gotoAuthed, seeded }) => {
    await gotoAuthed("/");

    // Click the assigned-amount cell for the seeded subcategory to edit it.
    await page
      .getByRole("button", { name: new RegExp(`Change what is assigned to ${seeded.subcategoryName}`) })
      .click();

    const input = page.getByRole("textbox", { name: `Assigned to ${seeded.subcategoryName}` });
    await input.fill("300");
    await input.press("Enter");

    // The row now shows the assigned amount (300 kr, formatted without decimals).
    await expect(
      page.getByRole("button", { name: new RegExp(`Change what is assigned to ${seeded.subcategoryName}, now.*300`) }),
    ).toBeVisible();
  });

  test("bulk-assigns money via the selection toolbar", async ({ page, gotoAuthed, seeded }) => {
    await gotoAuthed("/");

    // Selecting a subcategory reveals the bulk-action toolbar.
    await page.getByRole("checkbox", { name: `Select ${seeded.subcategoryName}` }).check();
    await expect(page.getByText("1 selected")).toBeVisible();

    await page.getByRole("textbox", { name: "Amount to assign to each selected category" }).fill("150");
    await page.getByRole("button", { name: "Assign to each" }).click();

    // After assigning, the subcategory's assigned amount reflects 150 kr.
    await expect(
      page.getByRole("button", { name: new RegExp(`Change what is assigned to ${seeded.subcategoryName}, now.*150`) }),
    ).toBeVisible();
  });
});
