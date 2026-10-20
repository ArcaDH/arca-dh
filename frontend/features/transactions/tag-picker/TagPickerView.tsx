import { Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/button";
import IconButton from "@/components/ui/IconButton";
import Input from "@/components/ui/input";
import { TAG_STYLES } from "@/lib/tags";
import { MAX_TAG_NAME_LENGTH, TAG_COLORS, type NewTag, type Tag } from "@/types/tag";
import TagChipView from "../tag-chip/TagChipView";

interface TagPickerViewProps {
  /** The tags on the transaction, as chips with a remove button. */
  selected: Tag[];
  /** The tags that can still be added. */
  available: Tag[];
  selectedCount: number;
  maxTags: number;
  /** No more tags can be added. */
  isFull: boolean;
  isCreating: boolean;
  name: string;
  color: NewTag["color"];
  isSaving: boolean;
  error: string | null;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onDeleteTag: (tag: Tag) => void;
  onStartCreate: () => void;
  onCancelCreate: () => void;
  onNameChange: (name: string) => void;
  onColorChange: (color: NewTag["color"]) => void;
  onCreate: () => void;
}

export default function TagPickerView({
  selected,
  available,
  selectedCount,
  maxTags,
  isFull,
  isCreating,
  name,
  color,
  isSaving,
  error,
  onAdd,
  onRemove,
  onDeleteTag,
  onStartCreate,
  onCancelCreate,
  onNameChange,
  onColorChange,
  onCreate,
}: TagPickerViewProps) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-foreground/60">
        <span>Tags</span>
        <span>
          {selectedCount} of {maxTags}
        </span>
      </div>

      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((tag) => (
            <TagChipView key={tag.id} tag={tag} onRemove={() => onRemove(tag.id)} />
          ))}
        </div>
      )}

      {available.length > 0 && (
        <ul aria-label="Your tags" className="mb-2 flex flex-wrap gap-x-2 gap-y-1">
          {available.map((tag) => (
            <li key={tag.id} className="group flex items-center">
              <button
                type="button"
                onClick={() => onAdd(tag.id)}
                disabled={isFull}
                aria-label={`Add tag ${tag.name}`}
                className="cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-default disabled:opacity-50"
              >
                <TagChipView tag={tag} />
              </button>
              <IconButton
                onClick={() => onDeleteTag(tag)}
                aria-label={`Delete tag ${tag.name}`}
                className="p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2 size={12} aria-hidden />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      {isFull && <p className="mb-2 text-xs text-foreground/60">That is the most tags one transaction can have.</p>}

      {isCreating ? (
        <div className="flex flex-col gap-2 rounded-lg border border-foreground/10 p-2">
          <Input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={(event) => {
              // This sits inside the transaction form, so Enter must not submit that
              if (event.key === "Enter") {
                event.preventDefault();
                onCreate();
              }
            }}
            maxLength={MAX_TAG_NAME_LENGTH}
            placeholder="Tag name"
            aria-label="New tag name"
            autoFocus
          />
          <div role="group" aria-label="Tag color" className="flex flex-wrap gap-1.5">
            {TAG_COLORS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onColorChange(option)}
                aria-label={option}
                aria-pressed={color === option}
                className={`size-6 cursor-pointer rounded-full ${TAG_STYLES[option].swatch} focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                  color === option ? "ring-2 ring-foreground ring-offset-2" : ""
                }`}
              />
            ))}
          </div>
          {error && (
            <p role="alert" className="text-xs text-accent">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onCancelCreate}>
              Cancel
            </Button>
            <Button size="sm" isLoading={isSaving} onClick={onCreate}>
              Add tag
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={onStartCreate} className="-ml-3">
          <Plus size={14} aria-hidden />
          New tag
        </Button>
      )}
    </div>
  );
}
