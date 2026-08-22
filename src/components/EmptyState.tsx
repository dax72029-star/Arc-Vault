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
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {icon && (
        <div className="text-vault-muted/20 mb-5">
          {icon}
        </div>
      )}
      <h3 className="text-h3 font-display font-semibold text-vault-text mb-2">{title}</h3>
      <p className="text-body-sm text-vault-muted max-w-sm">{description}</p>
      {actionLabel && (
        <button
          onClick={handleAction}
          className="vault-btn-primary mt-6"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
