// Each category gets one of the six palette colors by its position in the plan's category list, in the same order
// as the analytics donut. Tailwind only creates classes it can see written out in full, so every color is spelled out.
const CATEGORY_STYLES = [
  { tint: "bg-primary/10 text-primary", ink: "text-primary", stripe: "bg-primary" }, // cobalt
  { tint: "bg-secondary/10 text-secondary", ink: "text-secondary", stripe: "bg-secondary" }, // plum
  { tint: "bg-accent/10 text-accent", ink: "text-accent", stripe: "bg-accent" }, // crimson
  { tint: "bg-success/10 text-success", ink: "text-success", stripe: "bg-success" }, // emerald
  { tint: "bg-warning/10 text-warning", ink: "text-warning", stripe: "bg-warning" }, // amber
  { tint: "bg-muted/10 text-muted", ink: "text-muted", stripe: "bg-muted" }, // slate
] as const;

const NO_CATEGORY = {
  tint: "bg-foreground/10 text-foreground/60",
  ink: "text-foreground/60",
  stripe: "bg-foreground/20",
};

/**
 * What a category looks like in lists: a tinted tile with the first letter of its name (`tint`, or on a white
 * background `ink` for just the letter's color) and a stripe along the row's edge (`stripe`).
 */
export function categoryLook(categories: { id: string; name: string }[], categoryId?: string | null) {
  const index = categories.findIndex((category) => category.id === categoryId);
  if (index === -1) return { ...NO_CATEGORY, initial: "•" };
  return {
    ...CATEGORY_STYLES[index % CATEGORY_STYLES.length],
    initial: categories[index].name.trim().charAt(0).toUpperCase() || "•",
  };
}
