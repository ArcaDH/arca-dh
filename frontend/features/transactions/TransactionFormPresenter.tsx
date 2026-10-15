"use client";

import { useEffect, useState } from "react";
import { toISODate } from "@/lib/format";
import { MAX_AMOUNT_KR, MIN_AMOUNT_KR, parseKr, toBackendAmount } from "@/lib/money";
import { forGroups } from "@/lib/transactions";
import { useCreateTransaction } from "@/models/useTransactions";
import type { CategoryWithSubcategories } from "@/types/category";
import type { SavingsGoal } from "@/types/goal";
import type { ForOption } from "@/types/transaction";
import TransactionFormView, { type FormState } from "./TransactionFormView";

// sessionStorage keeps a half-filled form across a refresh, and forgets it when the tab is closed
const DRAFT_KEY = "arca.transactionDraft.v3";

const emptyForm = (): FormState => ({
  amount: "",
  direction: "out",
  date: toISODate(new Date()),
  description: "",
  forId: "",
});

function restoreDraft(options: ForOption[]): FormState {
  const fresh = emptyForm();
  try {
    const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null") as Partial<FormState> | null;
    if (!saved) return fresh;
    return {
      ...fresh,
      ...saved,
      forId: options.some((option) => option.id === saved.forId) ? (saved.forId ?? "") : "",
    };
  } catch {
    return fresh;
  }
}

interface TransactionFormPresenterProps {
  planId: string;
  categories: CategoryWithSubcategories[];
  goals: SavingsGoal[];
}

export default function TransactionFormPresenter({ planId, categories, goals }: TransactionFormPresenterProps) {
  const groups = forGroups(categories, goals);
  const options = groups.flatMap((group) => group.options);
  // Only rendered once the page has loaded the categories, so reading sessionStorage here is safe
  const [form, setForm] = useState<FormState>(() => restoreDraft(options));
  const [error, setError] = useState<string | null>(null);
  const createTransaction = useCreateTransaction(planId);

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
    const target = options.find((option) => option.id === form.forId)?.target;
    if (!target) return setError("Pick what it's for.");
    if (target.type === "SAVING" && form.direction === "in") {
      return setError("Taking money out of a savings goal isn't supported.");
    }

    setError(null);
    const description = form.description.trim() || undefined;
    try {
      await createTransaction.mutateAsync(
        target.type === "SAVING"
          ? // A saving is stored as a positive amount
            { ...target, amount, date: form.date, description }
          : // The user types a plain number, the backend wants money out as a negative amount
            { ...target, amount: toBackendAmount(amount, form.direction), date: form.date, description },
      );
      setForm(emptyForm());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the transaction.");
    }
  }

  return (
    <TransactionFormView
      form={form}
      groups={groups}
      error={error}
      isSaving={createTransaction.isPending}
      onChange={update}
      onSubmit={handleSubmit}
    />
  );
}
