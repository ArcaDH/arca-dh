"use client";

import { chosenTagIds, isFiltered, parseSortValue, sortValue, toggleTagFilter } from "@/lib/transactions";
import type { Tag } from "@/types/tag";
import { DEFAULT_FILTERS, type TransactionFilters } from "@/types/transaction";
import TransactionFiltersView from "./TransactionFiltersView";

interface TransactionFiltersPresenterProps {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
  categories: { id: string; name: string }[];
  /** All of the user's tags. */
  tags: Tag[];
}

export default function TransactionFiltersPresenter({
  filters,
  onChange,
  categories,
  tags,
}: TransactionFiltersPresenterProps) {
  const update = (changes: Partial<TransactionFilters>) => onChange({ ...filters, ...changes });

  return (
    <TransactionFiltersView
      search={filters.q}
      sort={sortValue(filters)}
      categoryId={filters.categoryId}
      minKr={filters.minKr}
      maxKr={filters.maxKr}
      categories={categories}
      tags={tags}
      selectedTagIds={filters.tagIds}
      tagMode={filters.tagMode}
      showTagMode={chosenTagIds(filters, tags).length > 1}
      isFiltered={isFiltered(filters)}
      onSearchChange={(q) => update({ q })}
      onSortChange={(value) => update(parseSortValue(value))}
      onCategoryChange={(categoryId) => update({ categoryId })}
      onMinChange={(minKr) => update({ minKr })}
      onMaxChange={(maxKr) => update({ maxKr })}
      onToggleTag={(id) => onChange(toggleTagFilter(filters, id))}
      onTagModeChange={(tagMode) => update({ tagMode })}
      onClear={() => onChange(DEFAULT_FILTERS)}
    />
  );
}
