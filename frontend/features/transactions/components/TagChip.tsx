import { X } from "lucide-react";
import { TAG_STYLES } from "@/lib/tags";
import type { Tag } from "@/types/tag";

interface TagChipProps {
  tag: Tag;
  /** When given, the chip shows a small remove button. */
  onRemove?: () => void;
}

export default function TagChip({ tag, onRemove }: TagChipProps) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TAG_STYLES[tag.color].chip}`}
    >
      <span className="truncate">{tag.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove tag ${tag.name}`}
          className="-mr-0.5 cursor-pointer rounded-full p-0.5 hover:bg-black/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <X size={12} aria-hidden />
        </button>
      )}
    </span>
  );
}
