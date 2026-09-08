import { useMemo, useState } from 'react';
import { Clock, Sparkles } from 'lucide-react';
import { useCountUp } from '../hooks/useCountUp';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface Props {
  totalMinutes: number;
  formatted: string;
}

export default function WatchTimeHero({ totalMinutes, formatted }: Props) {
  const reduced = usePrefersReducedMotion();
  const [hover, setHover] = useState(false);
  const count = useCountUp(totalMinutes, 1100, 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  const countFormatted = useMemo(() => {
    const v = Math.round(count);
    const d = Math.floor(v / 1440);
    const h = Math.floor((v % 1440) / 60);
    const m = Math.round(v % 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }, [count]);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="vault-card relative overflow-hidden p-5 md:p-8 isolate"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-28 -right-20 w-80 h-80 bg-vault-gold/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-16 w-72 h-72 bg-vault-accent/8 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent" />
      </div>

      <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-[10px] md:text-[11px] font-semibold tracking-[0.18em] text-vault-gold uppercase">
            <Sparkles className="w-3 h-3" />
            Your cinematic life
          </div>
          <p className="text-[11px] md:text-caption text-vault-muted uppercase tracking-widest font-medium mt-2 mb-1">Total watch time</p>
          <p
            className="text-3xl md:text-5xl font-display font-extrabold leading-none tabular-nums text-vault-gold"
            aria-label={`Total watch time ${formatted}`}
          >
            <span className="inline-block" style={reduced ? undefined : { transition: 'transform 300ms ease' }}>
              {reduced ? formatted : countFormatted}
            </span>
          </p>
          <p className="text-[11px] md:text-xs text-vault-muted mt-2.5 max-w-md">
            Every completed movie and every watched episode — distilled into time you lived inside stories.
          </p>
        </div>
        <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-2 md:text-right">
          <div className="flex items-center gap-2 text-[11px] md:text-xs text-vault-muted bg-vault-surface-elevated/60 border border-vault-border/30 rounded-full px-3 py-1.5">
            <Clock className="w-3.5 h-3.5 text-vault-gold" />
            <span className="tabular-nums">{hours.toLocaleString()} hours</span>
            <span className="text-vault-border">·</span>
            <span className="tabular-nums">{totalMinutes.toLocaleString()} min</span>
          </div>
          <div
            className={`hidden md:block text-[11px] text-vault-muted bg-black/20 border border-white/5 rounded-xl px-3.5 py-2.5 transition-all duration-300 ${
              hover ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
            } md:min-w-[220px]`}
            aria-hidden={!hover}
          >
            <div className="flex justify-between gap-4 tabular-nums">
              <span>Hours</span>
              <span className="text-vault-text font-medium">{hours.toLocaleString()}h</span>
            </div>
            <div className="flex justify-between gap-4 tabular-nums mt-1">
              <span>Minutes</span>
              <span className="text-vault-text font-medium">{totalMinutes.toLocaleString()}m</span>
            </div>
            <div className="flex justify-between gap-4 tabular-nums mt-1 text-vault-gold">
              <span>Days</span>
              <span className="font-semibold">{(totalMinutes / 1440).toFixed(1)}d</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`md:hidden mt-3 text-[11px] text-vault-muted bg-black/20 border border-white/5 rounded-xl px-3.5 py-2.5 flex justify-between gap-2 tabular-nums transition-opacity duration-300 ${
          totalMinutes > 0 ? 'opacity-100' : 'opacity-60'
        }`}
      >
        <span>{hours.toLocaleString()}h</span>
        <span>{totalMinutes.toLocaleString()}m</span>
        <span className="text-vault-gold">{(totalMinutes / 1440).toFixed(1)}d</span>
      </div>
    </div>
  );
}
