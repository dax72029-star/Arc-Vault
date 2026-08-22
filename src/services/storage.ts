import { STORAGE_KEYS } from '../config/tmdb';
import type { TrackerItem, TrackerMovie, TrackerSeries, HistoryEntry, SeasonProgress, EpisodeProgress } from '../types';

const MAX_IMPORT_SIZE = 10 * 1024 * 1024;
const VALID_MOVIE_STATUSES = ['pending', 'completed'];
const VALID_SERIES_STATUSES = ['pending', 'watching', 'completed'];
const VALID_MEDIA_TYPES = ['movie', 'tv'];

function isValidTrackerItem(item: unknown): item is TrackerItem {
  if (typeof item !== 'object' || item === null) return false;
  const obj = item as Record<string, unknown>;
  if (!VALID_MEDIA_TYPES.includes(obj.type as string)) return false;
  if (typeof obj.tmdbId !== 'number' || !Number.isFinite(obj.tmdbId) || obj.tmdbId <= 0) return false;
  if (typeof obj.title !== 'string') return false;
  if (typeof obj.id !== 'string') return false;
  if (obj.type === 'movie') {
    if (!VALID_MOVIE_STATUSES.includes(obj.status as string)) return false;
  } else if (obj.type === 'tv') {
    if (!VALID_SERIES_STATUSES.includes(obj.status as string)) return false;
  }
  return true;
}

function isValidHistoryEntry(entry: unknown): entry is HistoryEntry {
  if (typeof entry !== 'object' || entry === null) return false;
  const obj = entry as Record<string, unknown>;
  if (!VALID_MEDIA_TYPES.includes(obj.type as string)) return false;
  if (typeof obj.id !== 'string' || typeof obj.title !== 'string' || typeof obj.action !== 'string') return false;
  if (typeof obj.date !== 'string' || typeof obj.tmdbId !== 'number') return false;
  return true;
}

function safeGetJSON<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

function safeSetJSON(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    if (import.meta.env.DEV) {
      console.error('LocalStorage write error');
    }
  }
}

export function getTracker(): TrackerItem[] {
  return safeGetJSON<TrackerItem[]>(STORAGE_KEYS.TRACKER, []);
}

export function saveTracker(items: TrackerItem[]): void {
  safeSetJSON(STORAGE_KEYS.TRACKER, items);
}

export function getHistory(): HistoryEntry[] {
  return safeGetJSON<HistoryEntry[]>(STORAGE_KEYS.HISTORY, []);
}

export function saveHistory(history: HistoryEntry[]): void {
  safeSetJSON(STORAGE_KEYS.HISTORY, history);
}

export function addHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'date'>): HistoryEntry {
  const history = getHistory();
  const newEntry: HistoryEntry = {
    ...entry,
    id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
  };
  history.unshift(newEntry);
  saveHistory(history);
  return newEntry;
}

export function addTitle(item: TrackerItem): boolean {
  const tracker = getTracker();
  const exists = tracker.some(
    (t) => t.tmdbId === item.tmdbId && t.type === item.type
  );
  if (exists) return false;
  tracker.push(item);
  saveTracker(tracker);
  return true;
}

export function removeTitle(tmdbId: number, type: 'movie' | 'tv'): boolean {
  const tracker = getTracker();
  const index = tracker.findIndex(
    (t) => t.tmdbId === tmdbId && t.type === type
  );
  if (index === -1) return false;
  tracker.splice(index, 1);
  saveTracker(tracker);
  return true;
}

export function isTracked(tmdbId: number, type: 'movie' | 'tv'): boolean {
  const tracker = getTracker();
  return tracker.some((t) => t.tmdbId === tmdbId && t.type === type);
}

export function getTitle(tmdbId: number, type: 'movie' | 'tv'): TrackerItem | undefined {
  const tracker = getTracker();
  return tracker.find((t) => t.tmdbId === tmdbId && t.type === type);
}

export function updateTitle(tmdbId: number, type: 'movie' | 'tv', updates: Partial<TrackerItem>): TrackerItem | null {
  const tracker = getTracker();
  const index = tracker.findIndex(
    (t) => t.tmdbId === tmdbId && t.type === type
  );
  if (index === -1) return null;
  const existing = tracker[index];
  const safeUpdates: Record<string, unknown> = {};
  const allowedKeys = type === 'movie'
    ? ['personalRating', 'status', 'dateWatched', 'favorite']
    : ['personalRating', 'status', 'dateStarted', 'dateCompleted', 'favorite'];
  for (const key of allowedKeys) {
    if (key in updates) {
      safeUpdates[key] = (updates as Record<string, unknown>)[key];
    }
  }
  tracker[index] = { ...existing, ...safeUpdates } as TrackerItem;
  saveTracker(tracker);
  return tracker[index];
}

export function getMovies(): TrackerMovie[] {
  return getTracker().filter((t): t is TrackerMovie => t.type === 'movie');
}

export function getSeries(): TrackerSeries[] {
  return getTracker().filter((t): t is TrackerSeries => t.type === 'tv');
}

export function getMoviesByStatus(status: TrackerMovie['status']): TrackerMovie[] {
  return getMovies().filter((m) => m.status === status);
}

export function getSeriesByStatus(status: TrackerSeries['status']): TrackerSeries[] {
  return getSeries().filter((s) => s.status === status);
}

export function createTrackerMovie(data: Omit<TrackerMovie, 'id' | 'dateAdded'>): TrackerMovie {
  return {
    ...data,
    id: `mv_${data.tmdbId}_${Date.now()}`,
    dateAdded: new Date().toISOString(),
  };
}

export function createTrackerSeries(data: Omit<TrackerSeries, 'id' | 'dateAdded' | 'seasonProgress'>, seasonProgress: SeasonProgress[]): TrackerSeries {
  return {
    ...data,
    id: `sv_${data.tmdbId}_${Date.now()}`,
    dateAdded: new Date().toISOString(),
    seasonProgress,
  };
}

export function updateEpisodeProgress(
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
  watched: boolean
): TrackerSeries | null {
  const tracker = getTracker();
  const index = tracker.findIndex(
    (t) => t.tmdbId === tmdbId && t.type === 'tv'
  );
  if (index === -1) return null;

  const series = tracker[index] as TrackerSeries;
  const seasonIdx = series.seasonProgress.findIndex(
    (s) => s.seasonNumber === seasonNumber
  );
  if (seasonIdx === -1) return null;

  const epIdx = series.seasonProgress[seasonIdx].episodes.findIndex(
    (e) => e.episodeNumber === episodeNumber
  );
  if (epIdx === -1) return null;

  series.seasonProgress[seasonIdx].episodes[epIdx].watched = watched;

  const totalEpisodes = series.seasonProgress.reduce(
    (sum, s) => sum + s.episodes.length,
    0
  );
  const watchedEpisodes = series.seasonProgress.reduce(
    (sum, s) => sum + s.episodes.filter((e) => e.watched).length,
    0
  );

  if (watchedEpisodes === 0) {
    series.status = 'pending';
    series.dateStarted = null;
  } else if (watchedEpisodes === totalEpisodes) {
    series.status = 'completed';
    if (!series.dateCompleted) {
      series.dateCompleted = new Date().toISOString();
    }
  } else {
    series.status = 'watching';
    if (!series.dateStarted) {
      series.dateStarted = new Date().toISOString();
    }
  }

  tracker[index] = series;
  saveTracker(tracker);
  return series;
}

export function toggleSeasonWatched(
  tmdbId: number,
  seasonNumber: number,
  watched: boolean
): TrackerSeries | null {
  const tracker = getTracker();
  const index = tracker.findIndex(
    (t) => t.tmdbId === tmdbId && t.type === 'tv'
  );
  if (index === -1) return null;

  const series = tracker[index] as TrackerSeries;
  const seasonIdx = series.seasonProgress.findIndex(
    (s) => s.seasonNumber === seasonNumber
  );
  if (seasonIdx === -1) return null;

  series.seasonProgress[seasonIdx].episodes.forEach((ep) => {
    ep.watched = watched;
  });

  const totalEpisodes = series.seasonProgress.reduce(
    (sum, s) => sum + s.episodes.length,
    0
  );
  const watchedEpisodes = series.seasonProgress.reduce(
    (sum, s) => sum + s.episodes.filter((e) => e.watched).length,
    0
  );

  if (watchedEpisodes === 0) {
    series.status = 'pending';
    series.dateStarted = null;
  } else if (watchedEpisodes === totalEpisodes) {
    series.status = 'completed';
    if (!series.dateCompleted) {
      series.dateCompleted = new Date().toISOString();
    }
  } else {
    series.status = 'watching';
    if (!series.dateStarted) {
      series.dateStarted = new Date().toISOString();
    }
  }

  tracker[index] = series;
  saveTracker(tracker);
  return series;
}

export function exportData(): string {
  const data = {
    version: 1,
    exportDate: new Date().toISOString(),
    tracker: getTracker(),
    history: getHistory(),
  };
  return JSON.stringify(data, null, 2);
}

export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (!data.tracker || !Array.isArray(data.tracker)) {
      throw new Error('Invalid data format');
    }
    if (data.tracker.length > 10000) {
      throw new Error('Import too large');
    }
    const validTracker = data.tracker.filter(isValidTrackerItem);
    if (validTracker.length === 0) {
      throw new Error('No valid items found');
    }
    saveTracker(validTracker);
    if (data.history && Array.isArray(data.history)) {
      const validHistory = data.history.filter(isValidHistoryEntry);
      saveHistory(validHistory);
    }
    return true;
  } catch {
    return false;
  }
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.TRACKER);
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
}
