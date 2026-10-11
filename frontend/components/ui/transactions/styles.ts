// Shared Tailwind class strings for the transactions page, so every form control looks the same.
// Buttons come from components/ui/button.tsx.

export const labelClass = "mb-1 block text-xs text-foreground/60";

export const inputClass =
  "w-full rounded-lg border border-foreground/20 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/20";

export const cardClass = "rounded-xl border border-foreground/10 bg-white p-4";

// For small icon-only buttons (month arrows, delete), which are too tight for the shared Button
export const iconButtonClass =
  "cursor-pointer rounded-lg p-1.5 text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground";
