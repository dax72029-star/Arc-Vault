import { ReactNode } from 'react';
import { useCountUp } from '../hooks/useCountUp';

interface Props {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
  sublabel?: string;
  variant?: 'default' | 'elevated' | 'glass';
  countUp?: boolean;
  suffix?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  color = 'text-vault-accent',
  sublabel,
  variant = 'default',
  countUp = false,
  suffix = '',
}: Props) {
  const baseClasses = variant === 'glass'
    ? 'vault-glass'
    : variant === 'elevated'
    ? 'vault-surface-elevated'
    : 'vault-card';

  const numeric = typeof value === 'number' ? value : Number(value);
  const countValue = countUp && !Number.isNaN(numeric) ? Math.round(useCountUp(numeric)) : null;

  const displayValue = countValue !== null
    ? `${countValue.toLocaleString()}${suffix}`
    : value;

  return (
    <div className={`group ${baseClasses} p-3 md:p-4 transition-all duration-200 hover:border-vault-border hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between gap-2 md:gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] md:text-[11px] text-vault-muted font-medium uppercase tracking-wider truncate">{label}</p>
          <p className={`text-lg md:text-2xl font-display font-bold mt-1 md:mt-1.5 ${color} tabular-nums`}>{displayValue}</p>
          {sublabel && <p className="text-[10px] md:text-[11px] text-vault-muted mt-1 md:mt-1.5 truncate">{sublabel}</p>}
        </div>
        {icon && (
          <div className={`flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-lg bg-vault-surface-hover/70 flex items-center justify-center transition-colors duration-200 group-hover:bg-vault-surface-active`}>
            <span className={`${color} opacity-80`}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
}