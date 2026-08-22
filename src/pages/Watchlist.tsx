import { useState, useMemo } from 'react';
import { ListTodo, Search } from 'lucide-react';
import { useTrackerContext } from '../hooks/useTrackerContext';
import type { TrackerMovie, TrackerSeries } from '../types';
import TitleCard from '../components/TitleCard';
import FilterBar, { sortItems, type SortOption } from '../components/FilterBar';
import EmptyState from '../components/EmptyState';

type FilterType = 'All' | 'Movies' | 'Series' | 'Pending' | 'Watching';

const defaultSort: SortOption = 'recently-added';
const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'recently-added', label: 'Recently Added' },
  { value: 'highest-rated', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
];

export default function Watchlist() {
  const { items } = useTrackerContext();
  const [filter, setFilter] = useState<FilterType>('All');
  const [sort, setSort] = useState<SortOption>(defaultSort);

  const watchlist = useMemo(() => {
    let filtered = items.filter((i) => {
      if (i.type === 'movie') return i.status === 'pending';
      return i.status === 'pending' || i.status === 'watching';
    });

    switch (filter) {
      case 'Movies':
        filtered = filtered.filter((i) => i.type === 'movie');
        break;
      case 'Series':
        filtered = filtered.filter((i) => i.type === 'tv');
        break;
      case 'Pending':
        filtered = filtered.filter((i) => i.status === 'pending');
        break;
      case 'Watching':
        filtered = filtered.filter((i) => i.status === 'watching');
        break;
    }

    return sortItems(filtered as (TrackerMovie | TrackerSeries)[], sort);
  }, [items, filter, sort]);

  const pendingCount = items.filter(
    (i) =>
      (i.type === 'movie' && i.status === 'pending') ||
      (i.type === 'tv' && i.status === 'pending')
  ).length;
  const watchingCount = items.filter(
    (i) => i.type === 'tv' && i.status === 'watching'
  ).length;

  if (pendingCount + watchingCount === 0) {
    return (
      <div>
        <div className="mb-8 md:mb-10">
          <h1 className="text-h1 font-display font-bold text-vault-text tracking-tight">Watchlist</h1>
          <p className="text-body-sm text-vault-muted mt-1">0 titles to watch</p>
        </div>
        <EmptyState
          icon={<ListTodo className="w-16 h-16" />}
          title="Watchlist is empty"
          description="Add movies and series to your watchlist from the search page."
          actionLabel="Search Titles"
          actionTo="/search"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 md:mb-10">
        <h1 className="text-h1 font-display font-bold text-vault-text tracking-tight">Watchlist</h1>
        <p className="text-body-sm text-vault-muted mt-1">{watchlist.length} titles to watch</p>
      </div>
      <FilterBar
        filters={['All', 'Movies', 'Series', 'Pending', 'Watching']}
        activeFilter={filter}
        onFilterChange={(f) => setFilter(f as FilterType)}
        sortOptions={sortOptions}
        activeSort={sort}
        onSortChange={setSort}
      />
      {watchlist.length === 0 ? (
        <EmptyState
          icon={<Search className="w-12 h-12" />}
          title="No matches"
          description="No titles match your current filter."
        />
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {watchlist.map((item) => (
            <TitleCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <div className="mt-16 pt-8 border-t border-vault-border/30 text-center">
        <p className="text-sm font-semibold text-white tracking-wide">ArcVault</p>
        <p className="text-xs text-vault-muted mt-1.5">
          A personal cinema journey, crafted by <span className="text-vault-text-secondary font-medium">DAX SANANDIYA</span>
        </p>
        <p className="text-[10px] text-vault-muted/60 mt-2">
          © 2026 DAX SANANDIYA · v1.0.0
        </p>
      </div>
    </div>
  );
}
