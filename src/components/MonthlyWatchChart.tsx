import { useMemo, useState, useRef, useEffect } from 'react';
import { formatMinutes } from '../utils/helpers';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface Point {
  month: string;
  minutes: number;
  label: string;
}

interface Props {
  data: { month: string; minutes: number }[];
}

function toDate(monthStr: string): Date {
  const d = new Date(monthStr + ' 01');
  return isNaN(d.getTime()) ? new Date(monthStr) : d;
}

export default function MonthlyWatchChart({ data }: Props) {
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(Math.max(320, e.contentRect.width));
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) { setEntered(true); return; }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [reduced]);

  const points: Point[] = useMemo(() => {
    if (data.length === 0) return [];
    const sorted = [...data].sort((a, b) => toDate(a.month).getTime() - toDate(b.month).getTime());
    const slice = sorted.slice(-12);
    return slice.map((d) => ({
      month: d.month,
      minutes: d.minutes,
      label: toDate(d.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    }));
  }, [data]);

  const W = width;
  const H = 220;
  const pad = { l: 8, r: 8, t: 16, b: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const max = Math.max(...points.map((p) => p.minutes), 1);
  const stepX = points.length > 1 ? innerW / (points.length - 1) : innerW;

  const coords = useMemo(() => {
    return points.map((p, i) => ({
      x: pad.l + i * stepX,
      y: pad.t + innerH - (p.minutes / max) * innerH * 0.85 - innerH * 0.04,
      p,
    }));
  }, [points, stepX, max, innerH, pad.l, pad.t]);

  const path = useMemo(() => {
    if (coords.length === 0) return '';
    if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y} L ${coords[0].x} ${coords[0].y}`;
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cpx = (p0.x + p1.x) / 2;
      d += ` C ${cpx} ${p0.y}, ${cpx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [coords]);

  const areaPath = useMemo(() => {
    if (coords.length === 0) return '';
    const bottomY = pad.t + innerH;
    return `${path} L ${coords[coords.length - 1].x} ${bottomY} L ${coords[0].x} ${bottomY} Z`;
  }, [path, coords, pad.t, innerH]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let best = 0;
    let bestDist = Infinity;
    coords.forEach((c, i) => {
      const d = Math.abs(c.x - x);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    setActive(best);
  };

  if (points.length === 0) {
    return <div className="vault-card p-6 text-center text-sm text-vault-muted">No monthly data yet.</div>;
  }

  const activePoint = active !== null ? points[active] : null;
  const activeCoord = active !== null ? coords[active] : null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (points.length === 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setActive((cur) => {
        const next = cur == null ? 0 : e.key === 'ArrowRight' ? Math.min(points.length - 1, cur + 1) : Math.max(0, cur - 1);
        return next;
      });
    } else if (e.key === 'Escape') setActive(null);
    else if (e.key === 'Home') setActive(0);
    else if (e.key === 'End') setActive(points.length - 1);
  };

  return (
    <div
      ref={wrapRef}
      className="vault-card p-4 md:p-6 overflow-hidden focus-within:border-vault-border"
      onMouseMove={handleMove}
      onMouseLeave={() => setActive(null)}
      onFocus={() => setActive((c) => c ?? 0)}
      onBlur={() => setActive(null)}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="img"
      aria-label="Monthly watch time trend over the last 12 months. Use arrow keys to explore points."
    >
      <div className="relative select-none" style={{ height: H }}>
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="vaultArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
            </linearGradient>
            <filter id="vaultGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {[0.25, 0.5, 0.75, 1].map((t, i) => (
            <line
              key={i}
              x1={pad.l}
              x2={W - pad.r}
              y1={pad.t + innerH * (1 - t)}
              y2={pad.t + innerH * (1 - t)}
              stroke="rgba(35,40,64,0.5)"
              strokeWidth={1}
              strokeDasharray={i === 3 ? undefined : '3 6'}
            />
          ))}

          <path
            d={areaPath}
            fill="url(#vaultArea)"
            opacity={entered ? 1 : 0}
            style={{ transition: reduced ? undefined : 'opacity 700ms ease 120ms' }}
          />
          <path
            d={path}
            fill="none"
            stroke="#dc2626"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#vaultGlow)"
            opacity={entered ? 1 : 0}
            strokeDasharray={reduced ? undefined : entered ? undefined : '1200'}
            strokeDashoffset={reduced ? undefined : entered ? 0 : 1200}
            style={{
              transition: reduced ? 'opacity 300ms ease' : 'opacity 600ms ease, stroke-dashoffset 1100ms cubic-bezier(0,0,0.2,1)',
            }}
          />

          {coords.map((c, i) => {
            const isActive = active === i;
            const isPeak = c.p.minutes === max;
            return (
              <g key={c.p.month}>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isActive ? 6.5 : isPeak ? 4 : 3.2}
                  fill={isActive ? '#fff' : isPeak ? '#eab308' : '#dc2626'}
                  stroke={isActive ? '#dc2626' : 'rgba(8,9,14,0.9)'}
                  strokeWidth={isActive ? 2.5 : 1.6}
                  style={{
                    transition: 'r 160ms ease, fill 160ms ease',
                    filter: isActive ? 'drop-shadow(0 0 6px rgba(220,38,38,0.55))' : undefined,
                  }}
                  opacity={active === null ? 1 : isActive ? 1 : 0.32}
                />
                {isActive && <circle cx={c.x} cy={c.y} r={11} fill="transparent" />}
              </g>
            );
          })}

          {activeCoord && (
            <line
              x1={activeCoord.x}
              x2={activeCoord.x}
              y1={pad.t}
              y2={pad.t + innerH}
              stroke="rgba(255,255,255,0.09)"
              strokeWidth={1}
            />
          )}
        </svg>

        {activePoint && activeCoord && (
          <div
            className="absolute pointer-events-none z-10 -translate-x-1/2 -translate-y-full"
            style={{ left: activeCoord.x, top: activeCoord.y - 10 }}
          >
            <div className="vault-surface-elevated shadow-vault-xl border border-vault-border/50 rounded-xl px-3.5 py-2.5 min-w-[132px]">
              <p className="text-[10px] tracking-[0.14em] font-semibold text-vault-muted uppercase whitespace-nowrap">
                {activePoint.month.toUpperCase()}
              </p>
              <p className="text-[13px] font-bold text-vault-text tabular-nums mt-0.5 whitespace-nowrap">
                {formatMinutes(activePoint.minutes)}
              </p>
              <p className="text-[11px] text-vault-muted tabular-nums">
                {activePoint.minutes.toLocaleString()} minutes · {(activePoint.minutes / 60).toFixed(1)}h
              </p>
            </div>
          </div>
        )}

        <div
          className="absolute left-0 right-0 flex justify-between px-1 md:px-2 pointer-events-none"
          style={{ bottom: 0 }}
        >
          {points.map((p) => (
            <span
              key={p.month}
              className="text-[10px] md:text-[11px] font-medium text-vault-muted tabular-nums"
              style={{ opacity: active === null ? 0.9 : 0.45 }}
            >
              {p.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto scrollbar-hide">
        <table className="sr-only">
          <caption>Monthly watch time</caption>
          <thead>
            <tr>
              <th>Month</th>
              <th>Minutes</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.month}>
                <td>{p.month}</td>
                <td>{p.minutes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="sr-only">
        Peak month {points.reduce((a, b) => (a.minutes > b.minutes ? a : b)).month} with{' '}
        {formatMinutes(Math.max(...points.map((p) => p.minutes)))}.
      </p>
    </div>
  );
}
