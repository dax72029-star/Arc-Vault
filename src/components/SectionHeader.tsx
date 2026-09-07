import { ReactNode } from 'react';

interface Props {
  title: string;
  icon?: ReactNode;
  iconColor?: string;
  action?: ReactNode;
}

export default function SectionHeader({ title, icon, iconColor = 'text-vault-accent', action }: Props) {
  return (
    <div className="flex items-center justify-between mb-3 md:mb-4">
      <h2 className="text-[15px] md:text-h3 font-display font-semibold text-vault-text flex items-center gap-2">
        {icon && <span className={iconColor}>{icon}</span>}
        {title}
      </h2>
      {action}
    </div>
  );
}