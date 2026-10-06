import { X } from "lucide-react";
import type { Tag, TagColor } from "@/lib/transactions";

// Full class names are written out so Tailwind can see them
export const TAG_BACKGROUND: Record<TagColor, string> = {
  teal: "bg-teal/15",
  mauve: "bg-mauve/30",
  crimson: "bg-crimson/15",
  midnight: "bg-midnight/10",
  charcoal: "bg-charcoal/10",
  amber: "bg-amber-400/25",
  orange: "bg-orange-400/20",
  emerald: "bg-emerald-500/15",
  violet: "bg-violet-500/15",
  pink: "bg-pink-500/15",
};

export const TAG_DOT: Record<TagColor, string> = {
  teal: "bg-teal",
  mauve: "bg-mauve",
  crimson: "bg-crimson",
  midnight: "bg-midnight",
  charcoal: "bg-charcoal",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  emerald: "bg-emerald-600",
  violet: "bg-violet-500",
  pink: "bg-pink-500",
};

interface TagChipProps {
  tag: Pick<Tag, "name" | "color">;
  onRemove?: () => void;
}

export default function TagChip({ tag, onRemove }: TagChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs whitespace-nowrap text-midnight ${TAG_BACKGROUND[tag.color]}`}
    >
      <span className={`size-1.5 rounded-full ${TAG_DOT[tag.color]}`} aria-hidden />
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove tag ${tag.name}`}
          className="cursor-pointer rounded-full text-midnight/60 hover:text-midnight"
        >
          <X size={12} aria-hidden />
        </button>
      )}
    </span>
  );
}
