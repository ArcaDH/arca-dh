"use client";

import { Search } from "lucide-react";
import Button from "@/components/ui/button";
import { inputClass } from "@/components/ui/transactions/styles";
import { DEFAULT_FILTERS, type TransactionFilters } from "@/types/transaction";

const SORT_OPTIONS = [
  { value: "date:desc", label: "Newest first" },
  { value: "date:asc", label: "Oldest first" },
  { value: "amount:desc", label: "Highest amount" },
  { value: "amount:asc", label: "Lowest amount" },
] as const;

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
  categories: { id: string; name: string }[];
}

export default function TransactionFiltersBar({ filters, onChange, categories }: TransactionFiltersProps) {
  const update = (changes: Partial<TransactionFilters>) => onChange({ ...filters, ...changes });
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

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
          <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_FILTERS)}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
