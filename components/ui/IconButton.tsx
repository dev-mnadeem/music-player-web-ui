import type { ButtonHTMLAttributes } from 'react';
import type { IconType } from 'react-icons';
import { twMerge } from 'tailwind-merge';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconType;
  /** Required: these buttons never have visible text. */
  label: string;
  size?: number;
  tone?: 'default' | 'accent';
}

export function IconButton({
  icon: Icon,
  label,
  size = 18,
  tone = 'default',
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={twMerge(
        'inline-flex items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-30',
        tone === 'accent'
          ? 'bg-accent text-bg hover:brightness-110'
          : 'text-muted hover:bg-raised hover:text-fg',
        className
      )}
    >
      <Icon size={size} />
    </button>
  );
}
