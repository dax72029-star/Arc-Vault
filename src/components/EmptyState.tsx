import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, description, actionLabel, actionTo, onAction }: Props) {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionTo) {
      navigate(actionTo);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center py-14 md:py-24 px-4 text-center overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-vault-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="relative">
        {icon && (
          <div className="relative inline-flex items-center justify-center mb-5 md:mb-6">
            <div className="absolute inset-0 rounded-2xl bg-vault-accent/10 blur-2xl opacity-70" />
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-vault-surface-elevated border border-vault-border/40 flex items-center justify-center shadow-vault-md">
              <div className="text-vault-accent/40">
                {icon}
              </div>
            </div>
          </div>
        )}
        <h3 className="text-base md:text-h3 font-display font-semibold text-vault-text mb-2">{title}</h3>
        <p className="text-xs md:text-body-sm text-vault-muted max-w-sm">{description}</p>
        {actionLabel && (
          <button
            onClick={handleAction}
            className="vault-btn-primary mt-6 min-h-[46px]"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}