import { TMDB } from '../config/tmdb';
import type {
  TMDBPaginatedResponse,
  TMDBSearchResult,
  TMDBMovieDetail,
  TMDBTVDetail,
  TMDBSeason,
} from '../types';

function validateId(id: number, label: string): void {
  if (!Number.isFinite(id) || !Number.isInteger(id) || id <= 0) {
    throw new Error(`Invalid ${label}`);
  }
}

async function fetchTMDB<T>(endpoint: string, params: Record<string, string> = {}, signal?: AbortSignal): Promise<T> {
  if (!TMDB.hasApiKey()) {
    throw new Error('TMDB API key not configured. Add VITE_TMDB_API_KEY to your .env file.');
  }

  const url = new URL(`${TMDB.BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', TMDB.API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await fetch(url.toString(), signal ? { signal } : undefined);
  if (!response.ok) {
    throw new Error('Failed to fetch data from TMDB');
  }
  return response.json();
}

export async function searchMulti(query: string, page = 1, signal?: AbortSignal): Promise<TMDBPaginatedResponse<TMDBSearchResult>> {
  return fetchTMDB('/search/multi', {
    query,
    page: String(page),
    include_adult: 'false',
  }, signal);
}

export async function searchMovies(query: string, page = 1): Promise<TMDBPaginatedResponse<TMDBSearchResult>> {
  return fetchTMDB('/search/movie', {
    query,
    page: String(page),
    include_adult: 'false',
  });
}

export async function searchTV(query: string, page = 1): Promise<TMDBPaginatedResponse<TMDBSearchResult>> {
  return fetchTMDB('/search/tv', {
    query,
    page: String(page),
    include_adult: 'false',
  });
}

export async function getMovieDetail(id: number, signal?: AbortSignal): Promise<TMDBMovieDetail> {
  validateId(id, 'movie ID');
  return fetchTMDB(`/movie/${id}`, {}, signal);
}

export async function getTVDetail(id: number, signal?: AbortSignal): Promise<TMDBTVDetail> {
  validateId(id, 'TV ID');
  return fetchTMDB(`/tv/${id}`, {}, signal);
}

export async function getTVSeasonDetail(tvId: number, seasonNumber: number, signal?: AbortSignal): Promise<TMDBSeason> {
  validateId(tvId, 'TV ID');
  validateId(seasonNumber, 'season number');
  return fetchTMDB(`/tv/${tvId}/season/${seasonNumber}`, {}, signal);
}

export async function getTrending(): Promise<TMDBPaginatedResponse<TMDBSearchResult>> {
  return fetchTMDB('/trending/all/week');
}

export async function getPopularMovies(): Promise<TMDBPaginatedResponse<TMDBSearchResult>> {
  return fetchTMDB('/movie/popular');
}

export async function getPopularTV(): Promise<TMDBPaginatedResponse<TMDBSearchResult>> {
  return fetchTMDB('/tv/popular');
}

export async function getTopRatedMovies(): Promise<TMDBPaginatedResponse<TMDBSearchResult>> {
  return fetchTMDB('/movie/top_rated');
}

export async function getTopRatedTV(): Promise<TMDBPaginatedResponse<TMDBSearchResult>> {
  return fetchTMDB('/tv/top_rated');
}

export async function getUpcomingMovies(): Promise<TMDBPaginatedResponse<TMDBSearchResult>> {
  return fetchTMDB('/movie/upcoming');
}
