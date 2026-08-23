import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Search } from 'lucide-react';
import { useTrackerContext } from '../hooks/useTrackerContext';
import type { TrackerMovie } from '../types';
import TitleCard from '../components/TitleCard';
import FilterBar, { sortItems, type SortOption } from '../components/FilterBar';
import EmptyState from '../components/EmptyState';

type FilterType = 'All' | 'Pending' | 'Completed' | 'Favorites';

const defaultSort: SortOption = 'recently-added';
const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'recently-added', label: 'Recently Added' },
  { value: 'recently-watched', label: 'Recently Watched' },
  { value: 'highest-rated', label: 'Highest Rated' },
  { value: 'lowest-rated', label: 'Lowest Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'longest', label: 'Longest Runtime' },
  { value: 'shortest', label: 'Shortest Runtime' },
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
];

export default function Movies() {
  const { items } = useTrackerContext();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('All');
  const [sort, setSort] = useState<SortOption>(defaultSort);

  const movies = useMemo(() => {
    let filtered = items.filter((i): i is TrackerMovie => i.type === 'movie');

    switch (filter) {
      case 'Pending':
        filtered = filtered.filter((m) => m.status === 'pending');
        break;
      case 'Completed':
        filtered = filtered.filter((m) => m.status === 'completed');
        break;
      case 'Favorites':
        filtered = filtered.filter((m) => m.favorite);
        break;
    }

    return sortItems(filtered, sort);
  }, [items, filter, sort]);

  const totalCount = items.filter((i) => i.type === 'movie').length;

  if (totalCount === 0) {
    return (
      <div>
        <div className="mb-6 md:mb-10">
          <h1 className="text-xl md:text-h1 font-display font-bold text-vault-text tracking-tight">Movies</h1>
          <p className="text-xs md:text-body-sm text-vault-muted mt-1">
            Your movie tracker
            <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full bg-vault-accent/10 border border-vault-accent/25 text-[10px] md:text-[11px] font-semibold text-vault-accent tracking-wide align-middle">
              0 movies
            </span>
          </p>
        </div>
        <EmptyState
          icon={<Film className="w-12 h-12 md:w-16 md:h-16" />}
          title="No movies yet"
          description="Search for a movie and add it to your tracker."
          actionLabel="Search Movies"
          actionTo="/search"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 md:mb-10">
        <h1 className="text-xl md:text-h1 font-display font-bold text-vault-text tracking-tight">Movies</h1>
        <p className="text-xs md:text-body-sm text-vault-muted mt-1">
          Your movie tracker
          <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full bg-vault-accent/10 border border-vault-accent/25 text-[10px] md:text-[11px] font-semibold text-vault-accent tracking-wide align-middle">
            {totalCount} {totalCount === 1 ? 'movie' : 'movies'}
          </span>
        </p>
      </div>
      <FilterBar
        filters={['All', 'Pending', 'Completed', 'Favorites']}
        activeFilter={filter}
        onFilterChange={(f) => setFilter(f as FilterType)}
        sortOptions={sortOptions}
        activeSort={sort}
        onSortChange={setSort}
      />
      {movies.length === 0 ? (
        <EmptyState
          icon={<Search className="w-12 h-12" />}
          title="No matches"
          description="No movies match your current filter."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 md:gap-3">
          {movies.map((movie) => (
            <TitleCard key={movie.id} item={movie} />
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
