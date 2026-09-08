import { useState, useMemo } from 'react';
import { ListTodo, Search } from 'lucide-react';
import { useTrackerContext } from '../hooks/useTrackerContext';
import type { TrackerMovie, TrackerSeries } from '../types';
import TitleCard from '../components/TitleCard';
import PageHeader, { ContextPill } from '../components/PageHeader';
import FilterBar, { sortItems, type SortOption } from '../components/FilterBar';
import EmptyState from '../components/EmptyState';
import Reveal from '../components/Reveal';
import PageFooter from '../components/PageFooter';

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
        <PageHeader
          kicker="Library"
          title="Watchlist"
          subtitle="Titles you plan to watch"
          right={<ContextPill>0 titles</ContextPill>}
        />
        <EmptyState
          icon={<ListTodo className="w-12 h-12 md:w-16 md:h-16" />}
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
      <PageHeader
        kicker="Library"
        title="Watchlist"
        subtitle="Titles you plan to watch"
        right={<ContextPill>{watchlist.length} {watchlist.length === 1 ? 'title' : 'titles'}</ContextPill>}
      />
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
        <Reveal>
          <div className="grid perf-grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 md:gap-3">
            {watchlist.map((item) => (
              <TitleCard key={item.id} item={item} />
            ))}
          </div>
        </Reveal>
      )}

      <PageFooter />
    </div>
  );
}
