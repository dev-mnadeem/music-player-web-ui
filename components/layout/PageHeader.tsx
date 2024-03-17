import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  lede?: string;
  children?: ReactNode;
}

export function PageHeader({ eyebrow, title, lede, children }: PageHeaderProps) {
  return (
    <header className="bg-gradient-to-b from-accent-soft/25 to-transparent px-8 pb-8 pt-10">
      {eyebrow ? (
        <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
      ) : null}
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      {lede ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{lede}</p> : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </header>
  );
}
