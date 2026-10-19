"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/button";
import IconButton from "@/components/ui/IconButton";
import Input from "@/components/ui/input";
import { TAG_STYLES } from "@/lib/tags";
import { MAX_TAG_NAME_LENGTH, MAX_TAGS_PER_TRANSACTION, TAG_COLORS, type NewTag, type Tag } from "@/types/tag";
import TagChip from "./TagChip";

interface TagPickerProps {
  allTags: Tag[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Saves a new tag and resolves with it. Rejects with an Error when it can't be saved. */
  onCreateTag: (input: NewTag) => Promise<Tag>;
  /** Asks to delete a tag for good, from every transaction. The page confirms first. */
  onDeleteTag: (tag: Tag) => void;
}

export default function TagPicker({ allTags, selectedIds, onChange, onCreateTag, onDeleteTag }: TagPickerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<NewTag["color"]>("blue");
  const [error, setError] = useState<string | null>(null);

  const selected = selectedIds.map((id) => allTags.find((tag) => tag.id === id)).filter((tag): tag is Tag => !!tag);
  const available = allTags.filter((tag) => !selectedIds.includes(tag.id));
  const isFull = selectedIds.length >= MAX_TAGS_PER_TRANSACTION;

  function closeCreate() {
    setIsCreating(false);
    setName("");
    setError(null);
  }

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return setError("Enter a tag name.");

    setIsSaving(true);
    try {
      const tag = await onCreateTag({ name: trimmed, color });
      // A new tag is added to the transaction straight away, as long as there is room
      if (!isFull) onChange([...selectedIds, tag.id]);
      closeCreate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create the tag.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-foreground/60">
        <span>Tags</span>
        <span>
          {selectedIds.length} of {MAX_TAGS_PER_TRANSACTION}
        </span>
      </div>

      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((tag) => (
            <TagChip key={tag.id} tag={tag} onRemove={() => onChange(selectedIds.filter((id) => id !== tag.id))} />
          ))}
        </div>
      )}

      {available.length > 0 && (
        <ul aria-label="Your tags" className="mb-2 flex flex-wrap gap-x-2 gap-y-1">
          {available.map((tag) => (
            <li key={tag.id} className="group flex items-center">
              <button
                type="button"
                onClick={() => onChange([...selectedIds, tag.id])}
                disabled={isFull}
                aria-label={`Add tag ${tag.name}`}
                className="cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-default disabled:opacity-50"
              >
                <TagChip tag={tag} />
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
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              // This sits inside the transaction form, so Enter must not submit that
              if (event.key === "Enter") {
                event.preventDefault();
                void handleCreate();
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
                onClick={() => setColor(option)}
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
            <Button variant="ghost" size="sm" onClick={closeCreate}>
              Cancel
            </Button>
            <Button size="sm" isLoading={isSaving} onClick={() => void handleCreate()}>
              Add tag
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setIsCreating(true)} className="-ml-3">
          <Plus size={14} aria-hidden />
          New tag
        </Button>
      )}
    </div>
  );
}
