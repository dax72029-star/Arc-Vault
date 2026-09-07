import { useMemo } from 'react';
import {
  BarChart3,
  Film,
  Tv,
  Clock,
  Star,
  TrendingUp,
  Flame,
  Calendar,
  Trophy,
  Zap,
  Target,
} from 'lucide-react';
import { useTrackerContext } from '../hooks/useTrackerContext';
import type { TrackerItem, TrackerMovie, TrackerSeries } from '../types';
import {
  calculateWatchStats,
  formatMinutes,
  getGenreStats,
  getMonthlyStats,
  getAverageRating,
  getTopRated,
  getLongestMovie,
  getLongestSeries,
  getWatchStreak,
} from '../utils/helpers';
import StatCard from '../components/StatCard';
import SectionHeader from '../components/SectionHeader';
import PageHeader, { ContextPill } from '../components/PageHeader';
import { getHistory } from '../services/storage';
import Reveal from '../components/Reveal';
import PageFooter from '../components/PageFooter';

export default function Statistics() {
  const { items } = useTrackerContext();
  const stats = useMemo(() => calculateWatchStats(items), [items]);
  const genreStats = useMemo(() => getGenreStats(items), [items]);
  const monthlyStats = useMemo(() => getMonthlyStats(items), [items]);
  const avgRating = useMemo(() => getAverageRating(items), [items]);
  const topRated = useMemo(() => getTopRated(items, 10), [items]);
  const longestMovie = useMemo(() => getLongestMovie(items), [items]);
  const longestSeries = useMemo(() => getLongestSeries(items), [items]);
  const streak = useMemo(() => getWatchStreak(), [items]);
  const history = useMemo(() => getHistory(), [items]);

  const completedMovies = items.filter(
    (i): i is TrackerMovie => i.type === 'movie' && i.status === 'completed'
  );
  const completedSeries = items.filter(
    (i): i is TrackerSeries => i.type === 'tv' && i.status === 'completed'
  );

  const avgMovieRuntime =
    completedMovies.length > 0
      ? Math.round(
          completedMovies.reduce((sum, m) => sum + (m.runtime || 0), 0) /
            completedMovies.length
        )
      : 0;

  const movieRatings = completedMovies.filter((m) => m.personalRating > 0);
  const seriesRatings = completedSeries.filter((s) => s.personalRating > 0);
  const avgMovieRating =
    movieRatings.length > 0
      ? Math.round(
          (movieRatings.reduce((sum, m) => sum + m.personalRating, 0) /
            movieRatings.length) *
            10
        ) / 10
      : 0;
  const avgSeriesRating =
    seriesRatings.length > 0
      ? Math.round(
          (seriesRatings.reduce((sum, s) => sum + s.personalRating, 0) /
            seriesRatings.length) *
            10
        ) / 10
      : 0;

  const mostActiveMonth = useMemo(() => {
    if (monthlyStats.length === 0) return null;
    return monthlyStats.reduce((max, m) =>
      m.minutes > max.minutes ? m : max
    );
  }, [monthlyStats]);

  if (items.length === 0) {
    return (
      <div>
        <PageHeader
          kicker="Analytics"
          title="Statistics"
          subtitle="Your watch analytics"
          right={<ContextPill>No data</ContextPill>}
        />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart3 className="w-16 h-16 text-vault-muted/30 mb-4" />
          <h3 className="text-h3 font-display font-semibold text-vault-text mb-2">No data yet</h3>
          <p className="text-body-sm text-vault-muted max-w-sm">
            Add movies and series to your tracker to see statistics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Analytics"
        title="Statistics"
        subtitle="Your watch analytics"
        right={<ContextPill>{items.length} titles</ContextPill>}
      />

      <section className="mb-5 md:mb-8">
        <div className="vault-card p-4 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-vault-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-2 md:gap-4">
            <div>
              <p className="text-[10px] md:text-caption text-vault-muted uppercase tracking-widest font-medium mb-1 md:mb-2">Total watch time</p>
              <p className="text-xl md:text-display font-display font-extrabold text-vault-gold leading-none">
                {formatMinutes(stats.totalWatchTimeMinutes)}
              </p>
            </div>
            {stats.totalWatchTimeMinutes >= 1440 && (
              <p className="text-[10px] md:text-meta text-vault-muted max-w-sm md:text-right">
                That's approximately {Math.floor(stats.totalWatchTimeMinutes / 1440)} days,{' '}
                {Math.floor((stats.totalWatchTimeMinutes % 1440) / 60)} hours,{' '}
                {Math.round(stats.totalWatchTimeMinutes % 60)} minutes of your life.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mb-5 md:mb-8">
        <SectionHeader title="Overview" icon={<Target className="w-4 h-4 md:w-5 md:h-5 text-vault-accent" />} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
          <StatCard label="Total Movies" value={stats.totalMovies} countUp icon={<Film className="w-5 h-5" />} sublabel={`${stats.moviesCompleted} completed`} />
          <StatCard label="Total Series" value={stats.totalSeries} countUp icon={<Tv className="w-5 h-5" />} sublabel={`${stats.seriesCompleted} completed`} />
          <StatCard label="Completion" value={stats.completionPercentage} suffix="%" countUp icon={<TrendingUp className="w-5 h-5" />} color="text-vault-success" sublabel={`${stats.totalCompleted} / ${items.length}`} />
          <StatCard label="Watch Streak" value={`${streak.current}d`} icon={<Flame className="w-5 h-5" />} color="text-vault-warning" sublabel={`Best: ${streak.longest}d`} />
        </div>
      </section>

      <section className="mb-5 md:mb-8">
        <SectionHeader title="Watch Time" icon={<Clock className="w-4 h-4 md:w-5 md:h-5 text-vault-gold" />} />
        <div className="vault-card p-4 md:p-6">
          <div className="space-y-0">
            <div className="flex items-center justify-between py-2.5 md:py-3 border-b border-vault-border/20">
              <span className="text-[11px] md:text-body-sm text-vault-muted">Movie Watch Time</span>
              <span className="text-[11px] md:text-body-sm font-semibold text-vault-text tabular-nums">{formatMinutes(stats.movieWatchTimeMinutes)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 md:py-3 border-b border-vault-border/20">
              <span className="text-[11px] md:text-body-sm text-vault-muted">Series Watch Time</span>
              <span className="text-[11px] md:text-body-sm font-semibold text-vault-text tabular-nums">{formatMinutes(stats.seriesWatchTimeMinutes)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 md:py-3">
              <span className="text-[11px] md:text-body-sm font-semibold text-vault-text">Total Watch Time</span>
              <span className="text-[11px] md:text-body-sm font-bold text-vault-gold tabular-nums">{formatMinutes(stats.totalWatchTimeMinutes)}</span>
            </div>
          </div>
          {stats.totalWatchTimeMinutes > 0 && (
            <div className="mt-5 pt-5 border-t border-vault-border/20 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-caption text-vault-muted">Movies share</span>
                  <span className="text-caption text-vault-text-secondary">{Math.round((stats.movieWatchTimeMinutes / stats.totalWatchTimeMinutes) * 100)}%</span>
                </div>
                <div className="vault-progress">
                  <div className="vault-progress-accent" style={{ width: `${(stats.movieWatchTimeMinutes / stats.totalWatchTimeMinutes) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-caption text-vault-muted">Series share</span>
                  <span className="text-caption text-vault-text-secondary">{Math.round((stats.seriesWatchTimeMinutes / stats.totalWatchTimeMinutes) * 100)}%</span>
                </div>
                <div className="vault-progress">
                  <div className="vault-progress-accent" style={{ width: `${(stats.seriesWatchTimeMinutes / stats.totalWatchTimeMinutes) * 100}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mb-5 md:mb-8">
        <SectionHeader title="Ratings" icon={<Star className="w-4 h-4 md:w-5 md:h-5 text-vault-gold" />} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
          <StatCard label="Avg Movie Rating" value={avgMovieRating > 0 ? `${avgMovieRating}/10` : 'N/A'} icon={<Star className="w-5 h-5" />} color="text-vault-gold" />
          <StatCard label="Avg Series Rating" value={avgSeriesRating > 0 ? `${avgSeriesRating}/10` : 'N/A'} icon={<Star className="w-5 h-5" />} color="text-vault-gold" />
          <StatCard label="Avg Overall Rating" value={avgRating > 0 ? `${avgRating}/10` : 'N/A'} icon={<Star className="w-5 h-5" />} color="text-vault-gold" />
          <StatCard label="Rated Titles" value={items.filter((i) => i.personalRating > 0).length} icon={<Trophy className="w-5 h-5" />} color="text-vault-accent" />
        </div>
      </section>

      <section className="mb-5 md:mb-8">
        <SectionHeader title="Records" icon={<Zap className="w-4 h-4 md:w-5 md:h-5 text-vault-accent" />} />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
          <div className="vault-card p-3.5 md:p-5">
            <p className="text-[10px] md:text-caption text-vault-muted uppercase tracking-wider mb-1.5 md:mb-2">Longest Movie</p>
            {longestMovie ? (
              <>
                <p className="text-xs md:text-body-sm font-semibold text-vault-text truncate">{longestMovie.title}</p>
                <p className="text-[10px] md:text-caption text-vault-muted mt-0.5">{formatMinutes(longestMovie.runtime)}</p>
              </>
            ) : (
              <p className="text-[10px] md:text-caption text-vault-muted">No completed movies</p>
            )}
          </div>
          <div className="vault-card p-3.5 md:p-5">
            <p className="text-[10px] md:text-caption text-vault-muted uppercase tracking-wider mb-1.5 md:mb-2">Longest Series</p>
            {longestSeries ? (
              <>
                <p className="text-xs md:text-body-sm font-semibold text-vault-text truncate">{longestSeries.title}</p>
                <p className="text-[10px] md:text-caption text-vault-muted mt-0.5">{longestSeries.numberOfEpisodes} episodes</p>
              </>
            ) : (
              <p className="text-[10px] md:text-caption text-vault-muted">No completed series</p>
            )}
          </div>
          <div className="vault-card p-3.5 md:p-5 sm:col-span-2 md:col-span-1">
            <p className="text-[10px] md:text-caption text-vault-muted uppercase tracking-wider mb-1.5 md:mb-2">Average Movie Runtime</p>
            {avgMovieRuntime > 0 ? (
              <>
                <p className="text-xs md:text-body-sm font-semibold text-vault-text">{formatMinutes(avgMovieRuntime)}</p>
                <p className="text-[10px] md:text-caption text-vault-muted mt-0.5">{completedMovies.length} movies</p>
              </>
            ) : (
              <p className="text-[10px] md:text-caption text-vault-muted">No completed movies</p>
            )}
          </div>
        </div>
      </section>

      {genreStats.length > 0 && (
        <section className="mb-5 md:mb-8">
          <SectionHeader title="Genres" />
          <div className="vault-card p-4 md:p-6">
            <div className="space-y-2.5 md:space-y-3">
              {genreStats.slice(0, 8).map((g) => (
                <div key={g.genre} className="flex items-center gap-2 md:gap-3">
                  <span className="text-[11px] sm:text-xs md:text-body-sm text-vault-text w-14 sm:w-20 md:w-28 truncate">{g.genre}</span>
                  <div className="flex-1 vault-progress">
                    <div className="vault-progress-accent" style={{ width: `${g.percentage}%` }} />
                  </div>
                  <span className="text-[10px] md:text-caption text-vault-muted w-8 md:w-10 text-right tabular-nums">{g.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {monthlyStats.length > 0 && (
        <section className="mb-5 md:mb-8">
          <SectionHeader title="Monthly Watch Time" icon={<Calendar className="w-4 h-4 md:w-5 md:h-5 text-vault-info" />} />
          <div className="vault-card p-4 md:p-6">
            <div className="space-y-2.5 md:space-y-3">
              {monthlyStats.slice(0, 12).map((m) => {
                const maxMinutes = Math.max(...monthlyStats.map((x) => x.minutes));
                const pct = maxMinutes > 0 ? (m.minutes / maxMinutes) * 100 : 0;
                return (
                  <div key={m.month} className="flex items-center gap-2 md:gap-3">
                    <span className="text-[10px] md:text-caption text-vault-muted w-14 sm:w-20 truncate tabular-nums">{m.month}</span>
                    <div className="flex-1 vault-progress">
                      <div className="vault-progress-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] md:text-caption text-vault-text w-12 sm:w-16 text-right tabular-nums">{formatMinutes(m.minutes)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {topRated.length > 0 && (
        <section className="mb-5 md:mb-8">
          <SectionHeader title="Top Rated" icon={<Trophy className="w-4 h-4 md:w-5 md:h-5 text-vault-gold" />} />
          <div className="space-y-1.5 md:space-y-2">
            {topRated.map((item, i) => (
              <div
                key={item.id}
                className="vault-card flex items-center gap-3 md:gap-4 p-2.5 md:p-3 transition-all duration-vault-normal hover:border-vault-border"
              >
                <span className={`text-sm md:text-lg font-bold font-display w-6 md:w-8 text-center ${i < 3 ? 'text-vault-gold' : 'text-vault-muted'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] md:text-body-sm font-semibold text-vault-text truncate">{item.title}</p>
                  <p className="text-[10px] md:text-caption text-vault-muted">
                    {item.type === 'movie' ? 'Movie' : 'Series'} · {item.releaseYear}
                  </p>
                </div>
                <span className="vault-badge-gold flex-shrink-0 !text-[10px] md:!text-xs">
                  <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-current" />
                  {item.personalRating}/10
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="mb-5 md:mb-8">
          <SectionHeader title="Recent History" />
          <div className="space-y-1.5 md:space-y-2">
            {history.slice(0, 20).map((entry) => {
              const isCompleted = entry.action.includes('Completed');
              const isAdded = entry.action.includes('Added');
              const badgeClass = isCompleted
                ? 'vault-badge-success'
                : isAdded
                ? 'vault-badge-info'
                : 'vault-badge bg-vault-surface-hover text-vault-muted';
              return (
                <div
                  key={entry.id}
                  className="vault-surface flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 transition-colors duration-vault-normal hover:border-vault-border"
                >
                  <span className="text-[9px] sm:text-[10px] md:text-caption text-vault-muted w-10 sm:w-16 md:w-24 flex-shrink-0 tabular-nums">
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className={`${badgeClass} flex-shrink-0 !text-[9px] md:!text-xs`}>
                    <span aria-hidden="true">{isCompleted ? '✓' : isAdded ? '+' : '•'}</span>
                    <span className="hidden sm:inline">{entry.action}</span>
                  </span>
                  <span className="text-[11px] md:text-body-sm text-vault-text truncate flex-1 min-w-0">{entry.title}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <PageFooter />
    </div>
  );
}
