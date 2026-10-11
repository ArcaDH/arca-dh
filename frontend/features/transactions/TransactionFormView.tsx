import Button from "@/components/ui/button";
import { cardClass, inputClass, labelClass } from "@/components/ui/transactions/styles";
import type { CategoryWithSubcategories } from "@/types/category";

export type FormState = {
  amount: string;
  date: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
};

interface TransactionFormViewProps {
  form: FormState;
  categories: CategoryWithSubcategories[];
  error: string | null;
  isSaving: boolean;
  onChange: (changes: Partial<FormState>) => void;
  onSubmit: () => void;
}

export default function TransactionFormView(props: TransactionFormViewProps) {
  const { form, categories, error, isSaving, onChange } = props;
  const subcategories = categories.find((c) => c.id === form.categoryId)?.subcategories ?? [];

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        props.onSubmit();
      }}
      className={`${cardClass} flex flex-col gap-3`}
      noValidate
    >
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
            onChange={(event) => onChange({ amount: event.target.value })}
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
          onChange={(event) => onChange({ date: event.target.value })}
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
          onChange={(event) => onChange({ description: event.target.value })}
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
          onChange={(event) => onChange({ categoryId: event.target.value, subcategoryId: "" })}
          className={inputClass}
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {categories.length === 0 && (
          <p className="mt-1 text-xs text-foreground/60">Add categories to your budget plan to log an expense.</p>
        )}
      </div>

      <div>
        <label htmlFor="subcategory" className={labelClass}>
          Subcategory
        </label>
        <select
          id="subcategory"
          value={form.subcategoryId}
          onChange={(event) => onChange({ subcategoryId: event.target.value })}
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

      {error && (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      )}

      <Button type="submit" isLoading={isSaving} disabled={categories.length === 0} className="w-full">
        {isSaving ? "Saving…" : "Add transaction"}
      </Button>
    </form>
  );
}
