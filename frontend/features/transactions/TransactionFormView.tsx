import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Label from "@/components/ui/label";
import Select from "@/components/ui/select";
import TagPicker from "@/components/transactions/TagPicker";
import type { CategoryWithSubcategories } from "@/types/category";
import type { NewTag, Tag } from "@/types/tag";
import type { MoneyDirection } from "@/types/transaction";

export type FormState = {
  amount: string;
  direction: MoneyDirection;
  date: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  tagIds: string[];
};

const DIRECTIONS: { value: MoneyDirection; label: string }[] = [
  { value: "out", label: "− Money out" },
  { value: "in", label: "+ Money in" },
];

interface TransactionFormViewProps {
  form: FormState;
  categories: CategoryWithSubcategories[];
  /** All of the user's tags, for the picker. */
  tags: Tag[];
  error: string | null;
  isSaving: boolean;
  onChange: (changes: Partial<FormState>) => void;
  onCreateTag: (input: NewTag) => Promise<Tag>;
  onDeleteTag: (tag: Tag) => void;
  onSubmit: () => void;
}

export default function TransactionFormView(props: TransactionFormViewProps) {
  const { form, categories, tags, error, isSaving, onChange } = props;
  const subcategories = categories.find((c) => c.id === form.categoryId)?.subcategories ?? [];

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        props.onSubmit();
      }}
      noValidate
    >
      <Card className="flex flex-col gap-3">
        <div>
          <p className="text-xs text-foreground/60">Log a transaction</p>
          <h2 className="font-heading text-xl font-semibold">New transaction</h2>
        </div>

        <div>
          <Label htmlFor="amount">Amount</Label>
          <div
            role="group"
            aria-label="Money out or money in"
            className="mb-2 inline-flex overflow-hidden rounded-lg border border-foreground/20 text-xs"
          >
            {DIRECTIONS.map((direction) => (
              <button
                key={direction.value}
                type="button"
                onClick={() => onChange({ direction: direction.value })}
                aria-pressed={form.direction === direction.value}
                className={`cursor-pointer px-3 py-1.5 transition-colors ${
                  form.direction === direction.value
                    ? "bg-primary text-white"
                    : "text-foreground/70 hover:bg-foreground/5"
                }`}
              >
                {direction.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Input
              id="amount"
              inputMode="decimal"
              placeholder="0,00"
              value={form.amount}
              onChange={(event) => onChange({ amount: event.target.value })}
              className="pr-9 font-mono"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-foreground/50">
              kr
            </span>
          </div>
        </div>

        <div>
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={form.date} onChange={(event) => onChange({ date: event.target.value })} />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            maxLength={500}
            placeholder="e.g. Farmers market"
            value={form.description}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            value={form.categoryId}
            onChange={(event) => onChange({ categoryId: event.target.value, subcategoryId: "" })}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          {categories.length === 0 && (
            <p className="mt-1 text-xs text-foreground/60">Add categories to your budget plan to log a transaction.</p>
          )}
        </div>

        <div>
          <Label htmlFor="subcategory">Subcategory</Label>
          <Select
            id="subcategory"
            value={form.subcategoryId}
            onChange={(event) => onChange({ subcategoryId: event.target.value })}
            disabled={subcategories.length === 0}
          >
            <option value="">None</option>
            {subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </Select>
        </div>

        <TagPicker
          allTags={tags}
          selectedIds={form.tagIds}
          onChange={(tagIds) => onChange({ tagIds })}
          onCreateTag={props.onCreateTag}
          onDeleteTag={props.onDeleteTag}
        />

        {error && (
          <p role="alert" className="text-sm text-accent">
            {error}
          </p>
        )}

        <Button type="submit" isLoading={isSaving} disabled={categories.length === 0} className="w-full">
          {isSaving ? "Saving…" : "Add transaction"}
        </Button>
      </Card>
    </form>
  );
}
