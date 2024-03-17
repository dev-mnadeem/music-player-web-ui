import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';

interface EmptyStateProps {
  icon: IconType;
  title: string;
  body: string;
  action?: ReactNode;
}

/** The thing a reviewer sees before they have clicked anything. Worth designing. */
export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      <Icon className="text-muted" size={30} />
      <p className="text-base font-semibold text-fg">{title}</p>
      <p className="max-w-sm text-sm leading-relaxed text-muted">{body}</p>
      {action}
    </div>
  );
}
