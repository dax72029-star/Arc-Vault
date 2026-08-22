import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Tv, Play, Clock, CheckCircle2, TrendingUp, Heart, Flame, Search } from 'lucide-react';
import { useTrackerContext } from '../hooks/useTrackerContext';
import { calculateWatchStats, getWatchStreak, formatMinutesDetailed } from '../utils/helpers';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import TitleCard from '../components/TitleCard';

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

  const currentlyWatching = useMemo(() => {
    return items.filter((i) => i.type === 'tv' && i.status === 'watching').slice(0, 4);
  }, [items]);

  const watchTime = formatMinutesDetailed(stats.totalWatchTimeMinutes);

  if (items.length === 0) {
    return (
      <div>
        <EmptyState
          icon={<Search className="w-16 h-16" />}
          title="Welcome to ArcVault"
          description="Start tracking your movies and TV series. Search for a title and add it to your personal tracker."
          actionLabel="Search Movies & Series"
          actionTo="/search"
        />
        <div className="mt-24 pt-8 vault-divider text-center">
          <p className="text-body-sm font-display font-semibold text-vault-text tracking-wide">ArcVault</p>
          <p className="text-[11px] text-vault-muted mt-1.5">
            A personal cinema journey, crafted by <span className="text-vault-text-secondary font-medium">DAX SANANDIYA</span>
          </p>
          <p className="text-[10px] text-vault-muted/50 mt-2">
            © 2026 DAX SANANDIYA · v1.0.0
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 md:mb-10">
        <h1 className="text-h1 font-display font-bold text-vault-text tracking-tight">Dashboard</h1>
        <p className="text-body-sm text-vault-muted mt-1">Your personal watch tracker</p>
      </div>

      <section className="vault-section">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Movies"
            value={stats.totalMovies}
            icon={<Film className="w-5 h-5" />}
            sublabel={`${stats.moviesCompleted} watched`}
          />
          <StatCard
            label="Series"
            value={stats.totalSeries}
            icon={<Tv className="w-5 h-5" />}
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
            value={`${stats.completionPercentage}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="text-vault-success"
            sublabel={`${stats.totalCompleted} / ${items.length} titles`}
          />
        </div>
      </section>

      {stats.totalWatchTimeMinutes > 0 && (
        <section className="vault-section">
          <div className="vault-card p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-vault-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <p className="text-[11px] text-vault-muted uppercase tracking-widest font-medium mb-2">Your cinematic journey so far</p>
              <p className="text-display font-display font-extrabold text-vault-gold leading-none">
                {watchTime.days > 0 ? `${watchTime.days}d ` : ''}{watchTime.hours}h {watchTime.minutes}m
              </p>
              <p className="text-body-sm text-vault-muted mt-3 max-w-md">
                You've completed {stats.totalCompleted} titles across {stats.totalMovies} movies and {stats.totalSeries} series.
                {stats.completionPercentage > 0 && ` That's a ${stats.completionPercentage}% completion rate.`}
              </p>
            </div>
          </div>
        </section>
      )}

      {stats.seriesWatching > 0 && (
        <section className="vault-section">
          <div className="vault-section-header">
            <h2 className="vault-section-title">
              <Play className="w-5 h-5 text-vault-info" />
              Currently Watching
            </h2>
            <button onClick={() => navigate('/watching')} className="vault-section-link">
              View all
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {currentlyWatching.map((item) => (
              <TitleCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {recentlyCompleted.length > 0 && (
        <section className="vault-section">
          <div className="vault-section-header">
            <h2 className="vault-section-title">
              <CheckCircle2 className="w-5 h-5 text-vault-success" />
              Recently Completed
            </h2>
            <button onClick={() => navigate('/completed')} className="vault-section-link">
              View all
            </button>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {recentlyCompleted.map((item) => (
              <TitleCard key={item.id} item={item} showStatus={false} />
            ))}
          </div>
        </section>
      )}

      {favorites.length > 0 && (
        <section className="vault-section">
          <div className="vault-section-header">
            <h2 className="vault-section-title">
              <Heart className="w-5 h-5 text-vault-accent" />
              Favorites
            </h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {favorites.map((item) => (
              <TitleCard key={item.id} item={item} showStatus={false} />
            ))}
          </div>
        </section>
      )}

      {streak.current > 0 && (
        <section className="vault-section">
          <div className="vault-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-vault-warning-subtle flex items-center justify-center">
                <Flame className="w-5 h-5 text-vault-warning" />
              </div>
              <div>
                <h3 className="text-h3 font-display font-semibold text-vault-text">
                  {streak.current} Day Streak!
                </h3>
                <p className="text-[11px] text-vault-muted">
                  Longest: {streak.longest} days
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {streak.days.map((day) => (
                <div
                  key={day.date}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg transition-colors ${
                    day.watched ? 'bg-vault-success-subtle' : 'bg-vault-surface-hover'
                  }`}
                >
                  <span className="text-[10px] text-vault-muted font-medium">
                    {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                      day.watched
                        ? 'bg-vault-success text-white'
                        : 'bg-vault-border text-vault-muted'
                    }`}
                  >
                    {day.watched ? '\u2713' : '\u00B7'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="vault-section">
        <div className="vault-card p-6">
          <h3 className="vault-section-title mb-5">Summary</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-0">
              <div className="flex items-center justify-between py-3 border-b border-vault-border/20">
                <span className="text-body-sm text-vault-muted">Movies Watched</span>
                <span className="text-body-sm font-semibold text-vault-text">{stats.moviesCompleted}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-vault-border/20">
                <span className="text-body-sm text-vault-muted">Movie Watch Time</span>
                <span className="text-body-sm font-semibold text-vault-text">{formatMinutesDetailed(stats.movieWatchTimeMinutes).days > 0 ? `${formatMinutesDetailed(stats.movieWatchTimeMinutes).days}d ` : ''}{formatMinutesDetailed(stats.movieWatchTimeMinutes).hours}h {formatMinutesDetailed(stats.movieWatchTimeMinutes).minutes}m</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-vault-border/20">
                <span className="text-body-sm text-vault-muted">Series Completed</span>
                <span className="text-body-sm font-semibold text-vault-text">{stats.seriesCompleted}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-vault-border/20">
                <span className="text-body-sm text-vault-muted">Series Watch Time</span>
                <span className="text-body-sm font-semibold text-vault-text">{formatMinutesDetailed(stats.seriesWatchTimeMinutes).days > 0 ? `${formatMinutesDetailed(stats.seriesWatchTimeMinutes).days}d ` : ''}{formatMinutesDetailed(stats.seriesWatchTimeMinutes).hours}h {formatMinutesDetailed(stats.seriesWatchTimeMinutes).minutes}m</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-vault-border/20">
                <span className="text-body-sm font-semibold text-vault-text">Total Titles Watched</span>
                <span className="text-body-sm font-bold text-vault-success">{stats.totalCompleted}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-body-sm font-semibold text-vault-text">Total Watch Time</span>
                <span className="text-body-sm font-bold text-vault-gold">{formatMinutesDetailed(stats.totalWatchTimeMinutes).days > 0 ? `${formatMinutesDetailed(stats.totalWatchTimeMinutes).days}d ` : ''}{formatMinutesDetailed(stats.totalWatchTimeMinutes).hours}h {formatMinutesDetailed(stats.totalWatchTimeMinutes).minutes}m</span>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="bg-vault-bg/50 rounded-xl p-6 text-center w-full border border-vault-border/20">
                <p className="text-[11px] text-vault-muted uppercase tracking-widest font-medium mb-3">Total viewing time</p>
                <p className="text-h1 font-display font-bold text-vault-gold leading-none mb-3">
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

      <div className="mt-16 pt-8 vault-divider text-center">
        <p className="text-body-sm font-display font-semibold text-vault-text tracking-wide">ArcVault</p>
        <p className="text-[11px] text-vault-muted mt-1.5">
          A personal cinema journey, crafted by <span className="text-vault-text-secondary font-medium">DAX SANANDIYA</span>
        </p>
        <p className="text-[10px] text-vault-muted/50 mt-2">
          &copy; 2026 DAX SANANDIYA &middot; v1.0.0
        </p>
      </div>
    </div>
  );
}
