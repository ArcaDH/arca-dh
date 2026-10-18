"use client";

import { useEffect, useState } from "react";
import { toISODate } from "@/lib/format";
import { dayOfDate, parseDayOfMonth } from "@/lib/monthly";
import { MAX_AMOUNT_KR, MIN_AMOUNT_KR, parseKr, toBackendAmount } from "@/lib/money";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { forGroups } from "@/lib/transactions";
import { useCreateTag, useDeleteTag, useTags } from "@/models/useTags";
import { useCreateTransaction } from "@/models/useTransactions";
import type { CategoryWithSubcategories } from "@/types/category";
import type { SavingsGoal } from "@/types/goal";
import type { Tag } from "@/types/tag";
import type { ForOption } from "@/types/transaction";
import TransactionFormView, { type FormState } from "./TransactionFormView";

// sessionStorage keeps a half-filled form across a refresh, and forgets it when the tab is closed
const DRAFT_KEY = "arca.transactionDraft.v5";

const emptyForm = (): FormState => ({
  amount: "",
  direction: "out",
  date: toISODate(new Date()),
  description: "",
  forId: "",
  tagIds: [],
  repeat: false,
  repeatDay: "",
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
      // The tags may not have loaded yet, so a tag that no longer exists is dropped later, when they have
      tagIds: Array.isArray(saved.tagIds) ? saved.tagIds : [],
      repeat: saved.repeat === true,
      repeatDay: typeof saved.repeatDay === "string" ? saved.repeatDay : "",
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
  const [pendingDeleteTag, setPendingDeleteTag] = useState<Tag | null>(null);
  const createTransaction = useCreateTransaction(planId);
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

  // Only an expense with money out can repeat monthly, a savings goal or money in can't. Until something is chosen
  // under "For" the switch is shown, so it is easy to find.
  const target = options.find((option) => option.id === form.forId)?.target;
  const canRepeat = form.direction === "out" && target?.type !== "SAVING";
  // The day typed, or the day of the date when nothing is typed
  const repeatDay = form.repeatDay.trim() ? parseDayOfMonth(form.repeatDay) : form.date ? dayOfDate(form.date) : null;

  async function handleSubmit() {
    const amount = parseKr(form.amount);
    if (amount === null) return setError("Enter an amount like 91,20.");
    if (amount < MIN_AMOUNT_KR || amount > MAX_AMOUNT_KR) {
      return setError("The amount must be between 1 kr and 1 000 000 kr.");
    }
    if (!form.date) return setError("Pick a date.");
    if (!target) return setError("Pick what it's for.");
    if (target.type === "SAVING" && form.direction === "in") {
      return setError("Taking money out of a savings goal isn't supported.");
    }

    if (form.repeat && canRepeat && repeatDay === null) return setError("Pick a day of the month from 1 to 31.");

    setError(null);
    const description = form.description.trim() || undefined;
    const repeatMonthly = form.repeat && canRepeat && repeatDay !== null ? { dayOfMonth: repeatDay } : undefined;
    try {
      await createTransaction.mutateAsync(
        target.type === "SAVING"
          ? // A saving is stored as a positive amount
            { ...target, amount, date: form.date, description, tagIds }
          : // The user types a plain number, the backend wants money out as a negative amount
            {
              ...target,
              amount: toBackendAmount(amount, form.direction),
              date: form.date,
              description,
              tagIds,
              repeatMonthly,
            },
      );
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
        groups={groups}
        tags={knownTags}
        canRepeat={canRepeat}
        repeatDay={repeatDay}
        error={error}
        isSaving={createTransaction.isPending}
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
