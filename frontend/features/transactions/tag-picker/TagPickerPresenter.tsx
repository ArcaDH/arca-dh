"use client";

import { useState } from "react";
import { MAX_TAGS_PER_TRANSACTION, type NewTag, type Tag } from "@/types/tag";
import TagPickerView from "./TagPickerView";

interface TagPickerPresenterProps {
  allTags: Tag[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Saves a new tag and resolves with it. Rejects with an Error when it can't be saved. */
  onCreateTag: (input: NewTag) => Promise<Tag>;
  /** Asks to delete a tag for good, from every transaction. The page confirms first. */
  onDeleteTag: (tag: Tag) => void;
}

export default function TagPickerPresenter({
  allTags,
  selectedIds,
  onChange,
  onCreateTag,
  onDeleteTag,
}: TagPickerPresenterProps) {
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
    <TagPickerView
      selected={selected}
      available={available}
      selectedCount={selectedIds.length}
      maxTags={MAX_TAGS_PER_TRANSACTION}
      isFull={isFull}
      isCreating={isCreating}
      name={name}
      color={color}
      isSaving={isSaving}
      error={error}
      onAdd={(id) => onChange([...selectedIds, id])}
      onRemove={(id) => onChange(selectedIds.filter((selectedId) => selectedId !== id))}
      onDeleteTag={onDeleteTag}
      onStartCreate={() => setIsCreating(true)}
      onCancelCreate={closeCreate}
      onNameChange={setName}
      onColorChange={setColor}
      onCreate={() => void handleCreate()}
    />
  );
}
