import { useEffect, useState } from 'react';

interface Props {
  value: number;
  className?: string;
  barClassName?: string;
  trackClassName?: string;
}

export default function AnimatedProgress({
  value,
  className = '',
  barClassName = 'vault-progress-accent',
  trackClassName = 'bg-vault-border',
}: Props) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setWidth(Math.max(0, Math.min(100, value)));
    });
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <div className={`h-1.5 ${trackClassName} rounded-full overflow-hidden ${className}`.trim()}>
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${barClassName}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}