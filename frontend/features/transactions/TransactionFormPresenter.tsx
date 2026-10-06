"use client";

import { useEffect, useState } from "react";
import { toISODate } from "@/lib/format";
import { MAX_AMOUNT_ORE, MIN_AMOUNT_ORE, parseKronorToOre } from "@/lib/money";
import { useCreateTag, useCreateTransaction } from "@/models/useTransactions";
import type { Category, Tag, TagColor } from "@/types/transaction";
import TransactionFormView, { type FormState } from "./TransactionFormView";

// sessionStorage keeps a half-filled form across a refresh, and forgets it when the tab is closed
const DRAFT_KEY = "arca.transactionDraft";

const emptyForm = (): FormState => ({
  amount: "",
  date: toISODate(new Date()),
  description: "",
  categoryId: "",
  subcategoryId: "",
  tagIds: [],
  repeat: false,
  dayOfMonth: "",
});

const dayOfDate = (date: string) => Number(date.slice(8, 10)) || 1;

/** The saved draft, with anything that no longer exists (a deleted category or tag) dropped. */
function restoreDraft(categories: Category[], tags: Tag[]): FormState {
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
      tagIds: (saved.tagIds ?? []).filter((id) => tags.some((tag) => tag.id === id)),
    };
  } catch {
    return fresh;
  }
}

interface TransactionFormPresenterProps {
  categories: Category[];
  tags: Tag[];
}

export default function TransactionFormPresenter({ categories, tags }: TransactionFormPresenterProps) {
  // Only rendered once the page has loaded the categories, so reading sessionStorage here is safe
  const [form, setForm] = useState<FormState>(() => restoreDraft(categories, tags));
  const [error, setError] = useState<string | null>(null);
  const createTransaction = useCreateTransaction();
  const createTag = useCreateTag();

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      // Storage can be blocked, the form still works without a draft
    }
  }, [form]);

  const update = (changes: Partial<FormState>) => setForm((previous) => ({ ...previous, ...changes }));

  async function handleSubmit() {
    const amount = parseKronorToOre(form.amount);
    if (amount === null) return setError("Enter an amount like 91,20.");
    if (amount < MIN_AMOUNT_ORE || amount > MAX_AMOUNT_ORE) {
      return setError("The amount must be between 1 kr and 1 000 000 kr.");
    }
    if (!form.date) return setError("Pick a date.");
    const dayOfMonth = Number(form.dayOfMonth || dayOfDate(form.date));
    if (form.repeat && !(Number.isInteger(dayOfMonth) && dayOfMonth >= 1 && dayOfMonth <= 31)) {
      return setError("The day of the month must be between 1 and 31.");
    }

    setError(null);
    try {
      await createTransaction.mutateAsync({
        amount,
        date: form.date,
        description: form.description.trim() || undefined,
        categoryId: form.categoryId || null,
        subcategoryId: form.subcategoryId || null,
        tagIds: form.tagIds,
        repeatMonthly: form.repeat ? { dayOfMonth } : undefined,
      });
      setForm(emptyForm());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the transaction.");
    }
  }

  return (
    <TransactionFormView
      form={form}
      categories={categories}
      tags={tags}
      defaultDay={dayOfDate(form.date)}
      error={error}
      isSaving={createTransaction.isPending}
      onChange={update}
      onSubmit={handleSubmit}
      onCreateTag={(name: string, color: TagColor) => createTag.mutateAsync({ name, color })}
    />
  );
}
