"use client";

import { useEffect, useState } from "react";
import { toISODate } from "@/lib/format";
import { MAX_AMOUNT_KR, MIN_AMOUNT_KR, parseKr } from "@/lib/money";
import { useCreateExpense } from "@/models/useTransactions";
import type { CategoryWithSubcategories } from "@/types/category";
import TransactionFormView, { type FormState } from "./TransactionFormView";

// sessionStorage keeps a half-filled form across a refresh, and forgets it when the tab is closed
const DRAFT_KEY = "arca.transactionDraft.v2";

const emptyForm = (): FormState => ({
  amount: "",
  date: toISODate(new Date()),
  description: "",
  categoryId: "",
  subcategoryId: "",
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
  const createExpense = useCreateExpense(planId);

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
        amount,
        date: form.date,
        description: form.description.trim() || undefined,
        type: "EXPENSE",
        categoryId: form.categoryId,
        subcategoryId: form.subcategoryId || undefined,
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
      error={error}
      isSaving={createExpense.isPending}
      onChange={update}
      onSubmit={handleSubmit}
    />
  );
}
