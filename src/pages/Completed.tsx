import { useState, useMemo } from 'react';
import { CheckCircle2, Search } from 'lucide-react';
import { useTrackerContext } from '../hooks/useTrackerContext';
import type { TrackerMovie, TrackerSeries } from '../types';
import TitleCard from '../components/TitleCard';
import PageHeader, { ContextPill } from '../components/PageHeader';
import FilterBar, { sortItems, type SortOption } from '../components/FilterBar';
import EmptyState from '../components/EmptyState';
import Reveal from '../components/Reveal';
import PageFooter from '../components/PageFooter';
import CinemaUniverse from '../components/CinemaUniverse';

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
        <PageHeader
          kicker="Library"
          title="Completed"
          subtitle="Titles you've finished"
          right={<ContextPill>0 titles</ContextPill>}
        />
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
      <PageHeader
        kicker="Library"
        title="Completed"
        subtitle="Titles you've finished"
        right={<ContextPill>{completedMovies} movie{completedMovies === 1 ? '' : 's'} · {completedSeries} series</ContextPill>}
      />
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
        <Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 md:gap-3">
            {completed.map((item) => (
              <TitleCard key={item.id} item={item} showStatus={false} />
            ))}
          </div>
        </Reveal>
      )}

      <div className="mt-10 md:mt-14 pt-8 md:pt-10 border-t border-vault-border/20">
        <Reveal>
          <CinemaUniverse items={items} />
        </Reveal>
      </div>

      <PageFooter />
    </div>
  );
}
