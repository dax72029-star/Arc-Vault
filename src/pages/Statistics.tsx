import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Award,
  Timer,
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
import WatchTimeHero from '../components/WatchTimeHero';
import MonthlyWatchChart from '../components/MonthlyWatchChart';
import CinemaUniverse from '../components/CinemaUniverse';
import AnimatedProgress from '../components/ProgressBar';
import TMDBImage from '../components/TMDBImage';
import { useCountUp } from '../hooks/useCountUp';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

export default function Statistics() {
  const navigate = useNavigate();
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
  const reducedMotion = usePrefersReducedMotion();
  // count-up for overview — subtle, respects reduced motion via hook internally
  const countMovies = Math.round(useCountUp(stats.totalMovies, 700));
  const countSeries = Math.round(useCountUp(stats.totalSeries, 700));
  const countCompletion = Math.round(useCountUp(stats.completionPercentage, 800) * 10) / 10;
  const countStreak = Math.round(useCountUp(streak.current, 600));

  const completedMovies = items.filter((i): i is TrackerMovie => i.type === 'movie' && i.status === 'completed');
  const completedSeries = items.filter((i): i is TrackerSeries => i.type === 'tv' && i.status === 'completed');

  const avgMovieRuntime =
    completedMovies.length > 0
      ? Math.round(completedMovies.reduce((sum, m) => sum + (m.runtime || 0), 0) / completedMovies.length)
      : 0;

  const movieRatings = completedMovies.filter((m) => m.personalRating > 0);
  const seriesRatings = completedSeries.filter((s) => s.personalRating > 0);
  const avgMovieRating =
    movieRatings.length > 0 ? Math.round((movieRatings.reduce((sum, m) => sum + m.personalRating, 0) / movieRatings.length) * 10) / 10 : 0;
  const avgSeriesRating =
    seriesRatings.length > 0 ? Math.round((seriesRatings.reduce((sum, s) => sum + s.personalRating, 0) / seriesRatings.length) * 10) / 10 : 0;

  if (items.length === 0) {
    return (
      <div>
        <PageHeader kicker="Analytics" title="Statistics" subtitle="Your watch analytics" right={<ContextPill>No data</ContextPill>} />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart3 className="w-16 h-16 text-vault-muted/30 mb-4" />
          <h3 className="text-h3 font-display font-semibold text-vault-text mb-2">No data yet</h3>
          <p className="text-body-sm text-vault-muted max-w-sm">Add movies and series to your tracker to see statistics.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Analytics"
        title="Your cinematic life, visualized"
        subtitle="Every number is a memory. Every hour is a story you chose to live."
        right={<ContextPill>{items.length} titles · {stats.totalCompleted} completed</ContextPill>}
      />

      <Reveal>
        <section className="mb-6 md:mb-8">
          <WatchTimeHero totalMinutes={stats.totalWatchTimeMinutes} formatted={formatMinutes(stats.totalWatchTimeMinutes)} />
        </section>
      </Reveal>

      <Reveal delay={1}>
        <section className="mb-6 md:mb-8">
          <SectionHeader title="Overview" icon={<Target className="w-4 h-4 md:w-5 md:h-5 text-vault-accent" />} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
            <div className="group vault-card p-3 md:p-4 hover:border-vault-accent/25 hover:shadow-vault-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] md:text-[11px] text-vault-muted font-medium uppercase tracking-wider">Total Movies</p>
                  <p className="text-xl md:text-2xl font-display font-bold text-vault-text tabular-nums mt-1">{reducedMotion ? stats.totalMovies : countMovies}</p>
                  <p className="text-[11px] text-vault-muted mt-1">{stats.moviesCompleted} completed</p>
                  <div className="mt-2 h-1 vault-progress">
                    <div className="vault-progress-accent" style={{ width: `${stats.totalMovies ? (stats.moviesCompleted / stats.totalMovies) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-vault-accent/10 flex items-center justify-center group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
                  <Film className="w-5 h-5 text-vault-accent" />
                </div>
              </div>
            </div>
            <div className="group vault-card p-3 md:p-4 hover:border-vault-info/25 hover:shadow-vault-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] md:text-[11px] text-vault-muted font-medium uppercase tracking-wider">Total Series</p>
                  <p className="text-xl md:text-2xl font-display font-bold text-vault-text tabular-nums mt-1">{reducedMotion ? stats.totalSeries : countSeries}</p>
                  <p className="text-[11px] text-vault-muted mt-1">{stats.seriesCompleted} completed · {stats.seriesWatching} watching</p>
                  <div className="mt-2 h-1 vault-progress">
                    <div className="vault-progress-info" style={{ width: `${stats.totalSeries ? (stats.seriesCompleted / stats.totalSeries) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-vault-info/10 flex items-center justify-center group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
                  <Tv className="w-5 h-5 text-vault-info" />
                </div>
              </div>
            </div>
            <div className="group vault-card p-3 md:p-4 hover:border-vault-success/25 hover:shadow-vault-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] md:text-[11px] text-vault-muted font-medium uppercase tracking-wider">Completion</p>
                  <p className="text-xl md:text-2xl font-display font-bold text-vault-success tabular-nums mt-1">{reducedMotion ? `${stats.completionPercentage}%` : `${countCompletion}%`}</p>
                  <p className="text-[11px] text-vault-muted mt-1">{stats.totalCompleted} / {items.length}</p>
                  <div className="mt-2"><AnimatedProgress value={stats.completionPercentage} barClassName="vault-progress-success" /></div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-vault-success/10 flex items-center justify-center group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
                  <TrendingUp className="w-5 h-5 text-vault-success" />
                </div>
              </div>
            </div>
            <div className="group vault-card p-3 md:p-4 hover:border-vault-warning/25 hover:shadow-vault-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] md:text-[11px] text-vault-muted font-medium uppercase tracking-wider">Watch Streak</p>
                  <p className="text-xl md:text-2xl font-display font-bold text-vault-warning tabular-nums mt-1">{reducedMotion ? `${streak.current}d` : `${countStreak}d`}</p>
                  <p className="text-[11px] text-vault-muted mt-1">Best: {streak.longest}d</p>
                  <div className="mt-2 flex gap-0.5">
                    {streak.days.map((d) => (
                      <span key={d.date} className={`flex-1 h-1 rounded-full ${d.watched ? 'bg-vault-warning' : 'bg-vault-border/50'}`} />
                    ))}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-vault-warning/10 flex items-center justify-center group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
                  <Flame className="w-5 h-5 text-vault-warning" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={2}>
        <section className="mb-6 md:mb-8">
          <SectionHeader title="Watch Time" icon={<Clock className="w-4 h-4 md:w-5 md:h-5 text-vault-gold" />} />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            <div className="vault-card p-4 md:p-6 lg:col-span-3">
              <div className="space-y-0">
                <div className="flex items-center justify-between py-3 border-b border-vault-border/20">
                  <span className="text-[11px] md:text-sm text-vault-muted flex items-center gap-2"><Film className="w-3.5 h-3.5" /> Movies</span>
                  <span className="text-[11px] md:text-sm font-semibold text-vault-text tabular-nums">{formatMinutes(stats.movieWatchTimeMinutes)}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-vault-border/20">
                  <span className="text-[11px] md:text-sm text-vault-muted flex items-center gap-2"><Tv className="w-3.5 h-3.5" /> Series</span>
                  <span className="text-[11px] md:text-sm font-semibold text-vault-text tabular-nums">{formatMinutes(stats.seriesWatchTimeMinutes)}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-semibold text-vault-text">Total</span>
                  <span className="text-sm font-bold text-vault-gold tabular-nums">{formatMinutes(stats.totalWatchTimeMinutes)}</span>
                </div>
              </div>
              {stats.totalWatchTimeMinutes > 0 && (
                <div className="mt-5 pt-5 border-t border-vault-border/20 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-vault-muted">Movies share</span>
                      <span className="text-xs text-vault-text font-medium tabular-nums">{Math.round((stats.movieWatchTimeMinutes / stats.totalWatchTimeMinutes) * 100)}%</span>
                    </div>
                    <AnimatedProgress value={(stats.movieWatchTimeMinutes / stats.totalWatchTimeMinutes) * 100} barClassName="vault-progress-accent" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-vault-muted">Series share</span>
                      <span className="text-xs text-vault-text font-medium tabular-nums">{Math.round((stats.seriesWatchTimeMinutes / stats.totalWatchTimeMinutes) * 100)}%</span>
                    </div>
                    <AnimatedProgress value={(stats.seriesWatchTimeMinutes / stats.totalWatchTimeMinutes) * 100} barClassName="vault-progress-info" />
                  </div>
                </div>
              )}
            </div>
            <div className="vault-card p-4 md:p-6 lg:col-span-2 flex flex-col justify-center gap-4 bg-gradient-to-br from-vault-card via-vault-card to-vault-surface/40">
              <div className="flex items-center gap-2 text-[11px] tracking-widest font-semibold text-vault-muted uppercase">
                <Timer className="w-3.5 h-3.5" /> Distribution
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-vault-accent" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-vault-text">Movies</span>
                      <span className="text-xs font-semibold text-vault-text tabular-nums">{stats.moviesCompleted} titles</span>
                    </div>
                    <div className="text-[11px] text-vault-muted tabular-nums">{formatMinutes(stats.movieWatchTimeMinutes)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-vault-info" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-vault-text">Series</span>
                      <span className="text-xs font-semibold text-vault-text tabular-nums">{stats.seriesCompleted} titles</span>
                    </div>
                    <div className="text-[11px] text-vault-muted tabular-nums">{formatMinutes(stats.seriesWatchTimeMinutes)}</div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-vault-bg/60 border border-vault-border/20 p-3 text-center">
                <p className="text-[10px] tracking-widest font-semibold text-vault-muted uppercase">Avg per completed title</p>
                <p className="text-sm font-bold text-vault-text tabular-nums mt-1">
                  {stats.totalCompleted ? formatMinutes(Math.round(stats.totalWatchTimeMinutes / stats.totalCompleted)) : '—'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={3}>
        <section className="mb-6 md:mb-8">
          <SectionHeader title="Monthly Watch Time" icon={<Calendar className="w-4 h-4 md:w-5 md:h-5 text-vault-info" />} />
          <MonthlyWatchChart data={monthlyStats} />
          {monthlyStats.length > 1 && (
            <p className="text-[11px] text-vault-muted mt-2.5 text-center">
              Tip: hover the curve to inspect any month · Your most active month was{' '}
              <span className="text-vault-text font-medium">{[...monthlyStats].sort((a, b) => b.minutes - a.minutes)[0]?.month}</span>
            </p>
          )}
        </section>
      </Reveal>

      <Reveal delay={4}>
        <section className="mb-6 md:mb-8">
          <SectionHeader title="Ratings" icon={<Star className="w-4 h-4 md:w-5 md:h-5 text-vault-gold" />} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
            <StatCard label="Avg Movie Rating" value={avgMovieRating > 0 ? `${avgMovieRating}/10` : 'N/A'} icon={<Star className="w-5 h-5" />} color="text-vault-gold" />
            <StatCard label="Avg Series Rating" value={avgSeriesRating > 0 ? `${avgSeriesRating}/10` : 'N/A'} icon={<Star className="w-5 h-5" />} color="text-vault-gold" />
            <StatCard label="Avg Overall" value={avgRating > 0 ? `${avgRating}/10` : 'N/A'} icon={<Award className="w-5 h-5" />} color="text-vault-gold" />
            <StatCard label="Rated Titles" value={items.filter((i) => i.personalRating > 0).length} icon={<Trophy className="w-5 h-5" />} color="text-vault-accent" />
          </div>
        </section>
      </Reveal>

      <Reveal delay={5}>
        <section className="mb-6 md:mb-8">
          <SectionHeader title="Records" icon={<Zap className="w-4 h-4 md:w-5 md:h-5 text-vault-accent" />} />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
            <div className="vault-card p-4 md:p-5 hover:border-vault-border transition-colors">
              <p className="text-[10px] md:text-caption text-vault-muted uppercase tracking-wider mb-2">Longest Movie</p>
              {longestMovie ? (
                <>
                  <p className="text-sm font-semibold text-vault-text truncate">{longestMovie.title}</p>
                  <p className="text-xs text-vault-muted mt-1 tabular-nums">{formatMinutes(longestMovie.runtime)} · {longestMovie.releaseYear}</p>
                </>
              ) : (
                <p className="text-xs text-vault-muted">No completed movies</p>
              )}
            </div>
            <div className="vault-card p-4 md:p-5 hover:border-vault-border transition-colors">
              <p className="text-[10px] md:text-caption text-vault-muted uppercase tracking-wider mb-2">Longest Series</p>
              {longestSeries ? (
                <>
                  <p className="text-sm font-semibold text-vault-text truncate">{longestSeries.title}</p>
                  <p className="text-xs text-vault-muted mt-1">{longestSeries.numberOfEpisodes} episodes · {longestSeries.numberOfSeasons} seasons</p>
                </>
              ) : (
                <p className="text-xs text-vault-muted">No completed series</p>
              )}
            </div>
            <div className="vault-card p-4 md:p-5 sm:col-span-2 md:col-span-1 hover:border-vault-border transition-colors">
              <p className="text-[10px] md:text-caption text-vault-muted uppercase tracking-wider mb-2">Average Movie Runtime</p>
              {avgMovieRuntime > 0 ? (
                <>
                  <p className="text-sm font-semibold text-vault-text tabular-nums">{formatMinutes(avgMovieRuntime)}</p>
                  <p className="text-xs text-vault-muted mt-1">{completedMovies.length} movies</p>
                </>
              ) : (
                <p className="text-xs text-vault-muted">No completed movies</p>
              )}
            </div>
          </div>
        </section>
      </Reveal>

      {genreStats.length > 0 && (
        <Reveal delay={6}>
          <section className="mb-6 md:mb-8">
            <SectionHeader title="Genres" />
            <div className="vault-card p-4 md:p-6">
              <div className="space-y-3">
                {genreStats.slice(0, 8).map((g) => (
                  <div key={g.genre} className="flex items-center gap-3">
                    <span className="text-xs md:text-sm text-vault-text w-20 md:w-28 truncate">{g.genre}</span>
                    <div className="flex-1 vault-progress">
                      <div className="vault-progress-accent" style={{ width: `${g.percentage}%` }} />
                    </div>
                    <span className="text-xs text-vault-muted w-10 text-right tabular-nums">{g.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {topRated.length > 0 && (
        <Reveal delay={7}>
          <section className="mb-6 md:mb-8">
            <SectionHeader title="Top Rated" icon={<Trophy className="w-4 h-4 md:w-5 md:h-5 text-vault-gold" />} />
            <div className="space-y-2">
              {topRated.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/title/${item.type}/${item.tmdbId}`)}
                  className={`group vault-card flex items-center gap-3 md:gap-4 p-2.5 md:p-3 text-left w-full transition-all duration-200 hover:border-vault-border hover:-translate-y-0.5 hover:shadow-vault-md text-left ${
                    i === 0 ? 'md:p-4 border-vault-gold/20 bg-gradient-to-r from-vault-gold/5 via-transparent to-transparent' : ''
                  }`}
                >
                  <span className={`font-display font-extrabold w-8 md:w-10 text-center tabular-nums ${i === 0 ? 'text-xl md:text-2xl text-vault-gold' : i < 3 ? 'text-lg text-vault-gold' : 'text-sm text-vault-muted'}`}>
                    {i + 1}
                  </span>
                  <div className="w-10 h-[60px] md:w-12 md:h-[72px] rounded-md overflow-hidden flex-shrink-0 bg-vault-surface shadow-vault-sm">
                    <TMDBImage path={item.poster} alt={item.title} size="w185" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fallbackClassName="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-vault-text truncate ${i === 0 ? 'text-sm md:text-base' : 'text-xs md:text-sm'}`}>{item.title}</p>
                    <p className="text-[11px] md:text-xs text-vault-muted">{item.type === 'movie' ? 'Movie' : 'Series'} · {item.releaseYear}</p>
                  </div>
                  <span className="vault-badge-gold flex-shrink-0">
                    <Star className="w-3 h-3 fill-current" />
                    {item.personalRating}/10
                  </span>
                </button>
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {history.length > 0 && (
        <Reveal delay={8}>
          <section className="mb-6 md:mb-8">
            <SectionHeader title="Recent History" />
            <div className="space-y-1.5">
              {history.slice(0, 16).map((entry) => {
                const isCompleted = entry.action.includes('Completed');
                const isAdded = entry.action.includes('Added');
                const badgeClass = isCompleted ? 'vault-badge-success' : isAdded ? 'vault-badge-info' : 'vault-badge bg-vault-surface-hover text-vault-muted';
                return (
                  <div key={entry.id} className="vault-surface flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 hover:border-vault-border transition-colors">
                    <span className="text-[10px] md:text-xs text-vault-muted w-16 md:w-24 flex-shrink-0 tabular-nums">
                      {new Date(entry.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className={`${badgeClass} flex-shrink-0 !text-[10px] md:!text-xs`}>
                      <span aria-hidden="true">{isCompleted ? '✓' : isAdded ? '+' : '•'}</span>
                      <span className="hidden sm:inline">{entry.action}</span>
                    </span>
                    <span className="text-xs md:text-sm text-vault-text truncate flex-1 min-w-0">{entry.title}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </Reveal>
      )}

      <Reveal delay={9}>
        <section className="mb-6 md:mb-8">
          <CinemaUniverse items={items} />
        </section>
      </Reveal>

      <PageFooter />
    </div>
  );
}
