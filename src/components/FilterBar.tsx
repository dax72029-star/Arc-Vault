import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type SortOption =
  | 'recently-added'
  | 'recently-watched'
  | 'newest'
  | 'oldest'
  | 'highest-rated'
  | 'lowest-rated'
  | 'longest'
  | 'shortest'
  | 'az'
  | 'za';

interface FilterBarProps {
  filters: string[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  sortOptions: { value: SortOption; label: string }[];
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export default function FilterBar({
  filters,
  activeFilter,
  onFilterChange,
  sortOptions,
  activeSort,
  onSortChange,
}: FilterBarProps) {
  const [showSort, setShowSort] = useState(false);

  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex gap-1.5 flex-1 overflow-x-auto scrollbar-hide pb-1">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
              activeFilter === filter
                ? 'bg-vault-accent text-white shadow-sm shadow-vault-accent/20'
                : 'bg-vault-surface-elevated text-vault-muted hover:text-vault-text hover:bg-vault-surface-hover border border-vault-border/30'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowSort(!showSort)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-medium bg-vault-surface-elevated text-vault-muted hover:text-vault-text hover:bg-vault-surface-hover transition-all duration-200 border border-vault-border/30"
        >
          {sortOptions.find((s) => s.value === activeSort)?.label || 'Sort'}
          <ChevronDown className="w-3 h-3" />
        </button>
        {showSort && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
            <div className="absolute right-0 top-full mt-1.5 z-20 vault-surface-elevated shadow-vault-xl py-1 min-w-[180px]">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setShowSort(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-[12px] transition-colors ${
                    activeSort === option.value
                      ? 'text-vault-accent bg-vault-accent-subtle'
                      : 'text-vault-muted hover:text-vault-text hover:bg-vault-surface-hover'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function sortItems<T extends { title: string; releaseYear: number; dateAdded: string; personalRating: number; runtime?: number; dateWatched?: string | null; dateCompleted?: string | null }>(
  items: T[],
  sort: SortOption
): T[] {
  const sorted = [...items];
  switch (sort) {
    case 'az':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'za':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case 'highest-rated':
      return sorted.sort((a, b) => b.personalRating - a.personalRating);
    case 'lowest-rated':
      return sorted.sort((a, b) => a.personalRating - b.personalRating);
    case 'newest':
      return sorted.sort((a, b) => b.releaseYear - a.releaseYear);
    case 'oldest':
      return sorted.sort((a, b) => a.releaseYear - b.releaseYear);
    case 'longest':
      return sorted.sort((a, b) => (b.runtime || 0) - (a.runtime || 0));
    case 'shortest':
      return sorted.sort((a, b) => (a.runtime || 0) - (b.runtime || 0));
    case 'recently-added':
      return sorted.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    case 'recently-watched':
      return sorted.sort((a, b) => {
        const dateA = a.dateWatched || a.dateCompleted || '';
        const dateB = b.dateWatched || b.dateCompleted || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
    default:
      return sorted;
  }
}
