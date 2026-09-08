import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Orbit, Eye } from 'lucide-react';
import type { TrackerItem } from '../types';
import TMDBImage from './TMDBImage';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface Props {
  items: TrackerItem[];
  title?: string;
  subtitle?: string;
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function fibonacciSphere(n: number, radius: number) {
  const pts: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN_ANGLE * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    pts.push({ x: x * radius, y: y * radius, z: z * radius });
  }
  return pts;
}

export default function CinemaUniverse({ items, title = 'Your Cinema Universe', subtitle = 'Every story you\u2019ve completed, in one place.' }: Props) {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sphereRef = useRef<HTMLDivElement | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const focusedRef = useRef<string | null>(null);
  const rot = useRef({ y: -18, x: 8 });
  const target = useRef({ y: -18, x: 8 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);
  const visibleRef = useRef(true);

  useEffect(() => { focusedRef.current = focusedId; }, [focusedId]);
  useEffect(() => { setIsTouch(window.matchMedia('(pointer: coarse)').matches); }, []);

  const completed = useMemo(() => items.filter((i) => (i.type === 'movie' && i.status === 'completed') || (i.type === 'tv' && i.status === 'completed')), [items]);
  const radius = 260;
  const pts = useMemo(() => fibonacciSphere(completed.length, radius), [completed.length]);

  useEffect(() => {
    if (reduced) return;
    const el = containerRef.current;
    const sphere = sphereRef.current;
    if (!el || !sphere) return;

    const onMove = (e: MouseEvent) => {
      if (dragging.current) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      target.current.y += dx * 0.45;
      target.current.x += -dy * 0.35;
      target.current.x = Math.max(-22, Math.min(22, target.current.x));
    };

    const schedule = () => {
      if (raf.current == null && !document.hidden && visibleRef.current) {
        raf.current = requestAnimationFrame(tick);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        visibleRef.current = entries[0]?.isIntersecting ?? true;
        if (visibleRef.current && !document.hidden) schedule();
        else if (raf.current) { cancelAnimationFrame(raf.current); raf.current = null; }
      },
      { threshold: 0.06 }
    );
    io.observe(el);

    const onVisibility = () => {
      if (document.hidden) {
        if (raf.current) { cancelAnimationFrame(raf.current); raf.current = null; }
      } else if (visibleRef.current) schedule();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // P0: cache trig per frame, no matches(':hover'), pause when hidden/offscreen
    const tick = () => {
      if (document.hidden || !visibleRef.current) { raf.current = null; return; }
      if (!dragging.current) target.current.y += 0.05;
      rot.current.y += (target.current.y - rot.current.y) * 0.06;
      rot.current.x += (target.current.x - rot.current.x) * 0.06;
      sphere.style.transform = `rotateX(${rot.current.x}deg) rotateY(${rot.current.y}deg)`;
      const cosY = Math.cos((rot.current.y * Math.PI) / 180);
      const sinY = Math.sin((rot.current.y * Math.PI) / 180);
      const cosX = Math.cos((rot.current.x * Math.PI) / 180);
      const sinX = Math.sin((rot.current.x * Math.PI) / 180);
      const children = sphere.children as unknown as HTMLElement[];
      const focusId = focusedRef.current;
      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        const p = pts[i];
        if (!child || !p) continue;
        let x = p.x * cosY - p.z * sinY;
        let z = p.x * sinY + p.z * cosY;
        let y = p.y * cosX - z * sinX;
        z = p.y * sinX + z * cosX;
        const depth = (z + radius) / (radius * 2);
        const scale = 0.72 + depth * 0.32;
        const opacity = 0.32 + depth * 0.68;
        child.style.opacity = String(opacity);
        child.style.zIndex = String(Math.round(depth * 1000));
        const isFocused = focusId === completed[i]?.id;
        child.style.transform = isFocused
          ? `translate3d(${x}px, ${y}px, ${z + 18}px) scale(${scale * 1.14})`
          : `translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`;
      }
      raf.current = requestAnimationFrame(tick);
    };

    el.addEventListener('mousemove', onMove, { passive: true });
    raf.current = requestAnimationFrame(tick);
    return () => {
      el.removeEventListener('mousemove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
      io.disconnect();
    };
  }, [pts, reduced, completed]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    target.current.y += dx * 0.22;
    target.current.x += -dy * 0.18;
    target.current.x = Math.max(-24, Math.min(24, target.current.x));
  };
  const onPointerUp = () => { dragging.current = false; };

  if (completed.length === 0) {
    return (
      <div className="vault-card p-8 text-center">
        <Orbit className="w-8 h-8 text-vault-muted mx-auto mb-3" />
        <p className="text-sm text-vault-text font-medium">No completed titles yet</p>
        <p className="text-xs text-vault-muted mt-1">Complete movies and series to populate your universe.</p>
      </div>
    );
  }
  if (reduced) {
    return (
      <section aria-label={title}>
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-[11px] tracking-[0.18em] font-semibold text-vault-gold uppercase flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Cinema Universe</p>
            <h2 className="text-xl md:text-2xl font-display font-bold text-vault-text mt-1">{title}</h2>
            <p className="text-xs md:text-sm text-vault-muted mt-1">{subtitle}</p>
          </div>
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-vault-muted bg-vault-surface-elevated border border-vault-border/30 rounded-full px-3 py-1.5"><Eye className="w-3.5 h-3.5" /> {completed.length} titles</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {completed.slice(0, 48).map((it) => (
            <button key={it.id} onClick={() => navigate(`/title/${it.type}/${it.tmdbId}`)} className="group rounded-lg overflow-hidden bg-vault-card border border-vault-border/40 hover:border-vault-border transition-colors text-left">
              <div className="aspect-[2/3] overflow-hidden bg-vault-surface"><TMDBImage path={it.poster} alt={it.title} size="w185" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" fallbackClassName="w-full h-full" /></div>
              <div className="p-1.5"><p className="text-[10px] font-medium text-vault-text truncate">{it.title}</p></div>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section aria-label={title} className="select-none">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4 md:mb-6">
        <div>
          <p className="text-[11px] tracking-[0.2em] font-semibold text-vault-gold uppercase flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Cinema Universe</p>
          <h2 className="text-xl md:text-2xl font-display font-bold text-vault-text mt-1 tracking-tight">{title}</h2>
          <p className="text-xs md:text-sm text-vault-muted mt-1 max-w-xl">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-vault-text bg-vault-surface-elevated border border-vault-border/40 rounded-full px-3 py-1.5"><span className="w-1.5 h-1.5 rounded-full bg-vault-success animate-pulse" />{completed.length} completed</span>
          {!isTouch && <span className="hidden md:inline text-[11px] text-vault-muted">Move cursor to explore · Drag to rotate · Hover poster to focus</span>}
          {isTouch && <span className="hidden md:inline text-[11px] text-vault-muted">Drag to rotate · Tap to focus · Tap again to open</span>}
        </div>
      </div>
      <div ref={containerRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} className="relative vault-card overflow-hidden bg-gradient-to-b from-vault-surface-elevated via-vault-card to-vault-surface/60 border-vault-border/40" style={{ height: 'min(72vh, 560px)', minHeight: 380, touchAction: 'none', cursor: 'grab' as const }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-vault-accent/[0.04] blur-3xl" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] rounded-full border border-vault-border/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-vault-bg/35 via-transparent to-transparent" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: '1100px', perspectiveOrigin: '50% 50%' }}>
          <div ref={sphereRef} className="relative" style={{ width: 1, height: 1, transformStyle: 'preserve-3d', willChange: 'transform', transform: 'rotateX(8deg) rotateY(-18deg)' }}>
            {completed.map((it) => (
              <button key={it.id} onClick={() => { if (focusedId !== it.id && isTouch) { setFocusedId(it.id); return; } navigate(`/title/${it.type}/${it.tmdbId}`); }} onMouseEnter={() => !isTouch && setFocusedId(it.id)} onMouseLeave={() => setFocusedId((v) => (v === it.id ? null : v))} onFocus={() => setFocusedId(it.id)} onBlur={() => setFocusedId((v) => (v === it.id ? null : v))} className="absolute left-0 top-0 -ml-[34px] -mt-[51px] md:-ml-[42px] md:-mt-[63px] w-[68px] h-[102px] md:w-[84px] md:h-[126px] rounded-lg overflow-hidden bg-vault-surface shadow-vault-lg border border-white/8 hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vault-accent/50" style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden', transition: 'transform 260ms cubic-bezier(0,0,0.2,1), opacity 260ms ease, border-color 200ms ease, box-shadow 260ms ease', boxShadow: focusedId === it.id ? '0 10px 28px rgba(0,0,0,0.55), 0 0 22px rgba(220,38,38,0.18)' : '0 8px 22px rgba(0,0,0,0.5)' }} aria-label={`${it.title} (${it.releaseYear}) — ${it.type === 'tv' ? 'Series' : 'Movie'} — rating ${it.personalRating > 0 ? it.personalRating + '/10' : 'unrated'}`}>
                <TMDBImage path={it.poster} alt={it.title} size="w185" className="w-full h-full object-cover" fallbackClassName="w-full h-full bg-vault-surface-elevated" fallbackText={it.title.slice(0, 2).toUpperCase()} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-white/0 opacity-60" />
                {it.personalRating > 0 && focusedId === it.id && (<span className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md border border-white/10">★ {it.personalRating}</span>)}
                {focusedId === it.id && (<span className="absolute bottom-0 inset-x-0 p-1.5 pt-6 bg-gradient-to-t from-black/90 via-black/55 to-transparent"><span className="block text-[10px] font-semibold text-white truncate leading-tight">{it.title}</span><span className="block text-[9px] text-white/60">{it.releaseYear} · {it.type === 'tv' ? 'Series' : 'Movie'}</span></span>)}
              </button>
            ))}
          </div>
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 text-[11px] text-white/55 bg-black/30 backdrop-blur-md border border-white/10 rounded-full px-3.5 py-1.5 pointer-events-none"><Orbit className="w-3.5 h-3.5" />{isTouch ? 'Drag to explore · Tap poster' : 'Explore your universe'}</div>
      </div>
      <p className="sr-only">{completed.length} completed titles visualized as a 3D universe. Use mouse or touch to rotate.</p>
    </section>
  );
}
