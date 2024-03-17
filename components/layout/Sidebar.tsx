'use client';

import { HiOutlineHome, HiOutlineMagnifyingGlass, HiOutlineSparkles } from 'react-icons/hi2';
import { APP_NAME } from '@/lib/config';
import { LibraryPanel } from './LibraryPanel';
import { NavLink, type NavLinkProps } from './NavLink';
import { ProviderFooter } from './ProviderFooter';

const ROUTES: NavLinkProps[] = [
  { href: '/', label: 'Home', icon: HiOutlineHome },
  { href: '/search', label: 'Search', icon: HiOutlineMagnifyingGlass },
  { href: '/moods', label: 'Mood mixes', icon: HiOutlineSparkles }
];

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-2 p-2 md:flex">
      <div className="rounded-xl bg-surface p-3">
        <div className="mb-3 flex items-center gap-2 px-1">
          <span aria-hidden className="h-5 w-5 rounded-full border-2 border-accent">
            <span className="mx-auto mt-[5px] block h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
        </div>
        <nav className="flex flex-col gap-1">
          {ROUTES.map((route) => (
            <NavLink key={route.href} {...route} />
          ))}
        </nav>
      </div>

      <LibraryPanel />

      <ProviderFooter />
    </aside>
  );
}
