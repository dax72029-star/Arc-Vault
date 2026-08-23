import { useMemo } from 'react';
import { Play } from 'lucide-react';
import { useTrackerContext } from '../hooks/useTrackerContext';
import type { TrackerSeries } from '../types';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import TMDBImage from '../components/TMDBImage';

export default function Watching() {
  const { items } = useTrackerContext();
  const navigate = useNavigate();

  const watching = useMemo(() => {
    return items.filter((i): i is TrackerSeries => i.type === 'tv' && i.status === 'watching');
  }, [items]);

  const getProgress = (series: TrackerSeries) => {
    const total = series.seasonProgress.reduce((sum, s) => sum + s.episodes.length, 0);
    const watched = series.seasonProgress.reduce(
      (sum, s) => sum + s.episodes.filter((e) => e.watched).length,
      0
    );
    const percentage = total > 0 ? Math.round((watched / total) * 100) : 0;
    const currentSeason = series.seasonProgress.find(
      (s) => s.episodes.some((e) => !e.watched)
    );
    const currentEp = currentSeason
      ? currentSeason.episodes.find((e) => !e.watched)
      : null;

    return { total, watched, percentage, currentSeason, currentEp };
  };

  if (watching.length === 0) {
    return (
      <div>
        <div className="mb-6 md:mb-10">
          <h1 className="text-xl md:text-h1 font-display font-bold text-vault-text tracking-tight">Currently Watching</h1>
          <p className="text-xs md:text-body-sm text-vault-muted mt-1">0 series in progress</p>
        </div>
        <EmptyState
          icon={<Play className="w-12 h-12 md:w-16 md:h-16" />}
          title="Nothing currently watching"
          description="Start a series and mark episodes as you watch them."
          actionLabel="Browse Series"
          actionTo="/series"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 md:mb-10">
        <h1 className="text-xl md:text-h1 font-display font-bold text-vault-text tracking-tight">Currently Watching</h1>
        <p className="text-xs md:text-body-sm text-vault-muted mt-1">{watching.length} series in progress</p>
      </div>
      <div className="space-y-2.5 md:space-y-4">
        {watching.map((series) => {
          const progress = getProgress(series);
          return (
            <button
              key={series.id}
              onClick={() => navigate(`/title/tv/${series.tmdbId}`)}
              className="vault-card w-full flex gap-3 md:gap-4 p-3 md:p-4 text-left transition-all duration-vault-normal hover:border-vault-accent/40 hover:shadow-vault-md hover:-translate-y-0.5 group min-h-[88px]"
            >
              <div className="w-12 h-[72px] md:w-16 md:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-vault-border shadow-vault-sm">
                <TMDBImage
                  path={series.poster}
                  alt={series.title}
                  size="w185"
                  className="w-full h-full object-cover"
                  fallbackClassName="w-full h-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[13px] md:text-sm font-semibold text-white truncate group-hover:text-vault-accent transition-colors duration-vault-fast">
                  {series.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {progress.currentSeason && (
                    <span className="vault-badge bg-vault-info-subtle text-vault-info !text-[10px] md:!text-xs">
                      S{progress.currentSeason.seasonNumber}
                      {progress.currentEp && ` E${progress.currentEp.episodeNumber}`}
                    </span>
                  )}
                  <span className="text-[10px] md:text-xs text-vault-muted tabular-nums">
                    {progress.watched}/{progress.total} eps
                  </span>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] md:text-xs text-vault-muted mb-1">
                    <span>Progress</span>
                    <span className="font-medium text-vault-text tabular-nums">{progress.percentage}%</span>
                  </div>
                  <div className="vault-progress">
                    <div
                      className="vault-progress-accent"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
              <Play className="w-4 h-4 md:w-5 md:h-5 text-vault-muted group-hover:text-vault-accent flex-shrink-0 self-center transition-colors duration-vault-fast" />
            </button>
          );
        })}
      </div>

      <div className="mt-12 md:mt-16 pt-6 md:pt-8 border-t border-vault-border/30 text-center">
        <p className="text-xs md:text-sm font-semibold text-white tracking-wide">ArcVault</p>
        <p className="text-[10px] md:text-xs text-vault-muted mt-1.5">
          A personal cinema journey, crafted by <span className="text-vault-text-secondary font-medium">DAX SANANDIYA</span>
        </p>
        <p className="text-[9px] md:text-[10px] text-vault-muted/60 mt-2">
          © 2026 DAX SANANDIYA · v1.0.0
        </p>
      </div>
    </div>
  );
}
