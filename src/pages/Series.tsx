import { useState, useMemo } from 'react';
import { Tv, Search } from 'lucide-react';
import { useTrackerContext } from '../hooks/useTrackerContext';
import type { TrackerSeries } from '../types';
import TitleCard from '../components/TitleCard';
import PageHeader, { ContextPill } from '../components/PageHeader';
import FilterBar, { sortItems, type SortOption } from '../components/FilterBar';
import EmptyState from '../components/EmptyState';
import Reveal from '../components/Reveal';
import PageFooter from '../components/PageFooter';

type FilterType = 'All' | 'Pending' | 'Watching' | 'Completed' | 'Favorites';

const defaultSort: SortOption = 'recently-added';
const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'recently-added', label: 'Recently Added' },
  { value: 'recently-watched', label: 'Recently Watched' },
  { value: 'highest-rated', label: 'Highest Rated' },
  { value: 'lowest-rated', label: 'Lowest Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
];

export default function Series() {
  const { items } = useTrackerContext();
  const [filter, setFilter] = useState<FilterType>('All');
  const [sort, setSort] = useState<SortOption>(defaultSort);

  const series = useMemo(() => {
    let filtered = items.filter((i): i is TrackerSeries => i.type === 'tv');

    switch (filter) {
      case 'Pending':
        filtered = filtered.filter((s) => s.status === 'pending');
        break;
      case 'Watching':
        filtered = filtered.filter((s) => s.status === 'watching');
        break;
      case 'Completed':
        filtered = filtered.filter((s) => s.status === 'completed');
        break;
      case 'Favorites':
        filtered = filtered.filter((s) => s.favorite);
        break;
    }

    return sortItems(filtered, sort);
  }, [items, filter, sort]);

  const totalCount = items.filter((i) => i.type === 'tv').length;

  if (totalCount === 0) {
    return (
      <div>
        <PageHeader
          kicker="Library"
          title="Series"
          subtitle="Your series tracker"
          right={<ContextPill>0 series</ContextPill>}
        />
        <EmptyState
          icon={<Tv className="w-12 h-12 md:w-16 md:h-16" />}
          title="No series yet"
          description="Search for a TV series and add it to your tracker."
          actionLabel="Search Series"
          actionTo="/search"
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Library"
        title="Series"
        subtitle="Your series tracker"
        right={<ContextPill>{totalCount} series</ContextPill>}
      />
      <FilterBar
        filters={['All', 'Pending', 'Watching', 'Completed', 'Favorites']}
        activeFilter={filter}
        onFilterChange={(f) => setFilter(f as FilterType)}
        sortOptions={sortOptions}
        activeSort={sort}
        onSortChange={setSort}
      />
      {series.length === 0 ? (
        <EmptyState
          icon={<Search className="w-12 h-12" />}
          title="No matches"
          description="No series match your current filter."
        />
      ) : (
        <Reveal>
          <div className="grid perf-grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 md:gap-3">
            {series.map((s) => (
              <TitleCard key={s.id} item={s} />
            ))}
          </div>
        </Reveal>
      )}

      <PageFooter />
    </div>
  );
}
