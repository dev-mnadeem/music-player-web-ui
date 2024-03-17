'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { IconType } from 'react-icons';
import { twMerge } from 'tailwind-merge';

export interface NavLinkProps {
  href: string;
  label: string;
  icon: IconType;
}

export function NavLink({ href, label, icon: Icon }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={twMerge(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
        isActive ? 'bg-raised text-fg' : 'text-muted hover:text-fg'
      )}
    >
      <Icon size={20} />
      {label}
    </Link>
  );
}
