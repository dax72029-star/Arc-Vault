const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
const TMDB_HOST = 'image.tmdb.org';

function resolveImagePath(path: string | null | undefined): string | null {
  if (!path || typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      if (url.hostname === TMDB_HOST) {
        const pathMatch = url.pathname.match(/\/t\/p\/(w\d+|original)(\/.+)/);
        if (pathMatch) return pathMatch[2];
      }
      return trimmed;
    } catch {
      return null;
    }
  }
  if (trimmed.startsWith('/')) return trimmed;
  return null;
}

export const TMDB = {
  API_KEY: TMDB_API_KEY,
  BASE_URL: TMDB_BASE_URL,
  IMAGE_BASE: TMDB_IMAGE_BASE,
  poster: (path: string | null | undefined, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string => {
    const resolved = resolveImagePath(path);
    if (!resolved) return '';
    if (resolved.startsWith('http://') || resolved.startsWith('https://')) return resolved;
    return `${TMDB_IMAGE_BASE}/${size}${resolved}`;
  },
  backdrop: (path: string | null | undefined, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'): string => {
    const resolved = resolveImagePath(path);
    if (!resolved) return '';
    if (resolved.startsWith('http://') || resolved.startsWith('https://')) return resolved;
    return `${TMDB_IMAGE_BASE}/${size}${resolved}`;
  },
  hasApiKey: (): boolean => !!TMDB_API_KEY && TMDB_API_KEY.length > 0,
};

export const STORAGE_KEYS = {
  TRACKER: 'watchvault_tracker',
  HISTORY: 'watchvault_history',
  SETTINGS: 'watchvault_settings',
} as const;
