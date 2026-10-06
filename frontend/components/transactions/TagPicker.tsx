"use client";

import { useState } from "react";
import {
  createTag,
  MAX_TAG_NAME_LENGTH,
  MAX_TAGS_PER_TRANSACTION,
  TAG_COLORS,
  type Tag,
  type TagColor,
} from "@/lib/transactions";
import { ghostButtonClass, inputClass } from "@/components/ui/transactions/styles";
import TagChip, { TAG_DOT } from "./TagChip";

interface TagPickerProps {
  allTags: Tag[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Called after a new tag was saved, so the page can reload the tag list. */
  onTagCreated: () => void;
}

export default function TagPicker({ allTags, selectedIds, onChange, onTagCreated }: TagPickerProps) {
  const [createdHere, setCreatedHere] = useState<Tag[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<TagColor>("teal");
  const [error, setError] = useState<string | null>(null);

  // A tag created a moment ago may not be in `allTags` until the page has reloaded it
  const known = [...allTags, ...createdHere.filter((tag) => !allTags.some((t) => t.id === tag.id))];
  const selected = selectedIds.map((id) => known.find((tag) => tag.id === id)).filter((tag): tag is Tag => !!tag);
  const available = known.filter((tag) => !selectedIds.includes(tag.id));
  const full = selectedIds.length >= MAX_TAGS_PER_TRANSACTION;

  async function handleCreate() {
    if (!name.trim()) return setError("Enter a tag name.");
    try {
      const tag = await createTag({ name: name.trim(), color });
      setCreatedHere((previous) => [...previous, tag]);
      onChange([...selectedIds, tag.id]);
      onTagCreated();
      setName("");
      setCreating(false);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create the tag.");
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

      {!full && available.length > 0 && (
        <select
          value=""
          onChange={(event) => event.target.value && onChange([...selectedIds, event.target.value])}
          className={inputClass}
          aria-label="Add a tag"
        >
          <option value="">Add a tag…</option>
          {available.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      )}

      {full && <p className="text-xs text-foreground/60">That&apos;s the most tags a transaction can have.</p>}

      {!full && !creating && (
        <button type="button" onClick={() => setCreating(true)} className={`${ghostButtonClass} mt-1 -ml-2.5 text-xs`}>
          + New tag
        </button>
      )}

      {creating && (
        <div className="mt-2 rounded-lg border border-foreground/10 p-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={MAX_TAG_NAME_LENGTH}
            placeholder="Tag name"
            aria-label="New tag name"
            className={inputClass}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {TAG_COLORS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setColor(option)}
                aria-label={`Color ${option}`}
                aria-pressed={color === option}
                className={`size-6 cursor-pointer rounded-full ${TAG_DOT[option]} ${
                  color === option ? "ring-2 ring-foreground ring-offset-2" : ""
                }`}
              />
            ))}
          </div>
          {error && <p className="mt-2 text-xs text-crimson">{error}</p>}
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={handleCreate} className={`${ghostButtonClass} font-medium`}>
              Create tag
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setError(null);
              }}
              className={ghostButtonClass}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
