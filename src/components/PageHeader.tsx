import { ReactNode } from 'react';

interface Props {
  kicker?: string;
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export default function PageHeader({ kicker, title, subtitle, right, className = '' }: Props) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-3 mb-6 md:mb-10 ${className}`}>
      <div className="min-w-0">
        {kicker && (
          <p className="text-[10px] md:text-caption text-vault-muted uppercase tracking-[0.2em] font-medium mb-1.5 md:mb-2">
            {kicker}
          </p>
        )}
        <h1 className="text-xl md:text-h1 font-display font-bold text-vault-text tracking-tight leading-tight text-pretty">
          {title}
        </h1>
        {subtitle && <p className="text-xs md:text-body-sm text-vault-muted mt-1 md:mt-1.5">{subtitle}</p>}
      </div>
      {right && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {right}
        </div>
      )}
    </div>
  );
}

export function ContextPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-vault-accent/10 border border-vault-accent/25 text-[10px] md:text-[11px] font-semibold text-vault-accent tracking-wide whitespace-nowrap">
      {children}
    </span>
  );
}