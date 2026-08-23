import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Film, Star, AlertCircle } from 'lucide-react';
import { searchMulti, getTrending, getPopularMovies, getTopRatedMovies } from '../services/tmdb';
import type { TMDBSearchResult, TMDBPaginatedResponse } from '../types';
import { TMDB } from '../config/tmdb';
import SearchResultCard from '../components/SearchResultCard';
import TMDBImage from '../components/TMDBImage';
import { SearchSkeleton } from '../components/LoadingSpinner';
import { useDebounce } from '../hooks/useSearch';

type DiscoverCategory = 'trending' | 'popular-movies' | 'top-rated';

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discoverData, setDiscoverData] = useState<Record<DiscoverCategory, TMDBSearchResult[]>>({
    trending: [],
    'popular-movies': [],
    'top-rated': [],
  });
  const [discoverLoading, setDiscoverLoading] = useState(true);
  const [activeDiscoverTab, setActiveDiscoverTab] = useState<DiscoverCategory>('trending');
  const debouncedQuery = useDebounce(query, 400);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const data: TMDBPaginatedResponse<TMDBSearchResult> = await searchMulti(searchQuery, 1, abortRef.current?.signal);
      const filtered = data.results.filter(
        (r) => r.media_type === 'movie' || r.media_type === 'tv'
      );
      setResults(filtered);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message || 'Search failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  useEffect(() => {
    if (!TMDB.hasApiKey()) return;

    const loadDiscover = async () => {
      setDiscoverLoading(true);
      try {
        const [trending, popular, topRated] = await Promise.all([
          getTrending(),
          getPopularMovies(),
          getTopRatedMovies(),
        ]);
        setDiscoverData({
          trending: trending.results.filter(
            (r) => r.media_type === 'movie' || r.media_type === 'tv'
          ),
          'popular-movies': popular.results.map((r) => ({ ...r, media_type: 'movie' as const })),
          'top-rated': topRated.results.map((r) => ({ ...r, media_type: 'movie' as const })),
        });
      } catch {
        // Silent fail for discover
      } finally {
        setDiscoverLoading(false);
      }
    };
    loadDiscover();
  }, []);

  const isSearching = query.trim().length > 0;
  const discoverItems = discoverData[activeDiscoverTab];

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setError(null);
  };

  if (!TMDB.hasApiKey()) {
    return (
      <div>
        <div className="mb-6 md:mb-10">
          <h1 className="text-xl md:text-h1 font-display font-bold text-vault-text tracking-tight">Search</h1>
          <p className="text-xs md:text-body-sm text-vault-muted mt-1">Find movies and series to track</p>
        </div>
        <div className="vault-card flex flex-col items-center justify-center py-12 md:py-16 px-4 md:px-6 text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-vault-accent-subtle flex items-center justify-center mb-4 md:mb-5">
            <Search className="w-6 h-6 md:w-7 md:h-7 text-vault-accent" />
          </div>
          <h3 className="text-base md:text-h3 font-display text-vault-text mb-2">TMDB API Key Required</h3>
          <p className="text-body-sm text-vault-muted max-w-md mb-8">
            To search movies and series, you need a TMDB API key.
          </p>
          <div className="vault-surface-elevated p-6 max-w-md w-full text-left">
            <p className="text-caption uppercase tracking-widest text-vault-muted font-medium mb-3">
              How to get your API key
            </p>
            <ol className="text-meta text-vault-text space-y-2.5 list-decimal list-inside">
              <li>Go to <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener noreferrer" className="text-vault-accent hover:text-vault-accent-hover transition-colors duration-vault-normal">themoviedb.org</a> and create a free account</li>
              <li>Go to Settings → API → Create API Key</li>
              <li>Choose "Developer" and fill in the form</li>
              <li>Copy your API key</li>
              <li>Create a <code className="bg-vault-border/50 px-1.5 py-0.5 rounded text-vault-accent">.env</code> file in the project root:</li>
            </ol>
            <pre className="mt-4 bg-vault-bg rounded-lg p-3 text-caption text-vault-accent border border-vault-border/30 overflow-x-auto">
              VITE_TMDB_API_KEY=your_api_key_here
            </pre>
            <p className="text-caption text-vault-muted mt-3">Then restart the dev server.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 md:mb-10">
        <h1 className="text-xl md:text-h1 font-display font-bold text-vault-text tracking-tight">Search</h1>
        <p className="text-xs md:text-body-sm text-vault-muted mt-1">Find movies and series to track</p>
      </div>

      <div className="relative mb-5 md:mb-6">
        <Search className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-vault-muted pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.slice(0, 200))}
          placeholder="Search movies & series..."
          className="vault-input pl-10 md:pl-12 pr-14 md:pr-16 py-3 md:py-3.5 rounded-xl shadow-vault-inner min-h-[48px]"
          maxLength={200}
          autoFocus
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-[10px] md:text-caption uppercase tracking-wide text-vault-muted hover:text-white transition-colors duration-vault-normal min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="bg-vault-error-subtle border border-vault-error/25 rounded-xl p-4 mb-6 flex items-start gap-3 animate-vault-fade-in">
          <AlertCircle className="w-5 h-5 text-vault-error shrink-0 mt-0.5" />
          <div>
            <p className="text-body-sm font-medium text-vault-error">Search failed</p>
            <p className="text-meta text-vault-error/70 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {isSearching ? (
        loading ? (
          <SearchSkeleton />
        ) : results.length === 0 ? (
          <div className="vault-card flex flex-col items-center py-12 md:py-16 px-4 md:px-6 text-center">
            <div className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-vault-surface-hover flex items-center justify-center mb-3 md:mb-4">
              <Search className="w-5 h-5 md:w-6 md:h-6 text-vault-muted" />
            </div>
            <h3 className="text-base md:text-h3 font-display font-semibold text-vault-text mb-1.5">No results found</h3>
            <p className="text-[11px] md:text-body-sm text-vault-muted max-w-sm mb-5 md:mb-6">
              Nothing matched "{query}". Try a different title or check your spelling.
            </p>
            <button onClick={handleClearSearch} className="vault-btn-primary">
              Clear search
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="vault-badge-accent">{results.length} results</span>
              <span className="text-body-sm text-vault-muted truncate">for "{query}"</span>
            </div>
            <div className="space-y-2">
              {results.map((item) => (
                <SearchResultCard key={`${item.media_type}-${item.id}`} item={item} />
              ))}
            </div>
          </div>
        )
      ) : (
        <div>
          <h2 className="text-sm md:text-h3 font-display font-semibold text-vault-text mb-3 md:mb-4">Discover</h2>
          <div className="overflow-x-auto scrollbar-hide pb-1 mb-6">
            <div className="inline-flex gap-1 p-1 vault-surface-elevated rounded-lg min-w-max">
              {(
                [
                  { key: 'trending', label: 'Trending', icon: TrendingUp },
                  { key: 'popular-movies', label: 'Popular Movies', icon: Film },
                  { key: 'top-rated', label: 'Top Rated', icon: Star },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveDiscoverTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-label font-medium whitespace-nowrap transition-all duration-vault-normal ${
                    activeDiscoverTab === tab.key
                      ? 'bg-vault-accent text-white shadow-vault-glow'
                      : 'text-vault-muted hover:text-vault-text hover:bg-vault-surface-hover'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {discoverLoading ? (
            <SearchSkeleton />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4">
              {discoverItems.map((item) => {
                const title = item.title || item.name || 'Unknown';
                const year = (item.release_date || item.first_air_date || '').split('-')[0];
                const type = item.media_type === 'tv' ? 'TV' : 'Movie';
                return (
                  <button
                    key={`${item.media_type}-${item.id}`}
                    onClick={() => navigate(`/title/${item.media_type}/${item.id}`)}
                    className="group relative rounded-xl overflow-hidden bg-vault-card border border-vault-border/40 hover:border-vault-border transition-all duration-300 shadow-vault-sm hover:shadow-vault-lg hover:-translate-y-0.5 text-left w-full"
                  >
                    <div className="aspect-[2/3] relative overflow-hidden bg-vault-surface">
                      <TMDBImage
                        path={item.poster_path}
                        alt={title}
                        size="w342"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                        fallbackClassName="w-full h-full"
                        fallbackText="No Poster"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80" />
                      <div className="absolute inset-0 bg-vault-gloss opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                        <h3 className="text-[13px] font-semibold text-white truncate leading-tight">{title}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-caption text-white/60">{year}</span>
                          <span className="text-caption text-vault-gold">★ {item.vote_average?.toFixed(1)}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                            type === 'TV' ? 'bg-vault-info/20 text-vault-info' : 'bg-vault-accent/20 text-vault-accent'
                          }`}>
                            {type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
