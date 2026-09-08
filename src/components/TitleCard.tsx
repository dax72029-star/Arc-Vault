import type { TrackerItem, TrackerSeries } from '../types';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, Play, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { memo, useRef, useCallback } from 'react';
import TMDBImage from './TMDBImage';
import AnimatedProgress from './ProgressBar';

interface Props {
  item: TrackerItem;
  showStatus?: boolean;
  index?: number;
}

function TitleCardInner({ item, showStatus = true }: Props) {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const posterRef = useRef<HTMLDivElement | null>(null);
  const glareRef = useRef<HTMLDivElement | null>(null);
  const title = item.title;
  const year = item.releaseYear;
  const type = item.type === 'tv' ? 'TV' : 'Movie';

  const onMove = useCallback((e: React.MouseEvent) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const el = cardRef.current;
    const inner = posterRef.current;
    const glare = glareRef.current;
    if (!el || !inner) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (px - 0.5) * 2;
    const ry = (py - 0.5) * 2;
    // P0: direct DOM write, no React state -> zero re-renders on mousemove
    el.style.transform = `perspective(900px) rotateX(${-ry * 6}deg) rotateY(${rx * 8}deg) translateZ(0)`;
    inner.style.transform = `scale(1.06) rotateX(${-ry * 2}deg) rotateY(${rx * 2.2}deg)`;
    inner.style.transition = 'transform 120ms ease-out';
    if (glare) {
      glare.style.opacity = '1';
      glare.style.background = `radial-gradient(420px circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.09), transparent 55%)`;
    }
  }, []);

  const onLeave = useCallback(() => {
    const el = cardRef.current;
    const inner = posterRef.current;
    const glare = glareRef.current;
    if (el) el.style.transform = '';
    if (inner) {
      inner.style.transform = '';
      inner.style.transition = 'transform 500ms cubic-bezier(0,0,0.2,1)';
    }
    if (glare) {
      glare.style.opacity = '0';
      glare.style.background = '';
    }
  }, []);

  const statusMeta =
    item.status === 'completed'
      ? { color: 'bg-vault-success-subtle text-vault-success', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Completed' }
      : item.status === 'watching'
      ? { color: 'bg-vault-info-subtle text-vault-info', icon: <Play className="w-3 h-3" />, label: 'Watching' }
      : { color: 'bg-vault-warning-subtle text-vault-warning', icon: <Clock className="w-3 h-3" />, label: 'On Watchlist' };

  const progress = item.type === 'tv' ? getSeriesProgress(item as TrackerSeries) : null;

  return (
    <button
      ref={cardRef}
      onClick={() => navigate(`/title/${item.type}/${item.tmdbId}`)}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      aria-label={`${title} (${year}, ${type}) — ${statusMeta.label}`}
      className="group relative rounded-xl overflow-hidden bg-vault-card border border-vault-border/40 hover:border-vault-border transition-all duration-300 text-left w-full shadow-vault-sm hover:shadow-vault-card-hover hover:-translate-y-1 vault-card-cinematic"
    >
      <div className="aspect-[2/3] relative overflow-hidden bg-vault-surface [perspective:900px]">
        <div ref={posterRef} className="absolute inset-0 will-change-transform" style={{ transition: 'transform 500ms cubic-bezier(0,0,0.2,1)' }}>
          <TMDBImage
            path={item.poster}
            alt={title}
            size="w185"
            className="w-full h-full object-cover"
            fallbackClassName="w-full h-full"
            fallbackText="No Poster"
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/20 opacity-80 group-hover:opacity-95 transition-opacity duration-300" />
        <div ref={glareRef} className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <div className="absolute inset-0 bg-vault-gloss opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {item.favorite && (
          <div className="absolute top-2 right-2">
            <Heart className="w-4 h-4 text-vault-accent fill-vault-accent drop-shadow-lg" />
          </div>
        )}
        {item.personalRating > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/55 backdrop-blur-sm rounded-md px-1.5 py-0.5 border border-white/10">
            <Star className="w-3 h-3 text-vault-gold fill-vault-gold" />
            <span className="text-[11px] font-semibold text-white">{item.personalRating}</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-2.5 pt-8 bg-gradient-to-t from-black/95 via-black/55 to-transparent">
          <h3 className="text-[13px] font-semibold text-white truncate leading-tight">{title}</h3>
          <div className="flex items-center justify-between gap-1.5 mt-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] text-white/60">{year}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${type === 'TV' ? 'bg-vault-info/20 text-vault-info' : 'bg-vault-accent/20 text-vault-accent'}`}>
                {type}
              </span>
            </div>
            {item.tmdbRating > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-vault-gold opacity-80 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0">
                <Star className="w-2.5 h-2.5 fill-vault-gold text-vault-gold" />
                {item.tmdbRating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold shadow-lg translate-y-2 group-hover:translate-y-0 transition-transform duration-300 hidden md:flex">
            <Play className="w-3.5 h-3.5" />
            Open
          </span>
        </div>
      </div>

      {showStatus && (
        <div className="p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className={`vault-badge text-[10px] ${statusMeta.color}`}>
              {statusMeta.icon}
              {statusMeta.label}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-vault-muted/50 group-hover:text-vault-accent group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
          </div>
          {progress !== null && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-vault-muted mb-1">
                <span>{progress.watched}/{progress.total} episodes</span>
                <span>{progress.percentage}%</span>
              </div>
              <AnimatedProgress value={progress.percentage} barClassName={progress.percentage >= 100 ? 'vault-progress-success' : 'vault-progress-accent'} />
            </div>
          )}
        </div>
      )}
    </button>
  );
}

function getSeriesProgress(series: TrackerSeries): { watched: number; total: number; percentage: number } {
  const total = series.seasonProgress.reduce((sum, s) => sum + s.episodes.length, 0);
  const watched = series.seasonProgress.reduce((sum, s) => sum + s.episodes.filter((e) => e.watched).length, 0);
  return { watched, total, percentage: total > 0 ? Math.round((watched / total) * 100) : 0 };
}

export default memo(TitleCardInner);
