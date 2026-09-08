import type { TMDBSearchResult } from '../types';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import TMDBImage from './TMDBImage';

interface Props {
  item: TMDBSearchResult;
}

export default function SearchResultCard({ item }: Props) {
  const navigate = useNavigate();
  const title = item.title || item.name || 'Unknown';
  const year = (item.release_date || item.first_air_date || '').split('-')[0];
  const type = item.media_type === 'tv' ? 'TV' : 'Movie';

  return (
    <button
      onClick={() => navigate(`/title/${item.media_type}/${item.id}`)}
      className="flex gap-3 md:gap-4 p-3 rounded-xl bg-vault-surface/40 hover:bg-vault-surface-elevated border border-transparent hover:border-vault-border/50 transition-all duration-200 text-left w-full group min-h-[76px] vault-card-cinematic hover:-translate-y-0.5 hover:shadow-vault-md active:scale-[0.99]"
    >
      <div className="w-12 h-[68px] md:w-14 md:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-vault-surface">
        <TMDBImage
          path={item.poster_path}
          alt={title}
          size="w185"
          className="w-full h-full object-cover"
          fallbackClassName="w-full h-full"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-[12px] md:text-[13px] font-semibold text-vault-text truncate group-hover:text-vault-accent transition-colors">
          {title}
        </h3>
        <div className="flex items-center gap-1.5 md:gap-2 mt-0.5 md:mt-1">
          <span className="text-[10px] md:text-[11px] text-vault-muted">{year}</span>
          <span className="text-[10px] md:text-[11px] text-vault-border">·</span>
          <span className={`text-[9px] md:text-[10px] px-1.5 py-0.5 rounded font-medium ${
            type === 'TV' ? 'bg-vault-info-subtle text-vault-info' : 'bg-vault-accent-subtle text-vault-accent'
          }`}>
            {type}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Star className="w-2.5 h-2.5 md:w-3 md:h-3 text-vault-gold fill-vault-gold" />
          <span className="text-[10px] md:text-[11px] text-vault-muted">
            {item.vote_average > 0 ? item.vote_average.toFixed(1) : 'N/A'}
          </span>
        </div>
      </div>
    </button>
  );
}
