import type { TrackerItem, TrackerMovie, TrackerSeries, WatchStats, WatchStreak } from '../types';
import { getTracker, getHistory } from '../services/storage';

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return '0m';
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = Math.round(minutes % 60);

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function formatMinutesShort(minutes: number): string {
  if (minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function formatMinutesDetailed(minutes: number): { days: number; hours: number; minutes: number } {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = Math.round(minutes % 60);
  return { days, hours, minutes: mins };
}

export function getMovieWatchTime(movie: TrackerMovie): number {
  if (movie.status !== 'completed') return 0;
  return movie.runtime || 0;
}

export function getSeriesWatchTime(series: TrackerSeries): number {
  let totalMinutes = 0;
  for (const season of series.seasonProgress) {
    for (const ep of season.episodes) {
      if (ep.watched && ep.runtime) {
        totalMinutes += ep.runtime;
      }
    }
  }
  if (totalMinutes > 0) return totalMinutes;
  if (series.status === 'completed' && series.numberOfEpisodes > 0) {
    const avgRuntime = 45;
    return series.numberOfEpisodes * avgRuntime;
  }
  return 0;
}

export function calculateWatchStats(items: TrackerItem[]): WatchStats {
  const movies = items.filter((i): i is TrackerMovie => i.type === 'movie');
  const series = items.filter((i): i is TrackerSeries => i.type === 'tv');

  const moviesCompleted = movies.filter((m) => m.status === 'completed').length;
  const seriesCompleted = series.filter((s) => s.status === 'completed').length;
  const seriesWatching = series.filter((s) => s.status === 'watching').length;

  const movieWatchTimeMinutes = movies.reduce(
    (sum, m) => sum + getMovieWatchTime(m),
    0
  );
  const seriesWatchTimeMinutes = series.reduce(
    (sum, s) => sum + getSeriesWatchTime(s),
    0
  );
  const totalWatchTimeMinutes = movieWatchTimeMinutes + seriesWatchTimeMinutes;

  const totalCompleted = moviesCompleted + seriesCompleted;
  const totalItems = items.length;
  const pendingTitles = items.filter(
    (i) =>
      (i.type === 'movie' && i.status === 'pending') ||
      (i.type === 'tv' && i.status === 'pending')
  ).length;

  const completionPercentage =
    totalItems > 0 ? Math.round((totalCompleted / totalItems) * 1000) / 10 : 0;

  return {
    totalMovies: movies.length,
    moviesCompleted,
    totalSeries: series.length,
    seriesCompleted,
    seriesWatching,
    pendingTitles,
    totalCompleted,
    totalWatchTimeMinutes,
    movieWatchTimeMinutes,
    seriesWatchTimeMinutes,
    completionPercentage,
  };
}

export function getWatchStreak(): WatchStreak {
  const history = getHistory();
  const completionDates = history
    .filter((h) => h.action.includes('Completed') || h.action.includes('Progress'))
    .map((h) => h.date.split('T')[0])
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();

  if (completionDates.length === 0) {
    return { current: 0, longest: 0, days: [] };
  }

  const today = new Date();
  const days: { date: string; watched: boolean }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      watched: completionDates.includes(dateStr),
    });
  }

  let longest = 0;
  let current = 0;
  let tempStreak = 0;

  const sortedDates = [...new Set(completionDates)].sort();
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    longest = Math.max(longest, tempStreak);
  }

  current = 0;
  const todayDate = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (completionDates.includes(dateStr)) {
      current++;
    } else {
      break;
    }
  }

  return { current, longest, days };
}

export function getGenreStats(items: TrackerItem[]): { genre: string; count: number; percentage: number }[] {
  const genreMap = new Map<string, number>();
  const completed = items.filter(
    (i) =>
      (i.type === 'movie' && i.status === 'completed') ||
      (i.type === 'tv' && i.status === 'completed')
  );

  completed.forEach((item) => {
    item.genres.forEach((genre) => {
      genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
    });
  });

  const total = completed.length;
  const stats = Array.from(genreMap.entries())
    .map(([genre, count]) => ({
      genre,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return stats;
}

export function getMonthlyStats(items: TrackerItem[]): { month: string; minutes: number }[] {
  const monthMap = new Map<string, number>();
  const completed = items.filter(
    (i) =>
      (i.type === 'movie' && i.status === 'completed') ||
      (i.type === 'tv' && i.status === 'completed')
  );

  completed.forEach((item) => {
    const dateStr = item.type === 'movie' ? item.dateWatched : item.dateCompleted;
    if (!dateStr) return;
    const d = new Date(dateStr);
    const monthKey = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    const time = item.type === 'movie' ? getMovieWatchTime(item as TrackerMovie) : getSeriesWatchTime(item as TrackerSeries);
    monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + time);
  });

  return Array.from(monthMap.entries())
    .map(([month, minutes]) => ({ month, minutes }))
    .sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateB.getTime() - dateA.getTime();
    });
}

export function getAverageRating(items: TrackerItem[]): number {
  const rated = items.filter((i) => i.personalRating > 0);
  if (rated.length === 0) return 0;
  const total = rated.reduce((sum, i) => sum + i.personalRating, 0);
  return Math.round((total / rated.length) * 10) / 10;
}

export function getTopRated(items: TrackerItem[], limit = 10): TrackerItem[] {
  return items
    .filter((i) => i.personalRating > 0)
    .sort((a, b) => b.personalRating - a.personalRating)
    .slice(0, limit);
}

export function getLongestMovie(items: TrackerItem[]): TrackerMovie | null {
  const completedMovies = items.filter(
    (i): i is TrackerMovie => i.type === 'movie' && i.status === 'completed'
  );
  if (completedMovies.length === 0) return null;
  return completedMovies.reduce((longest, m) =>
    m.runtime > longest.runtime ? m : longest
  );
}

export function getLongestSeries(items: TrackerItem[]): TrackerSeries | null {
  const completedSeries = items.filter(
    (i): i is TrackerSeries => i.type === 'tv' && i.status === 'completed'
  );
  if (completedSeries.length === 0) return null;
  return completedSeries.reduce((longest, s) =>
    s.numberOfEpisodes > longest.numberOfEpisodes ? s : longest
  );
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
