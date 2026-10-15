"use client";

import { useEffect, useState } from "react";
import { toISODate } from "@/lib/format";
import { MAX_AMOUNT_KR, MIN_AMOUNT_KR, parseKr, toBackendAmount } from "@/lib/money";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useCreateTag, useDeleteTag, useTags } from "@/models/useTags";
import { useCreateExpense } from "@/models/useTransactions";
import type { CategoryWithSubcategories } from "@/types/category";
import type { Tag } from "@/types/tag";
import TransactionFormView, { type FormState } from "./TransactionFormView";

// sessionStorage keeps a half-filled form across a refresh, and forgets it when the tab is closed
const DRAFT_KEY = "arca.transactionDraft.v3";

const emptyForm = (): FormState => ({
  amount: "",
  direction: "out",
  date: toISODate(new Date()),
  description: "",
  categoryId: "",
  subcategoryId: "",
  tagIds: [],
});

/** The saved draft, with a category or subcategory that no longer exists dropped. */
function restoreDraft(categories: CategoryWithSubcategories[]): FormState {
  const fresh = emptyForm();
  try {
    const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null") as Partial<FormState> | null;
    if (!saved) return fresh;
    const category = categories.find((c) => c.id === saved.categoryId);
    const subcategory = category?.subcategories.find((s) => s.id === saved.subcategoryId);
    return {
      ...fresh,
      ...saved,
      categoryId: category?.id ?? "",
      subcategoryId: subcategory?.id ?? "",
      // The tags may not have loaded yet, so a tag that no longer exists is dropped later, when they have
      tagIds: Array.isArray(saved.tagIds) ? saved.tagIds : [],
    };
  } catch {
    return fresh;
  }
}

interface TransactionFormPresenterProps {
  planId: string;
  categories: CategoryWithSubcategories[];
}

export default function TransactionFormPresenter({ planId, categories }: TransactionFormPresenterProps) {
  // Only rendered once the page has loaded the categories, so reading sessionStorage here is safe
  const [form, setForm] = useState<FormState>(() => restoreDraft(categories));
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteTag, setPendingDeleteTag] = useState<Tag | null>(null);
  const createExpense = useCreateExpense(planId);
  const tags = useTags();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();

  // A tag that was deleted (maybe in another tab) can still be in the draft, so it is dropped here
  const knownTags = tags.data ?? [];
  const tagIds = tags.data ? form.tagIds.filter((id) => knownTags.some((tag) => tag.id === id)) : form.tagIds;

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      // Storage can be blocked, the form still works without a draft
    }
  }, [form]);

  const update = (changes: Partial<FormState>) => setForm((previous) => ({ ...previous, ...changes }));

  async function handleSubmit() {
    const amount = parseKr(form.amount);
    if (amount === null) return setError("Enter an amount like 91,20.");
    if (amount < MIN_AMOUNT_KR || amount > MAX_AMOUNT_KR) {
      return setError("The amount must be between 1 kr and 1 000 000 kr.");
    }
    if (!form.date) return setError("Pick a date.");
    if (!form.categoryId) return setError("Pick a category.");

    setError(null);
    try {
      await createExpense.mutateAsync({
        // The user types a plain number, the backend wants money out as a negative amount
        amount: toBackendAmount(amount, form.direction),
        date: form.date,
        description: form.description.trim() || undefined,
        type: "EXPENSE",
        categoryId: form.categoryId,
        subcategoryId: form.subcategoryId || undefined,
        tagIds,
      });
      setForm(emptyForm());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the transaction.");
    }
  }

  function confirmDeleteTag() {
    if (!pendingDeleteTag) return;
    deleteTag.mutate(pendingDeleteTag.id, {
      onSuccess: () => setError(null),
      onError: (e) => setError(e.message),
      onSettled: () => setPendingDeleteTag(null),
    });
  }

  return (
    <>
      <TransactionFormView
        form={{ ...form, tagIds }}
        categories={categories}
        tags={knownTags}
        error={error}
        isSaving={createExpense.isPending}
        onChange={update}
        onCreateTag={createTag.mutateAsync}
        onDeleteTag={setPendingDeleteTag}
        onSubmit={handleSubmit}
      />
      {pendingDeleteTag && (
        <ConfirmDialog
          title={`Delete the tag "${pendingDeleteTag.name}"?`}
          onCancel={() => setPendingDeleteTag(null)}
          actions={[{ label: "Delete", danger: true, onClick: confirmDeleteTag }]}
        >
          It is removed from every transaction that has it. The transactions themselves are kept.
        </ConfirmDialog>
      )}
    </>
  );
}
