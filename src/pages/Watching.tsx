import { useMemo } from 'react';
import { Play } from 'lucide-react';
import { useTrackerContext } from '../hooks/useTrackerContext';
import type { TrackerSeries } from '../types';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import PageHeader, { ContextPill } from '../components/PageHeader';
import TMDBImage from '../components/TMDBImage';
import AnimatedProgress from '../components/ProgressBar';
import Reveal from '../components/Reveal';
import PageFooter from '../components/PageFooter';

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
        <PageHeader
          kicker="In Progress"
          title="Currently Watching"
          subtitle="Series you're working through"
          right={<ContextPill>0 series</ContextPill>}
        />
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
      <PageHeader
        kicker="In Progress"
        title="Currently Watching"
        subtitle="Series you're working through"
        right={<ContextPill>{watching.length} series</ContextPill>}
      />
      <div className="space-y-2.5 md:space-y-4">
        {watching.map((series, i) => {
          const progress = getProgress(series);
          return (
            <Reveal key={series.id} delay={Math.min(i, 4)}>
              <button
                onClick={() => navigate(`/title/tv/${series.tmdbId}`)}
                className="vault-card w-full flex gap-3 md:gap-4 p-3 md:p-4 text-left transition-all duration-vault-normal hover:border-vault-accent/40 hover:shadow-vault-md hover:-translate-y-0.5 group vault-card-cinematic"
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
                    <AnimatedProgress
                      value={progress.percentage}
                      barClassName={progress.percentage >= 100 ? 'vault-progress-success' : 'vault-progress-accent'}
                    />
                  </div>
                </div>
                <Play className="w-4 h-4 md:w-5 md:h-5 text-vault-muted group-hover:text-vault-accent flex-shrink-0 self-center transition-colors duration-vault-fast" />
              </button>
            </Reveal>
          );
        })}
      </div>

      <PageFooter />
    </div>
  );
}
