import { ReactNode } from 'react';

interface Props {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
  sublabel?: string;
  variant?: 'default' | 'elevated' | 'glass';
}

export default function StatCard({ label, value, icon, color = 'text-vault-accent', sublabel, variant = 'default' }: Props) {
  const baseClasses = variant === 'glass'
    ? 'vault-glass'
    : variant === 'elevated'
    ? 'vault-surface-elevated'
    : 'vault-card';

  return (
    <div className={`${baseClasses} p-4 transition-all duration-200 hover:border-vault-border`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-vault-muted font-medium uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-display font-bold mt-1.5 ${color}`}>{value}</p>
          {sublabel && <p className="text-[11px] text-vault-muted mt-1.5">{sublabel}</p>}
        </div>
        {icon && (
          <div className={`${color} opacity-40 flex-shrink-0 mt-0.5`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
