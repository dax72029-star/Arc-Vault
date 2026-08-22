import { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="flex items-start justify-between mb-6 md:mb-8">
      <div>
        <h1 className="text-h1 font-display font-bold text-vault-text tracking-tight">{title}</h1>
        {subtitle && <p className="text-body-sm text-vault-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
