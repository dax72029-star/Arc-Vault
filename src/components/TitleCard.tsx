import type { TrackerItem, TrackerMovie, TrackerSeries } from '../types';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, Play, CheckCircle2, Clock } from 'lucide-react';
import TMDBImage from './TMDBImage';

interface Props {
  item: TrackerItem;
  showStatus?: boolean;
}

export default function TitleCard({ item, showStatus = true }: Props) {
  const navigate = useNavigate();
  const title = item.title;
  const year = item.releaseYear;
  const type = item.type === 'tv' ? 'TV' : 'Movie';

  const statusColor =
    item.status === 'completed'
      ? 'bg-vault-success-subtle text-vault-success'
      : item.status === 'watching'
      ? 'bg-vault-info-subtle text-vault-info'
      : 'bg-vault-warning-subtle text-vault-warning';

  const statusIcon =
    item.status === 'completed' ? (
      <CheckCircle2 className="w-3 h-3" />
    ) : item.status === 'watching' ? (
      <Play className="w-3 h-3" />
    ) : (
      <Clock className="w-3 h-3" />
    );

  const progress = item.type === 'tv' ? getSeriesProgress(item as TrackerSeries) : null;

  return (
    <button
      onClick={() => navigate(`/title/${item.type}/${item.tmdbId}`)}
      aria-label={`${title} (${year}, ${type}) — ${item.status}`}
      className="group relative rounded-xl overflow-hidden bg-vault-card border border-vault-border/40 hover:border-vault-border transition-all duration-300 text-left w-full shadow-vault-sm hover:shadow-vault-lg hover:-translate-y-0.5"
    >
      <div className="aspect-[2/3] relative overflow-hidden bg-vault-surface">
        <TMDBImage
          path={item.poster}
          alt={title}
          size="w342"
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          fallbackClassName="w-full h-full"
          fallbackText="No Poster"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80" />
        <div className="absolute inset-0 bg-vault-gloss opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {item.favorite && (
          <div className="absolute top-2 right-2">
            <Heart className="w-4 h-4 text-vault-accent fill-vault-accent drop-shadow-lg" />
          </div>
        )}
        {item.personalRating > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-md px-1.5 py-0.5 border border-white/10">
            <Star className="w-3 h-3 text-vault-gold fill-vault-gold" />
            <span className="text-[11px] font-semibold text-white">{item.personalRating}</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          <h3 className="text-[13px] font-semibold text-white truncate leading-tight">{title}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] text-white/60">{year}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
              type === 'TV' ? 'bg-vault-info/20 text-vault-info' : 'bg-vault-accent/20 text-vault-accent'
            }`}>
              {type}
            </span>
          </div>
        </div>
      </div>
      {showStatus && (
        <div className="p-2.5">
          <div className="flex items-center justify-between">
            <span className={`vault-badge text-[10px] ${statusColor}`}>
              {statusIcon}
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </span>
          </div>
          {progress !== null && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-vault-muted mb-1">
                <span>{progress.watched}/{progress.total} episodes</span>
                <span>{progress.percentage}%</span>
              </div>
              <div className="vault-progress">
                <div
                  className="vault-progress-accent"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </button>
  );
}

function getSeriesProgress(series: TrackerSeries): { watched: number; total: number; percentage: number } {
  const total = series.seasonProgress.reduce((sum, s) => sum + s.episodes.length, 0);
  const watched = series.seasonProgress.reduce(
    (sum, s) => sum + s.episodes.filter((e) => e.watched).length,
    0
  );
  return {
    watched,
    total,
    percentage: total > 0 ? Math.round((watched / total) * 100) : 0,
  };
}
