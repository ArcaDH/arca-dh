"use client";

import { Search } from "lucide-react";
import { ghostButtonClass, inputClass } from "@/components/ui/transactions/styles";
import { DEFAULT_FILTERS, type Category, type Tag, type TransactionFilters } from "@/lib/transactions";
import TagChip from "./TagChip";

const SORT_OPTIONS = [
  { value: "date:desc", label: "Newest first" },
  { value: "date:asc", label: "Oldest first" },
  { value: "amount:desc", label: "Highest amount" },
  { value: "amount:asc", label: "Lowest amount" },
] as const;

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
  categories: Category[];
  tags: Tag[];
}

export default function TransactionFiltersBar({ filters, onChange, categories, tags }: TransactionFiltersProps) {
  const update = (changes: Partial<TransactionFilters>) => onChange({ ...filters, ...changes });
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  const toggleTag = (id: string) =>
    update({ tagIds: filters.tagIds.includes(id) ? filters.tagIds.filter((t) => t !== id) : [...filters.tagIds, id] });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search size={15} className="pointer-events-none absolute top-2.5 left-3 text-foreground/40" aria-hidden />
          <input
            value={filters.q}
            onChange={(event) => update({ q: event.target.value })}
            placeholder="Search description"
            aria-label="Search description"
            className={`${inputClass} pl-9`}
          />
        </div>
        <select
          value={`${filters.sort}:${filters.dir}`}
          onChange={(event) => {
            const [sort, dir] = event.target.value.split(":") as [
              TransactionFilters["sort"],
              TransactionFilters["dir"],
            ];
            update({ sort, dir });
          }}
          aria-label="Sort"
          className={`${inputClass} w-44`}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.categoryId}
          onChange={(event) => update({ categoryId: event.target.value })}
          aria-label="Category"
          className={`${inputClass} w-44`}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          value={filters.minKr}
          onChange={(event) => update({ minKr: event.target.value })}
          inputMode="decimal"
          placeholder="Min kr"
          aria-label="Minimum amount in kronor"
          className={`${inputClass} w-24 font-mono`}
        />
        <input
          value={filters.maxKr}
          onChange={(event) => update({ maxKr: event.target.value })}
          inputMode="decimal"
          placeholder="Max kr"
          aria-label="Maximum amount in kronor"
          className={`${inputClass} w-24 font-mono`}
        />
        {isFiltered && (
          <button type="button" onClick={() => onChange(DEFAULT_FILTERS)} className={ghostButtonClass}>
            Clear filters
          </button>
        )}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-foreground/60">Tags</span>
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              aria-pressed={filters.tagIds.includes(tag.id)}
              className={`cursor-pointer rounded-full ring-offset-1 ${
                filters.tagIds.includes(tag.id) ? "ring-2 ring-midnight" : "opacity-70 hover:opacity-100"
              }`}
            >
              <TagChip tag={tag} />
            </button>
          ))}
          {filters.tagIds.length > 1 && (
            <span className="ml-2 inline-flex overflow-hidden rounded-full border border-foreground/20 text-xs">
              {(["any", "all"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => update({ tagMode: mode })}
                  aria-pressed={filters.tagMode === mode}
                  className={`cursor-pointer px-2.5 py-0.5 ${
                    filters.tagMode === mode ? "bg-midnight text-cream" : "text-foreground/70"
                  }`}
                >
                  {mode === "any" ? "Any tag" : "All tags"}
                </button>
              ))}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
