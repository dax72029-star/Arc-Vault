import { TMDB } from '../config/tmdb';
import { getTracker, saveTracker } from './storage';
import type {
  EpisodeProgress,
  SeasonProgress,
  TMDBMovieDetail,
  TMDBSearchResult,
  TMDBTVDetail,
  TrackerItem,
  TrackerMovie,
  TrackerSeries,
} from '../types';

export interface ImportItem {
  tmdbId?: number;
  type: 'movie' | 'tv';
  title: string;
  status?: string;
  personalRating?: number;
  favorite?: boolean;
  dateWatched?: string | null;
  dateAdded?: string;
  seasonProgress?: SeasonProgress[];
}

export interface ResolvedTitle {
  tmdbId: number;
  type: 'movie' | 'tv';
  title: string;
  poster: string | null;
  backdrop: string | null;
  releaseDate: string;
  releaseYear: number;
  genres: string[];
  description: string;
  tmdbRating: number;
  runtime?: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  seasons?: { seasonNumber: number; episodeCount: number }[];
}

export interface ResolutionProgress {
  total: number;
  resolved: number;
  needsReview: number;
  failed: number;
  currentItem?: string;
}

export interface ResolutionResult {
  trackerItems: (TrackerMovie | TrackerSeries)[];
  needsReview: ImportItem[];
  failed: ImportItem[];
  stats: {
    total: number;
    resolved: number;
    needsReview: number;
    failed: number;
    duplicates: number;
  };
}

export type MatchConfidence = 'high' | 'medium' | 'low' | 'ambiguous';

const CONCURRENCY_LIMIT = 3;
const BATCH_DELAY_MS = 200;
const HIGH_CONFIDENCE_MIN = 65;
const MEDIUM_CONFIDENCE_MIN = 40;
const LOW_CONFIDENCE_MIN = 20;
const CLOSE_SCORE_MARGIN = 5;
const MAX_CANDIDATES = 10;
const MIN_VALID_YEAR = 1888;

type MediaType = 'movie' | 'tv';

interface ScoredCandidate {
  candidate: TMDBSearchResult;
  score: number;
  confidence: MatchConfidence;
}

type ResolveOutcome =
  | { status: 'resolved'; resolved: ResolvedTitle }
  | { status: 'review'; reason: string }
  | { status: 'failed'; reason: string };

const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'of', 'in', 'on', 'to', 'for', 'part']);

const COMPLETED_STATUSES = new Set(['completed', 'watched', 'finished', 'done', 'seen']);
const WATCHING_STATUSES = new Set([
  'watching',
  'in progress',
  'current',
  'currently watching',
  'active',
  'ongoing',
]);
const PENDING_STATUSES = new Set([
  'pending',
  'planned',
  'plan to watch',
  'want to watch',
  'backlog',
  'unwatched',
  'queued',
]);

async function fetchTMDB<T>(
  endpoint: string,
  params: Record<string, string> = {},
  signal?: AbortSignal
): Promise<T> {
  if (!TMDB.hasApiKey()) {
    throw new Error('TMDB API key not configured. Add VITE_TMDB_API_KEY to your .env file.');
  }

  const url = new URL(`${TMDB.BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', TMDB.API_KEY);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url.toString(), signal ? { signal } : undefined);
  if (!response.ok) {
    throw new Error(`TMDB request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function isValidYear(year: number, maxYear = 2100): boolean {
  return Number.isInteger(year) && year >= MIN_VALID_YEAR && year <= maxYear;
}

function extractYear(title: string): { cleanTitle: string; year: number | null } {
  const parenMatch = title.match(/\((\d{4})\)/);
  if (parenMatch) {
    const year = parseInt(parenMatch[1], 10);
    if (isValidYear(year)) {
      return { cleanTitle: title.replace(/\s*\(\d{4}\)\s*/g, ' ').trim(), year };
    }
  }

  const maxYear = new Date().getFullYear() + 1;
  const bareMatch = title.match(/[\s,:-]+((?:18|19|20)\d{2})\s*$/);
  if (bareMatch && bareMatch.index !== undefined && bareMatch.index > 0) {
    const year = parseInt(bareMatch[1], 10);
    if (isValidYear(year, maxYear)) {
      return { cleanTitle: title.slice(0, bareMatch.index).trim(), year };
    }
  }

  return { cleanTitle: title.trim(), year: null };
}

function getCandidateTitle(candidate: TMDBSearchResult): string {
  return (candidate.media_type === 'movie' ? candidate.title : candidate.name) ?? '';
}

function extractCandidateYear(candidate: TMDBSearchResult): number | null {
  const date = candidate.release_date || candidate.first_air_date || '';
  if (!date) return null;
  const year = parseInt(date.slice(0, 4), 10);
  return isValidYear(year) ? year : null;
}

function partialWordScore(queryNorm: string, candidateNorm: string): number {
  const queryWords = queryNorm.split(' ').filter((w) => w.length > 0 && !STOP_WORDS.has(w));
  const candidateWords = candidateNorm.split(' ').filter((w) => w.length > 0 && !STOP_WORDS.has(w));
  if (queryWords.length === 0 || candidateWords.length === 0) return 0;

  const candidateSet = new Set(candidateWords);
  let matched = 0;
  for (const word of queryWords) {
    if (candidateSet.has(word)) matched++;
  }
  if (matched === 0) return 0;

  const ratio = matched / Math.max(queryWords.length, candidateWords.length);
  return Math.round(ratio * 20);
}

function getConfidence(score: number): MatchConfidence {
  if (score >= HIGH_CONFIDENCE_MIN) return 'high';
  if (score >= MEDIUM_CONFIDENCE_MIN) return 'medium';
  if (score >= LOW_CONFIDENCE_MIN) return 'low';
  return 'ambiguous';
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\u2018\u2019\u02bc\u2032]/g, '')
    .replace(/[\u201c\u201d]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['"]/g, '')
    .replace(/[:-\u2013\u2014_]+/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function scoreCandidate(
  item: ImportItem,
  candidate: TMDBSearchResult
): { score: number; confidence: MatchConfidence } {
  const { cleanTitle, year } = extractYear(item.title ?? '');
  const queryNorm = normalizeTitle(cleanTitle);
  const candidateNorm = normalizeTitle(getCandidateTitle(candidate));

  if (!queryNorm || !candidateNorm) {
    return { score: 0, confidence: 'ambiguous' };
  }

  let score = 0;

  if (queryNorm === candidateNorm) {
    score += 40;
  } else if (candidateNorm.includes(queryNorm) || queryNorm.includes(candidateNorm)) {
    score += 25;
  } else {
    score += partialWordScore(queryNorm, candidateNorm);
  }

  const candidateYear = extractCandidateYear(candidate);
  if (year !== null && candidateYear !== null) {
    const diff = Math.abs(year - candidateYear);
    if (diff === 0) score += 30;
    else if (diff === 1) score += 15;
    else if (diff <= 3) score += 5;
    else score -= 10;
  }

  const rating =
    typeof candidate.vote_average === 'number' && Number.isFinite(candidate.vote_average)
      ? candidate.vote_average
      : 0;
  score += Math.max(0, Math.min(10, Math.round(rating)));

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, confidence: getConfidence(score) };
}

async function searchCandidates(
  query: string,
  type: MediaType,
  year: number | null,
  signal?: AbortSignal
): Promise<TMDBSearchResult[]> {
  const params: Record<string, string> = { query, include_adult: 'false' };
  if (year !== null) {
    if (type === 'movie') params.primary_release_year = String(year);
    else params.first_air_date_year = String(year);
  }

  const endpoint = type === 'movie' ? '/search/movie' : '/search/tv';
  const data = await fetchTMDB<{ results?: TMDBSearchResult[] }>(endpoint, params, signal);
  const results = Array.isArray(data.results) ? data.results : [];

  return results
    .filter((result) => !result.media_type || result.media_type === type)
    .map((result) => ({ ...result, media_type: type }))
    .slice(0, MAX_CANDIDATES);
}

async function fetchDetail(
  tmdbId: number,
  type: MediaType,
  signal?: AbortSignal
): Promise<TMDBMovieDetail | TMDBTVDetail> {
  if (type === 'movie') {
    return fetchTMDB<TMDBMovieDetail>(`/movie/${tmdbId}`, {}, signal);
  }
  return fetchTMDB<TMDBTVDetail>(`/tv/${tmdbId}`, {}, signal);
}

function isValidTmdbId(id: unknown): id is number {
  return typeof id === 'number' && Number.isInteger(id) && id > 0;
}

function parseYearFromDate(date: string | undefined): number {
  if (!date) return 0;
  const year = parseInt(date.slice(0, 4), 10);
  return Number.isFinite(year) ? year : 0;
}

function detailToResolved(detail: TMDBMovieDetail | TMDBTVDetail, type: MediaType): ResolvedTitle {
  if (type === 'movie') {
    const movie = detail as TMDBMovieDetail;
    return {
      tmdbId: movie.id,
      type: 'movie',
      title: movie.title ?? '',
      poster: movie.poster_path ?? null,
      backdrop: movie.backdrop_path ?? null,
      releaseDate: movie.release_date ?? '',
      releaseYear: parseYearFromDate(movie.release_date),
      genres: Array.isArray(movie.genres) ? movie.genres.map((genre) => genre.name) : [],
      description: movie.overview ?? '',
      tmdbRating:
        typeof movie.vote_average === 'number' && Number.isFinite(movie.vote_average)
          ? movie.vote_average
          : 0,
      runtime:
        typeof movie.runtime === 'number' && movie.runtime > 0 ? movie.runtime : undefined,
    };
  }

  const series = detail as TMDBTVDetail;
  return {
    tmdbId: series.id,
    type: 'tv',
    title: series.name ?? '',
    poster: series.poster_path ?? null,
    backdrop: series.backdrop_path ?? null,
    releaseDate: series.first_air_date ?? '',
    releaseYear: parseYearFromDate(series.first_air_date),
    genres: Array.isArray(series.genres) ? series.genres.map((genre) => genre.name) : [],
    description: series.overview ?? '',
    tmdbRating:
      typeof series.vote_average === 'number' && Number.isFinite(series.vote_average)
        ? series.vote_average
        : 0,
    numberOfSeasons:
      typeof series.number_of_seasons === 'number' && series.number_of_seasons > 0
        ? series.number_of_seasons
        : 0,
    numberOfEpisodes:
      typeof series.number_of_episodes === 'number' && series.number_of_episodes > 0
        ? series.number_of_episodes
        : 0,
    seasons: Array.isArray(series.seasons)
      ? series.seasons
          .filter((s) => s.season_number > 0)
          .map((s) => ({ seasonNumber: s.season_number, episodeCount: s.episode_count }))
      : undefined,
  };
}

async function attemptResolve(item: ImportItem, signal?: AbortSignal): Promise<ResolveOutcome> {
  const rawTitle = typeof item.title === 'string' ? item.title.trim() : '';
  const type: MediaType = item.type;

  if (!rawTitle) {
    return { status: 'failed', reason: 'Missing or empty title' };
  }

  try {
    if (isValidTmdbId(item.tmdbId)) {
      const detail = await fetchDetail(item.tmdbId, type, signal);
      if (!detail || !isValidTmdbId(detail.id)) {
        return { status: 'failed', reason: 'TMDB returned invalid details' };
      }
      return { status: 'resolved', resolved: detailToResolved(detail, type) };
    }

    const { cleanTitle, year } = extractYear(rawTitle);
    const query = cleanTitle || rawTitle;
    const candidates = await searchCandidates(query, type, year, signal);

    if (candidates.length === 0) {
      return { status: 'failed', reason: 'No TMDB results found' };
    }

    const scored: ScoredCandidate[] = candidates
      .map((candidate) => ({ candidate, ...scoreCandidate(item, candidate) }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    const runnerUp = scored[1];

    if (best.confidence === 'low' || best.confidence === 'ambiguous') {
      return { status: 'review', reason: `Low confidence match (score ${best.score})` };
    }

    if (
      best.confidence === 'medium' &&
      runnerUp &&
      runnerUp.confidence === 'high' &&
      best.score - runnerUp.score <= CLOSE_SCORE_MARGIN
    ) {
      return { status: 'review', reason: 'Ambiguous between top candidates' };
    }

    const detail = await fetchDetail(best.candidate.id, type, signal);
    if (!detail || !isValidTmdbId(detail.id)) {
      return { status: 'failed', reason: 'TMDB returned invalid details' };
    }
    return { status: 'resolved', resolved: detailToResolved(detail, type) };
  } catch (error) {
    if (signal?.aborted) {
      return { status: 'failed', reason: 'Aborted' };
    }
    return {
      status: 'failed',
      reason: error instanceof Error ? error.message : 'Unknown error during resolution',
    };
  }
}

export async function resolveTitle(
  item: ImportItem,
  signal?: AbortSignal
): Promise<ResolvedTitle | null> {
  const outcome = await attemptResolve(item, signal);
  return outcome.status === 'resolved' ? outcome.resolved : null;
}

function sanitizeDateString(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return trimmed;
}

function clampPersonalRating(raw: unknown): number {
  const value = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(10, Math.round(value * 10) / 10);
}

function generateTrackerId(prefix: 'mv' | 'sv', tmdbId: number): string {
  return `${prefix}_${tmdbId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeMovieStatus(raw: unknown): TrackerMovie['status'] {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (value === 'pending' || PENDING_STATUSES.has(value)) return 'pending';
  if (value === 'completed' || COMPLETED_STATUSES.has(value)) return 'completed';
  return 'pending';
}

function normalizeSeriesStatus(raw: unknown): TrackerSeries['status'] {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (value === 'pending' || PENDING_STATUSES.has(value)) return 'pending';
  if (value === 'watching' || WATCHING_STATUSES.has(value)) return 'watching';
  if (value === 'completed' || COMPLETED_STATUSES.has(value)) return 'completed';
  return 'pending';
}

function sanitizeEpisodeProgress(raw: unknown): EpisodeProgress | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const episodeNumber = obj.episodeNumber;
  if (typeof episodeNumber !== 'number' || !Number.isInteger(episodeNumber) || episodeNumber <= 0) {
    return null;
  }
  return {
    episodeNumber,
    watched: obj.watched === true,
    runtime:
      typeof obj.runtime === 'number' && Number.isFinite(obj.runtime) ? obj.runtime : null,
  };
}

function sanitizeSeasonProgressList(raw: unknown): SeasonProgress[] {
  if (!Array.isArray(raw)) return [];
  const seasons: SeasonProgress[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const obj = entry as Record<string, unknown>;
    const seasonNumber = obj.seasonNumber;
    if (typeof seasonNumber !== 'number' || !Number.isInteger(seasonNumber) || seasonNumber < 0) {
      continue;
    }
    const episodes = Array.isArray(obj.episodes)
      ? obj.episodes
          .map(sanitizeEpisodeProgress)
          .filter((episode): episode is EpisodeProgress => episode !== null)
      : [];
    const episodeCount =
      typeof obj.episodeCount === 'number' && Number.isFinite(obj.episodeCount)
        ? Math.max(Math.floor(obj.episodeCount), episodes.length)
        : episodes.length;
    seasons.push({ seasonNumber, episodeCount, episodes });
  }
  return seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
}

function createEmptySeasonSkeleton(numberOfSeasons: number): SeasonProgress[] {
  const seasons: SeasonProgress[] = [];
  for (let seasonNumber = 1; seasonNumber <= numberOfSeasons; seasonNumber++) {
    seasons.push({ seasonNumber, episodeCount: 0, episodes: [] });
  }
  return seasons;
}

function buildSeasonProgress(resolved: ResolvedTitle, item: ImportItem): SeasonProgress[] {
  const provided = sanitizeSeasonProgressList(item.seasonProgress);
  if (provided.length > 0) return provided;

  if (resolved.seasons && resolved.seasons.length > 0) {
    return resolved.seasons.map((s) => ({
      seasonNumber: s.seasonNumber,
      episodeCount: s.episodeCount,
      episodes: Array.from({ length: s.episodeCount }, (_, i) => ({
        episodeNumber: i + 1,
        watched: false,
        runtime: null,
      })),
    }));
  }

  return createEmptySeasonSkeleton(resolved.numberOfSeasons ?? 0);
}

export function buildTrackerItem(
  resolved: ResolvedTitle,
  item: ImportItem,
  existingId?: string
): TrackerItem {
  const dateAdded = sanitizeDateString(item.dateAdded) ?? new Date().toISOString();
  const personalRating = clampPersonalRating(item.personalRating);
  const favorite = item.favorite === true;

  if (resolved.type === 'movie') {
    const status = normalizeMovieStatus(item.status);
    let dateWatched = sanitizeDateString(item.dateWatched);
    if (status === 'completed' && !dateWatched) {
      dateWatched = dateAdded;
    }
    const movie: TrackerMovie = {
      id: existingId ?? generateTrackerId('mv', resolved.tmdbId),
      tmdbId: resolved.tmdbId,
      type: 'movie',
      title: resolved.title,
      poster: resolved.poster,
      backdrop: resolved.backdrop,
      releaseDate: resolved.releaseDate,
      releaseYear: resolved.releaseYear,
      genres: [...resolved.genres],
      description: resolved.description,
      runtime: typeof resolved.runtime === 'number' ? resolved.runtime : 0,
      tmdbRating: resolved.tmdbRating,
      personalRating,
      status,
      dateAdded,
      dateWatched,
      favorite,
    };
    return movie;
  }

  const status = normalizeSeriesStatus(item.status);
  const watchedDate = sanitizeDateString(item.dateWatched);

  const series: TrackerSeries = {
    id: existingId ?? generateTrackerId('sv', resolved.tmdbId),
    tmdbId: resolved.tmdbId,
    type: 'tv',
    title: resolved.title,
    poster: resolved.poster,
    backdrop: resolved.backdrop,
    releaseDate: resolved.releaseDate,
    releaseYear: resolved.releaseYear,
    genres: [...resolved.genres],
    description: resolved.description,
    numberOfSeasons: resolved.numberOfSeasons ?? 0,
    numberOfEpisodes: resolved.numberOfEpisodes ?? 0,
    tmdbRating: resolved.tmdbRating,
    personalRating,
    status,
    dateAdded,
    dateStarted: status === 'pending' ? null : dateAdded,
    dateCompleted: status === 'completed' ? watchedDate ?? dateAdded : null,
    favorite,
    seasonProgress: buildSeasonProgress(resolved, item),
  };
  return series;
}

export async function resolveImportItems(
  items: ImportItem[],
  onProgress?: (progress: ResolutionProgress) => void,
  signal?: AbortSignal
): Promise<ResolutionResult> {
  const trackerItems: (TrackerMovie | TrackerSeries)[] = [];
  const needsReview: ImportItem[] = [];
  const failed: ImportItem[] = [];
  const seenKeys = new Set<string>();

  let resolvedCount = 0;
  let reviewCount = 0;
  let failedCount = 0;
  let duplicates = 0;
  let nextIndex = 0;

  const total = items.length;

  const emitProgress = (): void => {
    onProgress?.({
      total,
      resolved: resolvedCount,
      needsReview: reviewCount,
      failed: failedCount,
      currentItem: items[nextIndex]?.title,
    });
  };

  emitProgress();

  const processItem = async (item: ImportItem): Promise<void> => {
    if (signal?.aborted) {
      failedCount++;
      failed.push(item);
      nextIndex++;
      emitProgress();
      return;
    }

    const outcome = await attemptResolve(item, signal);

    if (outcome.status === 'resolved') {
      const key = `${outcome.resolved.tmdbId}|${outcome.resolved.type}`;
      if (seenKeys.has(key)) {
        duplicates++;
      } else {
        seenKeys.add(key);
        trackerItems.push(buildTrackerItem(outcome.resolved, item));
        resolvedCount++;
      }
    } else if (outcome.status === 'review') {
      reviewCount++;
      needsReview.push(item);
    } else {
      failedCount++;
      failed.push(item);
    }

    nextIndex++;
    emitProgress();
  };

  for (let start = 0; start < total; start += CONCURRENCY_LIMIT) {
    if (signal?.aborted) break;

    const batch = items.slice(start, start + CONCURRENCY_LIMIT);
    await Promise.all(batch.map(processItem));

    if (start + CONCURRENCY_LIMIT < total && !signal?.aborted) {
      await delay(BATCH_DELAY_MS, signal);
    }
  }

  onProgress?.({
    total,
    resolved: resolvedCount,
    needsReview: reviewCount,
    failed: failedCount,
  });

  return {
    trackerItems,
    needsReview,
    failed,
    stats: {
      total,
      resolved: resolvedCount,
      needsReview: reviewCount,
      failed: failedCount,
      duplicates,
    },
  };
}

export interface EnrichmentProgress {
  total: number;
  enriched: number;
  current?: string;
}

export async function enrichTrackerAfterImport(
  onProgress?: (progress: EnrichmentProgress) => void,
  signal?: AbortSignal
): Promise<{ enriched: number; total: number }> {
  const tracker = getTracker();
  const needsEnrichment: { index: number; item: TrackerItem }[] = [];

  for (let i = 0; i < tracker.length; i++) {
    const item = tracker[i];
    if (item.type === 'movie') {
      const movie = item as TrackerMovie;
      if (movie.status === 'completed') {
        if (movie.runtime === 0 || !movie.dateWatched) {
          needsEnrichment.push({ index: i, item });
        }
      }
    } else {
      const series = item as TrackerSeries;
      const hasEmptyEpisodes = series.seasonProgress.length === 0 ||
        series.seasonProgress.every((s) => s.episodes.length === 0);
      if (hasEmptyEpisodes && series.numberOfEpisodes > 0) {
        needsEnrichment.push({ index: i, item });
      }
    }
  }

  if (needsEnrichment.length === 0) {
    return { enriched: 0, total: 0 };
  }

  let enriched = 0;
  const total = needsEnrichment.length;

  onProgress?.({ total, enriched: 0 });

  for (const entry of needsEnrichment) {
    if (signal?.aborted) break;

    onProgress?.({ total, enriched, current: entry.item.title });

    try {
      const detail = await fetchDetail(entry.item.tmdbId, entry.item.type, signal);

      if (entry.item.type === 'movie') {
        const movie = entry.item as TrackerMovie;
        const movieDetail = detail as TMDBMovieDetail;
        const updates: Record<string, unknown> = {};

        if (movie.runtime === 0 && typeof movieDetail.runtime === 'number' && movieDetail.runtime > 0) {
          updates.runtime = movieDetail.runtime;
        }
        if (!movie.dateWatched) {
          updates.dateWatched = movie.dateAdded;
        }

        if (Object.keys(updates).length > 0) {
          const updated = { ...movie, ...updates } as TrackerMovie;
          tracker[entry.index] = updated;
          enriched++;
        }
      } else {
        const series = entry.item as TrackerSeries;
        const tvDetail = detail as TMDBTVDetail;
        const hasEmptyEpisodes = series.seasonProgress.length === 0 ||
          series.seasonProgress.every((s) => s.episodes.length === 0);

        if (hasEmptyEpisodes && Array.isArray(tvDetail.seasons) && tvDetail.seasons.length > 0) {
          const newSeasons: SeasonProgress[] = tvDetail.seasons
            .filter((s) => s.season_number > 0)
            .map((s) => ({
              seasonNumber: s.season_number,
              episodeCount: s.episode_count,
              episodes: Array.from({ length: s.episode_count }, (_, i) => ({
                episodeNumber: i + 1,
                watched: false,
                runtime: null as number | null,
              })),
            }));
          const updated = { ...series, seasonProgress: newSeasons } as TrackerSeries;
          tracker[entry.index] = updated;
          enriched++;
        }
      }
    } catch {
      // Skip failed items
    }

    if (!signal?.aborted) {
      await delay(100, signal);
    }
  }

  if (enriched > 0) {
    saveTracker(tracker);
  }

  onProgress?.({ total, enriched });
  return { enriched, total };
}
