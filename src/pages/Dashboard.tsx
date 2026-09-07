import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Tv, Play, Clock, CheckCircle2, TrendingUp, Heart, Flame, Search, ChevronRight } from 'lucide-react';
import { useTrackerContext } from '../hooks/useTrackerContext';
import { calculateWatchStats, getWatchStreak, formatMinutesDetailed, formatMinutes } from '../utils/helpers';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import TitleCard from '../components/TitleCard';
import Reveal from '../components/Reveal';
import SectionHeader from '../components/SectionHeader';
import PageHeader from '../components/PageHeader';
import AnimatedProgress from '../components/ProgressBar';
import TMDBImage from '../components/TMDBImage';
import PageFooter from '../components/PageFooter';
import type { TrackerSeries } from '../types';

export default function Dashboard() {
  const { items } = useTrackerContext();
  const navigate = useNavigate();
  const stats = useMemo(() => calculateWatchStats(items), [items]);
  const streak = useMemo(() => getWatchStreak(), [items]);

  const recentlyCompleted = useMemo(() => {
    return items
      .filter(
        (i) =>
          (i.type === 'movie' && i.status === 'completed') ||
          (i.type === 'tv' && i.status === 'completed')
      )
      .sort((a, b) => {
        const dateA = a.type === 'movie' ? a.dateWatched : a.dateCompleted;
        const dateB = b.type === 'movie' ? b.dateWatched : b.dateCompleted;
        return new Date(dateB || '').getTime() - new Date(dateA || '').getTime();
      })
      .slice(0, 6);
  }, [items]);

  const favorites = useMemo(() => {
    return items.filter((i) => i.favorite).slice(0, 6);
  }, [items]);

  const continueWatching = useMemo(() => {
    return items.filter((i) => i.type === 'tv' && i.status === 'watching').slice(0, 8);
  }, [items]);

  const watchTime = formatMinutesDetailed(stats.totalWatchTimeMinutes);

  if (items.length === 0) {
    return (
      <Reveal>
        <EmptyState
          icon={<Search className="w-16 h-16" />}
          title="Welcome to ArcVault"
          description="Start tracking your movies and TV series. Search for a title and add it to your personal tracker."
          actionLabel="Search Movies & Series"
          actionTo="/search"
        />
        <PageFooter />
      </Reveal>
    );
  }

  return (
    <div>
      <Reveal>
        <PageHeader
          kicker="Dashboard"
          title="Your Cinema Journey"
          subtitle={`${items.length} titles in your tracker`}
        />
      </Reveal>

      <Reveal delay={1}>
        <section className="mb-5 md:mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
            <StatCard
              label="Movies"
              value={stats.totalMovies}
              icon={<Film className="w-5 h-5" />}
              countUp
              sublabel={`${stats.moviesCompleted} watched`}
            />
            <StatCard
              label="Series"
              value={stats.totalSeries}
              icon={<Tv className="w-5 h-5" />}
              countUp
              sublabel={`${stats.seriesCompleted} completed`}
            />
            <StatCard
              label="Watch Time"
              value={`${watchTime.days > 0 ? watchTime.days + 'd ' : ''}${watchTime.hours}h ${watchTime.minutes}m`}
              icon={<Clock className="w-5 h-5" />}
              color="text-vault-gold"
              sublabel="Total viewing time"
            />
            <StatCard
              label="Completion"
              value={stats.completionPercentage}
              suffix="%"
              countUp
              icon={<TrendingUp className="w-5 h-5" />}
              color="text-vault-success"
              sublabel={`${stats.totalCompleted} / ${items.length} titles`}
            />
          </div>
        </section>
      </Reveal>

      {stats.totalWatchTimeMinutes > 0 && (
        <Reveal delay={2}>
          <section className="mb-5 md:mb-8">
            <div className="vault-card p-4 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-vault-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-vault-gold/5 rounded-full blur-3xl translate-y-1/2" />
              <div className="relative">
                <p className="text-[10px] md:text-[11px] text-vault-muted uppercase tracking-widest font-medium mb-1.5 md:mb-2">Your cinematic journey so far</p>
                <p className="text-xl md:text-display font-display font-extrabold text-vault-gold leading-none">
                  {watchTime.days > 0 ? `${watchTime.days}d ` : ''}{watchTime.hours}h {watchTime.minutes}m
                </p>
                <p className="text-[11px] md:text-body-sm text-vault-muted mt-2 md:mt-3 max-w-md">
                  You've completed {stats.totalCompleted} titles across {stats.totalMovies} movies and {stats.totalSeries} series.
                  {stats.completionPercentage > 0 && ` That's a ${stats.completionPercentage}% completion rate.`}
                </p>
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {continueWatching.length > 0 && (
        <Reveal delay={3}>
          <section className="mb-5 md:mb-8">
            <SectionHeader
              title="Continue Watching"
              icon={<Play className="w-4 h-4 md:w-5 md:h-5 text-vault-info" />}
              iconColor="text-vault-info"
              action={
                <button onClick={() => navigate('/watching')} className="flex items-center gap-0.5 text-xs md:text-label text-vault-accent hover:text-vault-accent-hover transition-colors font-medium group">
                  View all
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                </button>
              }
            />
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0 snap-x">
              {continueWatching.map((series) => (
                <ContinueCard
                  key={series.id}
                  series={series as TrackerSeries}
                  onOpen={() => navigate(`/title/tv/${(series as TrackerSeries).tmdbId}`)}
                />
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {recentlyCompleted.length > 0 && (
        <Reveal delay={4}>
          <section className="mb-5 md:mb-8">
            <SectionHeader
              title="Recently Completed"
              icon={<CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-vault-success" />}
              iconColor="text-vault-success"
              action={
                <button onClick={() => navigate('/completed')} className="flex items-center gap-0.5 text-xs md:text-label text-vault-accent hover:text-vault-accent-hover transition-colors font-medium group">
                  View all
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                </button>
              }
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 md:gap-3">
              {recentlyCompleted.map((item, i) => (
                <Reveal key={item.id} delay={Math.min(i, 5) + 1} className="h-full">
                  <TitleCard item={item} showStatus={false} index={i} />
                </Reveal>
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {favorites.length > 0 && (
        <Reveal delay={5}>
          <section className="mb-5 md:mb-8">
            <SectionHeader
              title="Favorites"
              icon={<Heart className="w-4 h-4 md:w-5 md:h-5 text-vault-accent" />}
              iconColor="text-vault-accent"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 md:gap-3">
              {favorites.map((item, i) => (
                <Reveal key={item.id} delay={Math.min(i, 5) + 1} className="h-full">
                  <TitleCard item={item} showStatus={false} index={i} />
                </Reveal>
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {streak.current > 0 && (
        <Reveal delay={6}>
          <section className="mb-5 md:mb-8">
            <div className="vault-card p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4 md:mb-5">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-vault-warning-subtle flex items-center justify-center">
                  <Flame className="w-4 h-4 md:w-5 md:h-5 text-vault-warning" />
                </div>
                <div>
                  <h3 className="text-sm md:text-h3 font-display font-semibold text-vault-text">
                    <span className="text-vault-warning">{streak.current}</span> Day Streak!
                  </h3>
                  <p className="text-[10px] md:text-[11px] text-vault-muted">
                    Longest: {streak.longest} days
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {streak.days.map((day) => (
                  <div
                    key={day.date}
                    className={`flex flex-col items-center gap-1 p-1 sm:p-2 rounded-lg transition-colors duration-300 ${
                      day.watched
                        ? 'bg-vault-success-subtle shadow-sm shadow-vault-success/10'
                        : 'bg-vault-surface-hover'
                    }`}
                  >
                    <span className="text-[8px] sm:text-[9px] text-vault-muted font-medium leading-none">
                      {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
                    </span>
                    <span
                      className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-semibold transition-all duration-300 ${
                        day.watched
                          ? 'bg-vault-success text-white shadow-sm shadow-vault-success/30 scale-100'
                          : 'bg-vault-border text-vault-muted scale-90 opacity-60'
                      }`}
                    >
                      {day.watched ? '\u2713' : '\u00B7'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Reveal>
      )}

      <Reveal delay={7}>
        <section className="mb-5 md:mb-8">
          <SectionHeader title="Summary" icon={<TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-vault-accent" />} />
          <div className="vault-card p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-0">
                <div className="flex items-center justify-between py-2.5 md:py-3 border-b border-vault-border/20">
                  <span className="text-[11px] md:text-body-sm text-vault-muted">Movies Watched</span>
                  <span className="text-[11px] md:text-body-sm font-semibold text-vault-text">{stats.moviesCompleted}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 md:py-3 border-b border-vault-border/20">
                  <span className="text-[11px] md:text-body-sm text-vault-muted">Movie Watch Time</span>
                  <span className="text-[11px] md:text-body-sm font-semibold text-vault-text tabular-nums">{formatMinutes(stats.movieWatchTimeMinutes)}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 md:py-3 border-b border-vault-border/20">
                  <span className="text-[11px] md:text-body-sm text-vault-muted">Series Completed</span>
                  <span className="text-[11px] md:text-body-sm font-semibold text-vault-text">{stats.seriesCompleted}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 md:py-3 border-b border-vault-border/20">
                  <span className="text-[11px] md:text-body-sm text-vault-muted">Series Watch Time</span>
                  <span className="text-[11px] md:text-body-sm font-semibold text-vault-text tabular-nums">{formatMinutes(stats.seriesWatchTimeMinutes)}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 md:py-3 border-b border-vault-border/20">
                  <span className="text-[11px] md:text-body-sm font-semibold text-vault-text">Total Titles Watched</span>
                  <span className="text-[11px] md:text-body-sm font-bold text-vault-success">{stats.totalCompleted}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 md:py-3">
                  <span className="text-[11px] md:text-body-sm font-semibold text-vault-text">Total Watch Time</span>
                  <span className="text-[11px] md:text-body-sm font-bold text-vault-gold tabular-nums">{formatMinutes(stats.totalWatchTimeMinutes)}</span>
                </div>
              </div>
              <div className="hidden md:flex flex-col justify-center gap-6">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] md:text-caption text-vault-muted">Movies share</span>
                    <span className="text-[10px] md:text-caption text-vault-text-secondary tabular-nums">
                      {stats.totalWatchTimeMinutes > 0 ? Math.round((stats.movieWatchTimeMinutes / stats.totalWatchTimeMinutes) * 100) : 0}%
                    </span>
                  </div>
                  <AnimatedProgress
                    value={stats.totalWatchTimeMinutes > 0 ? (stats.movieWatchTimeMinutes / stats.totalWatchTimeMinutes) * 100 : 0}
                    barClassName="vault-progress-accent"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] md:text-caption text-vault-muted">Series share</span>
                    <span className="text-[10px] md:text-caption text-vault-text-secondary tabular-nums">
                      {stats.totalWatchTimeMinutes > 0 ? Math.round((stats.seriesWatchTimeMinutes / stats.totalWatchTimeMinutes) * 100) : 0}%
                    </span>
                  </div>
                  <AnimatedProgress
                    value={stats.totalWatchTimeMinutes > 0 ? (stats.seriesWatchTimeMinutes / stats.totalWatchTimeMinutes) * 100 : 0}
                    barClassName="vault-progress-success"
                  />
                </div>
                <div className="bg-vault-bg/50 rounded-xl p-6 text-center w-full border border-vault-border/20">
                  <p className="text-[11px] text-vault-muted uppercase tracking-widest font-medium mb-3">Total viewing time</p>
                  <p className="text-h1 font-display font-bold text-vault-gold leading-none mb-3 tabular-nums">
                    {watchTime.days > 0 ? `${watchTime.days}d ` : ''}{watchTime.hours}h {watchTime.minutes}m
                  </p>
                  {watchTime.days > 0 && (
                    <p className="text-[11px] text-vault-muted">
                      That's approximately {watchTime.days} days, {watchTime.hours} hours, {watchTime.minutes} minutes of your life.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <PageFooter />
    </div>
  );
}

function ContinueCard({ series, onOpen }: { series: TrackerSeries; onOpen: () => void }) {
  const total = series.seasonProgress.reduce((sum, s) => sum + s.episodes.length, 0);
  const watched = series.seasonProgress.reduce(
    (sum, s) => sum + s.episodes.filter((e) => e.watched).length,
    0
  );
  const percentage = total > 0 ? Math.round((watched / total) * 100) : 0;
  const currentSeason = series.seasonProgress.find((s) => s.episodes.some((e) => !e.watched));
  const currentEp = currentSeason ? currentSeason.episodes.find((e) => !e.watched) : null;

  return (
    <button
      onClick={onOpen}
      className="group relative w-56 sm:w-64 md:w-80 flex-shrink-0 snap-start overflow-hidden rounded-xl bg-vault-card border border-vault-border/40 hover:border-vault-border/70 transition-all duration-300 text-left shadow-vault-sm hover:shadow-vault-card-hover hover:-translate-y-1 vault-card-cinematic"
    >
      <div className="relative h-28 sm:h-32 md:h-36 overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
          <TMDBImage
            path={series.backdrop}
            alt={series.title}
            type="backdrop"
            backdropSize="w780"
            className="w-full h-full object-cover"
            fallbackClassName="w-full h-full"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-vault-card via-transparent to-transparent" />

        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/55 backdrop-blur-sm rounded-md px-2 py-1 border border-white/10">
          <Play className="w-3 h-3 text-vault-info fill-vault-info" />
          <span className="text-[10px] font-semibold text-white tabular-nums">{watched}/{total} eps</span>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-[13px] font-semibold text-white truncate">{series.title}</h3>
        {currentSeason && currentEp && (
          <p className="text-[10px] text-vault-muted mt-0.5">
            Next: Season {currentSeason.seasonNumber} · Episode {currentEp.episodeNumber}
          </p>
        )}
        <div className="mt-2.5">
          <AnimatedProgress
            value={percentage}
            className="!h-[5px]"
            barClassName="vault-progress-accent"
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-vault-muted">{percentage}% complete</span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-vault-accent opacity-80 group-hover:opacity-100 transition-opacity duration-300">
              Continue
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}