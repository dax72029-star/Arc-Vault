import { useState, useMemo } from 'react';
import { CheckCircle2, Search } from 'lucide-react';
import { useTrackerContext } from '../hooks/useTrackerContext';
import type { TrackerMovie, TrackerSeries } from '../types';
import TitleCard from '../components/TitleCard';
import FilterBar, { sortItems, type SortOption } from '../components/FilterBar';
import EmptyState from '../components/EmptyState';

type FilterType = 'All' | 'Movies' | 'Series' | 'Favorites';

const defaultSort: SortOption = 'recently-watched';
const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'recently-watched', label: 'Recently Watched' },
  { value: 'recently-added', label: 'Recently Added' },
  { value: 'highest-rated', label: 'Highest Rated' },
  { value: 'lowest-rated', label: 'Lowest Rated' },
  { value: 'longest', label: 'Longest Runtime' },
  { value: 'shortest', label: 'Shortest Runtime' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
];

export default function Completed() {
  const { items } = useTrackerContext();
  const [filter, setFilter] = useState<FilterType>('All');
  const [sort, setSort] = useState<SortOption>(defaultSort);

  const completed = useMemo(() => {
    let filtered = items.filter(
      (i) =>
        (i.type === 'movie' && i.status === 'completed') ||
        (i.type === 'tv' && i.status === 'completed')
    );

    switch (filter) {
      case 'Movies':
        filtered = filtered.filter((i) => i.type === 'movie');
        break;
      case 'Series':
        filtered = filtered.filter((i) => i.type === 'tv');
        break;
      case 'Favorites':
        filtered = filtered.filter((i) => i.favorite);
        break;
    }

    return sortItems(filtered as (TrackerMovie | TrackerSeries)[], sort);
  }, [items, filter, sort]);

  const completedMovies = items.filter(
    (i): i is TrackerMovie => i.type === 'movie' && i.status === 'completed'
  ).length;
  const completedSeries = items.filter(
    (i): i is TrackerSeries => i.type === 'tv' && i.status === 'completed'
  ).length;

  if (completedMovies + completedSeries === 0) {
    return (
      <div>
        <div className="mb-6 md:mb-10">
          <h1 className="text-xl md:text-h1 font-display font-bold text-vault-text tracking-tight">Completed</h1>
          <p className="text-xs md:text-body-sm text-vault-muted mt-1">0 titles completed</p>
        </div>
        <EmptyState
          icon={<CheckCircle2 className="w-12 h-12 md:w-16 md:h-16" />}
          title="Nothing completed yet"
          description="Start watching something and mark it as completed."
          actionLabel="Browse Titles"
          actionTo="/watchlist"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 md:mb-10">
        <h1 className="text-xl md:text-h1 font-display font-bold text-vault-text tracking-tight">Completed</h1>
        <p className="text-xs md:text-body-sm text-vault-muted mt-1">{completed.length} titles completed</p>
      </div>
      <FilterBar
        filters={['All', 'Movies', 'Series', 'Favorites']}
        activeFilter={filter}
        onFilterChange={(f) => setFilter(f as FilterType)}
        sortOptions={sortOptions}
        activeSort={sort}
        onSortChange={setSort}
      />
      {completed.length === 0 ? (
        <EmptyState
          icon={<Search className="w-12 h-12" />}
          title="No matches"
          description="No completed titles match your current filter."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 md:gap-3">
          {completed.map((item) => (
            <TitleCard key={item.id} item={item} showStatus={false} />
          ))}
        </div>
      )}

      <div className="mt-12 md:mt-16 pt-6 md:pt-8 border-t border-vault-border/30 text-center">
        <p className="text-xs md:text-sm font-semibold text-white tracking-wide">ArcVault</p>
        <p className="text-[10px] md:text-xs text-vault-muted mt-1.5">
          A personal cinema journey, crafted by <span className="text-vault-text-secondary font-medium">DAX SANANDIYA</span>
        </p>
        <p className="text-[9px] md:text-[10px] text-vault-muted/60 mt-2">
          © 2026 DAX SANANDIYA · v1.0.0
        </p>
      </div>
    </div>
  );
}
