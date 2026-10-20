import { Search } from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { TAG_STYLES } from "@/lib/tags";
import type { Tag } from "@/types/tag";
import type { TransactionFilters } from "@/types/transaction";

const SORT_OPTIONS = [
  { value: "date:desc", label: "Newest first" },
  { value: "date:asc", label: "Oldest first" },
  { value: "amount:desc", label: "Highest amount" },
  { value: "amount:asc", label: "Lowest amount" },
] as const;

const TAG_MODES = [
  { value: "any", label: "Any" },
  { value: "all", label: "All" },
] as const;

interface TransactionFiltersViewProps {
  search: string;
  /** What the sort dropdown shows, like "date:desc". */
  sort: string;
  categoryId: string;
  minKr: string;
  maxKr: string;
  categories: { id: string; name: string }[];
  /** All of the user's tags. The tag filter is left out when there are none. */
  tags: Tag[];
  selectedTagIds: string[];
  tagMode: TransactionFilters["tagMode"];
  /** The "Any / All" switch is only useful when more than one tag is chosen. */
  showTagMode: boolean;
  isFiltered: boolean;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onMinChange: (minKr: string) => void;
  onMaxChange: (maxKr: string) => void;
  onToggleTag: (id: string) => void;
  onTagModeChange: (mode: TransactionFilters["tagMode"]) => void;
  onClear: () => void;
}

export default function TransactionFiltersView({
  search,
  sort,
  categoryId,
  minKr,
  maxKr,
  categories,
  tags,
  selectedTagIds,
  tagMode,
  showTagMode,
  isFiltered,
  onSearchChange,
  onSortChange,
  onCategoryChange,
  onMinChange,
  onMaxChange,
  onToggleTag,
  onTagModeChange,
  onClear,
}: TransactionFiltersViewProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search size={15} className="pointer-events-none absolute top-2.5 left-3 text-foreground/40" aria-hidden />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search description"
            aria-label="Search description"
            className="pl-9"
          />
        </div>
        <Select value={sort} onChange={(event) => onSortChange(event.target.value)} aria-label="Sort" className="w-44">
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={categoryId}
          onChange={(event) => onCategoryChange(event.target.value)}
          aria-label="Category"
          className="w-44"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Input
          value={minKr}
          onChange={(event) => onMinChange(event.target.value)}
          inputMode="decimal"
          placeholder="Min kr"
          aria-label="Minimum amount in kronor"
          className="w-24"
        />
        <Input
          value={maxKr}
          onChange={(event) => onMaxChange(event.target.value)}
          inputMode="decimal"
          placeholder="Max kr"
          aria-label="Maximum amount in kronor"
          className="w-24"
        />
        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        )}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <ul aria-label="Filter by tag" className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const isOn = selectedTagIds.includes(tag.id);
              return (
                <li key={tag.id}>
                  <button
                    type="button"
                    onClick={() => onToggleTag(tag.id)}
                    aria-pressed={isOn}
                    className={`cursor-pointer rounded-full px-2 py-0.5 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${TAG_STYLES[tag.color].chip} ${
                      isOn ? "ring-2 ring-foreground/60" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    {tag.name}
                  </button>
                </li>
              );
            })}
          </ul>
          {showTagMode && (
            <div
              role="group"
              aria-label="Match any or all of the selected tags"
              className="inline-flex overflow-hidden rounded-lg border border-foreground/20 text-xs"
            >
              {TAG_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => onTagModeChange(mode.value)}
                  aria-pressed={tagMode === mode.value}
                  className={`cursor-pointer px-3 py-1 transition-colors ${
                    tagMode === mode.value ? "bg-primary text-white" : "text-foreground/70 hover:bg-foreground/5"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
