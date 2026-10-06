"use client";

import { Repeat } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { cardClass, inputClass, labelClass, primaryButtonClass } from "@/components/ui/transactions/styles";
import { toISODate } from "@/lib/format";
import { MAX_AMOUNT_ORE, MIN_AMOUNT_ORE, parseKronorToOre } from "@/lib/money";
import { createTransaction, type Category, type Tag } from "@/lib/transactions";
import TagPicker from "./TagPicker";

interface FormState {
  amount: string;
  date: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  tagIds: string[];
  repeat: boolean;
  dayOfMonth: string;
}

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

interface TransactionFormProps {
  categories: Category[];
  tags: Tag[];
  onSaved: () => void;
  onTagCreated: () => void;
}

export default function TransactionForm({ categories, tags, onSaved, onTagCreated }: TransactionFormProps) {
  const [form, setForm] = useState<FormState>(() => restoreDraft(categories, tags));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      // Storage can be blocked, the form still works without a draft
    }
  }, [form]);

  const update = (changes: Partial<FormState>) => setForm((previous) => ({ ...previous, ...changes }));
  const subcategories = categories.find((c) => c.id === form.categoryId)?.subcategories ?? [];
  const dayFromDate = Number(form.date.slice(8, 10)) || 1;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const amount = parseKronorToOre(form.amount);
    if (amount === null) return setError("Enter an amount like 91,20.");
    if (amount < MIN_AMOUNT_ORE || amount > MAX_AMOUNT_ORE) {
      return setError("The amount must be between 1 kr and 1 000 000 kr.");
    }
    if (!form.date) return setError("Pick a date.");
    const dayOfMonth = Number(form.dayOfMonth || dayFromDate);
    if (form.repeat && !(Number.isInteger(dayOfMonth) && dayOfMonth >= 1 && dayOfMonth <= 31)) {
      return setError("The day of the month must be between 1 and 31.");
    }

    setSaving(true);
    setError(null);
    try {
      await createTransaction({
        amount,
        date: form.date,
        description: form.description.trim() || undefined,
        categoryId: form.categoryId || null,
        subcategoryId: form.subcategoryId || null,
        tagIds: form.tagIds,
        repeatMonthly: form.repeat ? { dayOfMonth } : undefined,
      });
      setForm(emptyForm());
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the transaction.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${cardClass} flex flex-col gap-3`} noValidate>
      <div>
        <p className="text-xs text-foreground/60">Log an expense</p>
        <h2 className="font-heading text-xl font-semibold">New transaction</h2>
      </div>

      <div>
        <label htmlFor="amount" className={labelClass}>
          Amount
        </label>
        <div className="relative">
          <input
            id="amount"
            inputMode="decimal"
            placeholder="0,00"
            value={form.amount}
            onChange={(event) => update({ amount: event.target.value })}
            className={`${inputClass} pr-9 font-mono`}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-foreground/50">
            kr
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="date" className={labelClass}>
          Date
        </label>
        <input
          id="date"
          type="date"
          value={form.date}
          onChange={(event) => update({ date: event.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <input
          id="description"
          maxLength={500}
          placeholder="e.g. Farmers market"
          value={form.description}
          onChange={(event) => update({ description: event.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="category" className={labelClass}>
          Category
        </label>
        <select
          id="category"
          value={form.categoryId}
          onChange={(event) => update({ categoryId: event.target.value, subcategoryId: "" })}
          className={inputClass}
        >
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {categories.length === 0 && (
          <p className="mt-1 text-xs text-foreground/60">Add categories to your budget plan to pick one here.</p>
        )}
      </div>

      <div>
        <label htmlFor="subcategory" className={labelClass}>
          Subcategory
        </label>
        <select
          id="subcategory"
          value={form.subcategoryId}
          onChange={(event) => update({ subcategoryId: event.target.value })}
          disabled={subcategories.length === 0}
          className={`${inputClass} disabled:bg-foreground/5`}
        >
          <option value="">None</option>
          {subcategories.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>

      <TagPicker
        allTags={tags}
        selectedIds={form.tagIds}
        onChange={(tagIds) => update({ tagIds })}
        onTagCreated={onTagCreated}
      />

      <div className="flex items-center gap-2 text-sm">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={form.repeat}
            onChange={(event) => update({ repeat: event.target.checked })}
            className="size-4 accent-crimson"
          />
          <Repeat size={14} className="text-crimson" aria-hidden />
          Repeat monthly
        </label>
        {form.repeat && (
          <label className="ml-auto flex items-center gap-1.5 text-xs text-foreground/60">
            on day
            <input
              type="number"
              min={1}
              max={31}
              placeholder={String(dayFromDate)}
              value={form.dayOfMonth}
              onChange={(event) => update({ dayOfMonth: event.target.value })}
              className={`${inputClass} w-16 px-2 py-1`}
            />
          </label>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-crimson">
          {error}
        </p>
      )}

      <button type="submit" disabled={saving} className={primaryButtonClass}>
        {saving ? "Saving…" : "Add transaction"}
      </button>
    </form>
  );
}
