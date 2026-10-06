import { X } from "lucide-react";
import type { Tag, TagColor } from "@/types/transaction";

// Tags use Tailwind's built-in colors on purpose, so they don't change when the app theme does.
// Full class names are written out so Tailwind can see them.
export const TAG_BACKGROUND: Record<TagColor, string> = {
  blue: "bg-blue-500/15",
  teal: "bg-teal-500/15",
  emerald: "bg-emerald-500/15",
  amber: "bg-amber-400/25",
  orange: "bg-orange-400/20",
  red: "bg-red-500/15",
  pink: "bg-pink-500/15",
  violet: "bg-violet-500/15",
  slate: "bg-slate-500/15",
  lime: "bg-lime-500/20",
};

export const TAG_DOT: Record<TagColor, string> = {
  blue: "bg-blue-500",
  teal: "bg-teal-500",
  emerald: "bg-emerald-600",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  pink: "bg-pink-500",
  violet: "bg-violet-500",
  slate: "bg-slate-500",
  lime: "bg-lime-600",
};

interface TagChipProps {
  tag: Pick<Tag, "name" | "color">;
  onRemove?: () => void;
}

export default function TagChip({ tag, onRemove }: TagChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs whitespace-nowrap text-foreground ${TAG_BACKGROUND[tag.color]}`}
    >
      <span className={`size-1.5 rounded-full ${TAG_DOT[tag.color]}`} aria-hidden />
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove tag ${tag.name}`}
          className="cursor-pointer rounded-full text-foreground/60 hover:text-foreground"
        >
          <X size={12} aria-hidden />
        </button>
      )}
    </span>
  );
}
