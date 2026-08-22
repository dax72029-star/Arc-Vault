const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const TMDB = {
  API_KEY: TMDB_API_KEY,
  BASE_URL: TMDB_BASE_URL,
  IMAGE_BASE: TMDB_IMAGE_BASE,
  poster: (path: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string => {
    if (!path) return '';
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
  },
  backdrop: (path: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'): string => {
    if (!path) return '';
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
  },
  hasApiKey: (): boolean => !!TMDB_API_KEY && TMDB_API_KEY.length > 0,
};

export const STORAGE_KEYS = {
  TRACKER: 'watchvault_tracker',
  HISTORY: 'watchvault_history',
  SETTINGS: 'watchvault_settings',
} as const;
