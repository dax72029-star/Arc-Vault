import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Check,
  Heart,
  Star,
  Clock,
  Play,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { getMovieDetail, getTVDetail, getTVSeasonDetail } from '../services/tmdb';
import type { TMDBMovieDetail, TMDBTVDetail, TrackerMovie, TrackerSeries, SeasonProgress, EpisodeProgress, TrackerItem } from '../types';
import { TMDB } from '../config/tmdb';
import { useTrackerContext } from '../hooks/useTrackerContext';
import { createTrackerMovie, createTrackerSeries, addHistoryEntry, updateTitle, updateEpisodeProgress, toggleSeasonWatched } from '../services/storage';
import { formatMinutes } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const VALID_MEDIA_TYPES = ['movie', 'tv'] as const;

type ValidMediaType = typeof VALID_MEDIA_TYPES[number];

function isValidMediaType(value: string | undefined): value is ValidMediaType {
  return VALID_MEDIA_TYPES.includes(value as ValidMediaType);
}

export default function TitleDetail() {
  const { type, tmdbId } = useParams<{ type: string; tmdbId: string }>();
  const navigate = useNavigate();
  const { addItem, removeItem, getItem, refresh } = useTrackerContext();
  const [detail, setDetail] = useState<TMDBMovieDetail | TMDBTVDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [seasonDetails, setSeasonDetails] = useState<Record<number, { episodes: { episode_number: number; runtime: number | null }[] }>>({});
  const [loadingSeason, setLoadingSeason] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const id = Number(tmdbId);
  const mediaType = isValidMediaType(type) ? type : null;

  const tracked = useMemo(() => mediaType ? getItem(id, mediaType) : undefined, [getItem, id, mediaType, detail]);

  useEffect(() => {
    if (!tmdbId || !mediaType) {
      setLoading(false);
      setError(isValidMediaType(type) ? 'Title not found' : 'Invalid content type');
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (mediaType === 'movie') {
          const data = await getMovieDetail(id, signal);
          setDetail(data);
        } else {
          const data = await getTVDetail(id, signal);
          setDetail(data);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('Failed to load details');
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };
    load();

    return () => { abortRef.current?.abort(); };
  }, [id, mediaType, tmdbId, type]);

  useEffect(() => {
    if (tracked && 'personalRating' in tracked) {
      setRating(tracked.personalRating);
    }
  }, [tracked]);

  const handleAdd = async () => {
    if (!detail || adding || !mediaType) return;
    setAdding(true);
    try {
      if (mediaType === 'movie') {
        const m = detail as TMDBMovieDetail;
        const item: TrackerMovie = createTrackerMovie({
          tmdbId: m.id,
          type: 'movie',
          title: m.title,
          poster: m.poster_path,
          backdrop: m.backdrop_path,
          releaseDate: m.release_date || '',
          releaseYear: m.release_date ? new Date(m.release_date).getFullYear() : 0,
          genres: m.genres.map((g) => g.name),
          description: m.overview || '',
          runtime: m.runtime || 0,
          tmdbRating: m.vote_average,
          personalRating: 0,
          status: 'pending',
          dateWatched: null,
          favorite: false,
        });
        const success = addItem(item);
        if (success) {
          addHistoryEntry({
            title: m.title,
            action: 'Added to watchlist',
            type: 'movie',
            tmdbId: m.id,
          });
        }
      } else {
        const tv = detail as TMDBTVDetail;
        const seasons: SeasonProgress[] = [];
        for (const s of tv.seasons || []) {
          if (s.season_number === 0) continue;
          const episodes: EpisodeProgress[] = [];
          for (let e = 1; e <= s.episode_count; e++) {
            episodes.push({
              episodeNumber: e,
              watched: false,
              runtime: null,
            });
          }
          seasons.push({
            seasonNumber: s.season_number,
            episodeCount: s.episode_count,
            episodes,
          });
        }
        const item = createTrackerSeries(
          {
            tmdbId: tv.id,
            type: 'tv',
            title: tv.name,
            poster: tv.poster_path,
            backdrop: tv.backdrop_path,
            releaseDate: tv.first_air_date || '',
            releaseYear: tv.first_air_date ? new Date(tv.first_air_date).getFullYear() : 0,
            genres: tv.genres.map((g) => g.name),
            description: tv.overview || '',
            numberOfSeasons: tv.number_of_seasons,
            numberOfEpisodes: tv.number_of_episodes,
            tmdbRating: tv.vote_average,
            personalRating: 0,
            status: 'pending',
            dateStarted: null,
            dateCompleted: null,
            favorite: false,
          },
          seasons
        );
        const success = addItem(item);
        if (success) {
          addHistoryEntry({
            title: tv.name,
            action: 'Added to watchlist',
            type: 'tv',
            tmdbId: tv.id,
          });
        }
      }
      refresh();
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = () => {
    if (!mediaType) return;
    removeItem(id, mediaType);
    refresh();
    addHistoryEntry({
      title: detail && 'title' in detail ? (detail as TMDBMovieDetail).title : (detail as TMDBTVDetail).name,
      action: 'Removed from tracker',
      type: mediaType,
      tmdbId: id,
    });
  };

  const handleMarkCompleted = () => {
    if (!tracked) return;
    if (tracked.type === 'movie') {
      const updates: Partial<TrackerMovie> = {
        status: 'completed',
        dateWatched: new Date().toISOString(),
      };
      if (rating > 0) updates.personalRating = rating;
      updateTitle(id, 'movie', updates);
      refresh();
      addHistoryEntry({
        title: tracked.title,
        action: 'Completed',
        type: 'movie',
        tmdbId: id,
      });
    }
  };

  const handleRate = (newRating: number) => {
    setRating(newRating);
    if (tracked && mediaType) {
      updateTitle(id, mediaType, { personalRating: newRating } as Partial<TrackerItem>);
      refresh();
    }
  };

  const handleToggleFavorite = () => {
    if (!tracked || !mediaType) return;
    updateTitle(id, mediaType, { favorite: !tracked.favorite } as Partial<TrackerItem>);
    refresh();
  };

  const handleToggleStatus = (newStatus: string) => {
    if (!tracked || !mediaType) return;
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'watching' && !('dateStarted' in tracked && tracked.dateStarted)) {
      updates.dateStarted = new Date().toISOString();
    }
    if (newStatus === 'completed') {
      updates.dateCompleted = new Date().toISOString();
      if (mediaType === 'movie') {
        updates.dateWatched = new Date().toISOString();
        updates.status = 'completed';
      }
    }
    updateTitle(id, mediaType, updates as Partial<TrackerItem>);
    refresh();
    addHistoryEntry({
      title: tracked.title,
      action: `Status changed to ${newStatus}`,
      type: mediaType,
      tmdbId: id,
    });
  };

  const loadSeason = async (seasonNum: number) => {
    if (!mediaType || mediaType !== 'tv' || seasonDetails[seasonNum]) {
      setExpandedSeason(expandedSeason === seasonNum ? null : seasonNum);
      return;
    }
    setLoadingSeason(seasonNum);
    try {
      const data = await getTVSeasonDetail(id, seasonNum);
      setSeasonDetails((prev) => ({
        ...prev,
        [seasonNum]: {
          episodes: (data.episodes || []).map((ep) => ({
            episode_number: ep.episode_number,
            runtime: ep.runtime,
          })),
        },
      }));
    } catch {
      // Silent fail
    } finally {
      setLoadingSeason(null);
      setExpandedSeason(seasonNum === expandedSeason ? null : seasonNum);
    }
  };

  const handleToggleEpisode = (seasonNum: number, epNum: number, watched: boolean) => {
    updateEpisodeProgress(id, seasonNum, epNum, !watched);
    refresh();
    if (!watched) {
      addHistoryEntry({
        title: tracked?.title || '',
        action: `S${seasonNum}E${epNum} watched`,
        type: 'tv',
        tmdbId: id,
      });
    }
  };

  const handleToggleAllSeason = (seasonNum: number, allWatched: boolean) => {
    toggleSeasonWatched(id, seasonNum, !allWatched);
    refresh();
    addHistoryEntry({
      title: tracked?.title || '',
      action: allWatched ? `Season ${seasonNum} unmarked` : `Season ${seasonNum} completed`,
      type: 'tv',
      tmdbId: id,
    });
  };

  if (loading) return <LoadingSpinner />;
  if (error || !mediaType) return (
    <div className="text-center py-20">
      <p className="text-body-sm text-vault-error">{error || 'Invalid content type'}</p>
      <button onClick={() => navigate('/')} className="vault-btn-secondary mt-4">
        Go Home
      </button>
    </div>
  );
  if (!detail) return (
    <div className="text-center py-20">
      <p className="text-body-sm text-vault-muted">Not found</p>
    </div>
  );

  const isMovie = mediaType === 'movie';
  const movie = isMovie ? (detail as TMDBMovieDetail) : null;
  const tv = !isMovie ? (detail as TMDBTVDetail) : null;
  const title = isMovie ? movie!.title : tv!.name;
  const backdrop = isMovie ? movie!.backdrop_path : tv!.backdrop_path;
  const releaseDate = isMovie ? movie!.release_date : tv!.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';

  return (
    <div>
      <button onClick={() => navigate(-1)} className="vault-btn-ghost mb-6 -ml-3">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="relative rounded-2xl overflow-hidden mb-6 ring-1 ring-vault-border/30">
        {backdrop ? (
          <img
            src={TMDB.backdrop(backdrop, 'w1280')}
            alt={title}
            className="w-full h-48 md:h-72 object-cover"
          />
        ) : (
          <div className="w-full h-48 md:h-72 bg-vault-card" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-vault-bg via-vault-bg/55 to-vault-bg/5" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-vault-bg via-vault-bg/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-vault-bg/40 via-transparent to-transparent" />
      </div>

      <div className="flex gap-4 md:gap-6 -mt-16 md:-mt-20 relative z-10 mb-6">
        <div className="w-24 md:w-36 flex-shrink-0">
          {isMovie ? movie!.poster_path : tv!.poster_path ? (
            <img
              src={TMDB.poster(
                isMovie ? movie!.poster_path : tv!.poster_path,
                'w342'
              )}
              alt={title}
              className="w-full rounded-xl ring-1 ring-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)]"
            />
          ) : (
            <div className="vault-card w-full aspect-[2/3] flex items-center justify-center text-vault-muted">
              N/A
            </div>
          )}
        </div>
        <div className="flex-1 pt-6 md:pt-12 min-w-0">
          <h1 className="text-lg md:text-2xl font-display font-bold text-white leading-tight tracking-tight truncate">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-vault-muted">
            <span>{year}</span>
            <span>·</span>
            <span className={`font-medium ${isMovie ? 'text-vault-accent' : 'text-vault-info'}`}>
              {isMovie ? 'Movie' : 'TV Series'}
            </span>
            {movie?.runtime && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatMinutes(movie.runtime)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(isMovie ? movie!.genres : tv!.genres).map((g) => (
          <span
            key={g.id}
            className="vault-badge px-3 py-1 bg-vault-surface-elevated text-vault-text/80 border border-vault-border/50"
          >
            {g.name}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="vault-card px-4 py-3 text-center min-w-[110px]">
          <p className="text-xs text-vault-muted mb-1">TMDB Rating</p>
          <p className="text-base md:text-lg font-display font-bold text-vault-gold flex items-center justify-center gap-1.5">
            <Star className="w-4 h-4 fill-vault-gold" />
            {(isMovie ? movie!.vote_average : tv!.vote_average).toFixed(1)}
          </p>
        </div>
        <div className="vault-card px-4 py-3 text-center">
          <p className="text-xs text-vault-muted mb-1">My Rating</p>
          <div className="flex items-center justify-center gap-0.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => handleRate(rating === n ? 0 : n)}
                onMouseEnter={() => setRatingHover(n)}
                onMouseLeave={() => setRatingHover(0)}
                className="transition-transform duration-vault-fast hover:scale-110"
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    n <= (ratingHover || rating)
                      ? 'text-vault-gold fill-vault-gold'
                      : 'text-vault-border'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-xs text-vault-gold mt-1">{rating}/10</p>
          )}
        </div>
        <button
          onClick={handleToggleFavorite}
          aria-label="Toggle favorite"
          className={`vault-card px-4 py-3 transition-all duration-vault-normal ${
            tracked?.favorite
              ? '!border-vault-accent/50 shadow-[0_0_20px_-8px_rgba(220,38,38,0.5)]'
              : 'hover:border-vault-border'
          }`}
        >
          <Heart
            className={`w-5 h-5 ${
              tracked?.favorite
                ? 'text-vault-accent fill-vault-accent'
                : 'text-vault-muted'
            }`}
          />
        </button>
      </div>

      <p className="text-sm md:text-base text-vault-text/90 leading-relaxed max-w-3xl mb-6">
        {isMovie ? movie!.overview : tv!.overview}
      </p>

      <div className="mb-8">
        {!tracked ? (
          <button
            onClick={handleAdd}
            disabled={adding}
            className="vault-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            {adding ? 'Adding...' : 'Add to Watchlist'}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-vault-success/10 border border-vault-success/30 rounded-lg text-vault-success text-sm font-medium">
              <Check className="w-4 h-4" />
              In your tracker
            </div>
            {tracked.type === 'movie' && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleMarkCompleted}
                  disabled={tracked.status === 'completed'}
                  className={
                    tracked.status === 'completed'
                      ? 'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-vault-success/20 text-vault-success border border-vault-success/30 cursor-default'
                      : 'vault-btn-secondary !border-vault-success/30 hover:!bg-vault-success/10 hover:text-vault-success'
                  }
                >
                  <Check className="w-4 h-4" />
                  {tracked.status === 'completed' ? 'Completed' : 'Mark Completed'}
                </button>
                <button onClick={handleRemove} className="vault-btn-danger">
                  Remove
                </button>
              </div>
            )}
            {tracked.type === 'tv' && (
              <div className="flex flex-wrap gap-3">
                {['pending', 'watching', 'completed'].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleToggleStatus(s)}
                    className={
                      tracked.status === s
                        ? s === 'completed'
                          ? 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-vault-success/20 text-vault-success border border-vault-success/30'
                          : s === 'watching'
                          ? 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-vault-info-subtle text-vault-info border border-vault-info/30'
                          : 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-vault-warning/20 text-vault-warning border border-vault-warning/30'
                        : 'vault-btn-secondary !text-vault-muted hover:!text-white'
                    }
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
                <button onClick={handleRemove} className="vault-btn-danger">
                  Remove
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {tracked && tracked.type === 'tv' && (tracked as TrackerSeries).seasonProgress.length > 0 && (
        <section className="mb-8">
          <h3 className="text-lg font-display font-semibold text-white mb-4">Seasons &amp; Episodes</h3>
          <div className="space-y-3">
            {(tracked as TrackerSeries).seasonProgress.map((season) => {
              const watched = season.episodes.filter((e) => e.watched).length;
              const total = season.episodes.length;
              const pct = total > 0 ? Math.round((watched / total) * 100) : 0;
              const allWatched = watched === total;
              const isExpanded = expandedSeason === season.seasonNumber;
              const details = seasonDetails[season.seasonNumber];

              return (
                <div key={season.seasonNumber} className="vault-card overflow-hidden transition-colors duration-vault-normal hover:border-vault-border">
                  <button
                    onClick={() => loadSeason(season.seasonNumber)}
                    className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          Season {season.seasonNumber}
                        </span>
                        {allWatched && (
                          <span className="vault-badge-success">Done</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-vault-muted tabular-nums">
                          {watched}/{total} episodes
                        </span>
                        <div className="vault-progress flex-1 max-w-[140px]">
                          <div
                            className={allWatched ? 'vault-progress-success' : 'vault-progress-accent'}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-vault-muted tabular-nums">{pct}%</span>
                      </div>
                    </div>
                    {loadingSeason === season.seasonNumber ? (
                      <div className="w-4 h-4 border-2 border-vault-border border-t-vault-accent rounded-full animate-spin flex-shrink-0" />
                    ) : isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-vault-muted flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-vault-muted flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-vault-border/30 p-4 bg-black/20">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <button
                          onClick={() => handleToggleAllSeason(season.seasonNumber, true)}
                          className="text-xs font-medium px-3 py-1.5 rounded-md bg-vault-success/10 text-vault-success border border-vault-success/20 hover:bg-vault-success/20 transition-colors duration-vault-fast"
                        >
                          Mark all watched
                        </button>
                        <button
                          onClick={() => handleToggleAllSeason(season.seasonNumber, false)}
                          className="text-xs font-medium px-3 py-1.5 rounded-md bg-vault-surface-elevated text-vault-muted border border-vault-border/40 hover:text-vault-text hover:border-vault-border transition-colors duration-vault-fast"
                        >
                          Mark all unwatched
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {season.episodes.map((ep) => {
                          const epDetail = details?.episodes.find(
                            (e) => e.episode_number === ep.episodeNumber
                          );
                          return (
                            <button
                              key={ep.episodeNumber}
                              onClick={() =>
                                handleToggleEpisode(
                                  season.seasonNumber,
                                  ep.episodeNumber,
                                  ep.watched
                                )
                              }
                              className={`group flex items-center gap-3 p-2.5 rounded-lg text-left border transition-all duration-vault-fast ${
                                ep.watched
                                  ? 'bg-vault-success/10 border-vault-success/20 hover:bg-vault-success/15'
                                  : 'bg-vault-surface-elevated/40 border-transparent hover:bg-vault-surface-hover hover:border-vault-border/50'
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 transition-colors ${
                                  ep.watched
                                    ? 'bg-vault-success text-white shadow-sm'
                                    : 'bg-vault-border/70 text-vault-muted group-hover:bg-vault-surface-active group-hover:text-vault-text'
                                }`}
                              >
                                {ep.watched ? '✓' : ep.episodeNumber}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span
                                  className={`text-xs truncate block ${
                                    ep.watched ? 'text-vault-success' : 'text-white'
                                  }`}
                                >
                                  Episode {ep.episodeNumber}
                                </span>
                              </div>
                              {(epDetail?.runtime || ep.runtime) && (
                                <span className="text-[10px] text-vault-muted bg-black/30 px-1.5 py-0.5 rounded flex-shrink-0 tabular-nums">
                                  {epDetail?.runtime || ep.runtime}m
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tv && tv.seasons && tv.seasons.length > 0 && !tracked && (
        <section className="mb-8">
          <h3 className="text-lg font-display font-semibold text-white mb-2">Series Info</h3>
          <div className="flex gap-4 text-sm text-vault-muted">
            <span>{tv.number_of_seasons} seasons</span>
            <span>{tv.number_of_episodes} episodes</span>
          </div>
        </section>
      )}
    </div>
  );
}
