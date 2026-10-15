import type { TagColor } from "@/types/tag";

// Tailwind only creates classes it can see written out in full, so every color has its own complete class names.
// Building a class like `bg-${color}-100` would leave the colors out of the stylesheet.
export const TAG_STYLES: Record<TagColor, { chip: string; swatch: string }> = {
  blue: {
    chip: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
    swatch: "bg-blue-500",
  },
  teal: {
    chip: "bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200",
    swatch: "bg-teal-500",
  },
  emerald: {
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
    swatch: "bg-emerald-500",
  },
  amber: {
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
    swatch: "bg-amber-500",
  },
  orange: {
    chip: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200",
    swatch: "bg-orange-500",
  },
  red: {
    chip: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200",
    swatch: "bg-red-500",
  },
  pink: {
    chip: "bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-200",
    swatch: "bg-pink-500",
  },
  violet: {
    chip: "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200",
    swatch: "bg-violet-500",
  },
  slate: {
    chip: "bg-slate-200 text-slate-800 dark:bg-slate-500/25 dark:text-slate-200",
    swatch: "bg-slate-500",
  },
  lime: {
    chip: "bg-lime-100 text-lime-800 dark:bg-lime-500/20 dark:text-lime-200",
    swatch: "bg-lime-500",
  },
};
