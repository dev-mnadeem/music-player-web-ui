import { describe, expect, it } from 'vitest';
import { DEFAULT_PAGE_SIZE, emptyPage, MAX_PAGE_SIZE, paginate } from '@/lib/catalogue/types';

const numbers = Array.from({ length: 250 }, (_, index) => index);

describe('paginate', () => {
  it('reports total and hasMore independently of the slice', () => {
    const page = paginate(numbers, 10, 0);
    expect(page.items).toHaveLength(10);
    expect(page.total).toBe(250);
    expect(page.hasMore).toBe(true);
  });

  it('closes hasMore on the final slice', () => {
    const page = paginate(numbers, 10, 240);
    expect(page.items).toHaveLength(10);
    expect(page.hasMore).toBe(false);
  });

  it('caps the page size so a caller cannot ask for everything', () => {
    expect(paginate(numbers, 5000, 0).limit).toBe(MAX_PAGE_SIZE);
    expect(paginate(numbers, 5000, 0).items).toHaveLength(MAX_PAGE_SIZE);
  });

  it('falls back to the default size for nonsense input', () => {
    expect(paginate(numbers, Number.NaN, 0).limit).toBe(DEFAULT_PAGE_SIZE);
    expect(paginate(numbers, 0, 0).limit).toBe(DEFAULT_PAGE_SIZE);
  });

  it('treats a negative offset as the start', () => {
    expect(paginate(numbers, 5, -20).offset).toBe(0);
  });

  it('returns an empty slice past the end', () => {
    const page = paginate(numbers, 10, 999);
    expect(page.items).toHaveLength(0);
    expect(page.hasMore).toBe(false);
  });
});

describe('emptyPage', () => {
  it('is empty and has nothing more', () => {
    const page = emptyPage<number>(24);
    expect(page.items).toHaveLength(0);
    expect(page.total).toBe(0);
    expect(page.hasMore).toBe(false);
  });
});
