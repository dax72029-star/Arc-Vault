import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

export default function CursorAura() {
  const ref = useRef<HTMLDivElement | null>(null);
  const pos = useRef({ x: -400, y: -400 });
  const target = useRef({ x: -400, y: -400 });
  const raf = useRef<number | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };
    const tick = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.075;
      pos.current.y += (target.current.y - pos.current.y) * 0.075;
      if (ref.current) {
        ref.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    raf.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[1] hidden lg:block opacity-0 lg:opacity-100"
      style={{
        width: 560,
        height: 560,
        marginLeft: 0,
        marginTop: 0,
        background:
          'radial-gradient(280px circle at center, rgba(220,38,38,0.07) 0%, rgba(220,38,38,0.03) 35%, transparent 70%)',
        filter: 'blur(0.5px)',
        willChange: 'transform',
        transition: 'opacity 220ms ease',
      }}
    />
  );
}
