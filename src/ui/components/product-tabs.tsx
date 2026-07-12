import { useMemo, useState } from 'react';
import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
import type { ResearchProduct } from '../api';
import { aggregateArtists, aggregateTags, sortProducts, type ProductSort } from '../lib/metrics';
import { TabBar } from './tab-bar';
import { ProductGallery } from './product-gallery';
import { ProductDrawer } from './product-drawer';
import { ArtistList } from './artist-list';
import { TagChips } from './tag-chips';
import { PriceAnalysis } from './price-analysis';
import { ComingSoon } from './coming-soon';
import { EmptyState } from './empty-state';
import { Button } from './ui/button';

type View = 'grid' | 'list';
type PerPage = 12 | 24 | 48;

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'rank', label: 'Sort: Rank' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'title', label: 'Title: A–Z' },
];

const PER_PAGE_OPTIONS: { value: PerPage; label: string }[] = [
  { value: 12, label: '12 / page' },
  { value: 24, label: '24 / page' },
  { value: 48, label: '48 / page' },
];

type FilterBarProps = {
  query: string;
  onQuery: (value: string) => void;
  sort: ProductSort;
  onSort: (sort: ProductSort) => void;
  view: View;
  onView: (view: View) => void;
  perPage: PerPage;
  onPerPage: (perPage: PerPage) => void;
  onReset: () => void;
  hasQuery: boolean;
};

function FilterBar({ query, onQuery, sort, onSort, view, onView, perPage, onPerPage, onReset, hasQuery }: FilterBarProps) {
  const toggleClass = (active: boolean) =>
    'flex h-8 w-8 items-center justify-center rounded transition-colors ' +
    (active ? 'bg-brand text-canvas' : 'text-muted hover:bg-elevated hover:text-ink');

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[12rem] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search products, artists, tags…"
          aria-label="Search products"
          className="h-9 w-full rounded-md border border-hairline bg-panel pl-8 pr-3 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      <div className="flex rounded-md border border-hairline p-0.5">
        <button type="button" aria-label="Grid view" className={toggleClass(view === 'grid')} onClick={() => onView('grid')}>
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button type="button" aria-label="List view" className={toggleClass(view === 'list')} onClick={() => onView('list')}>
          <List className="h-4 w-4" />
        </button>
      </div>
      <select
        value={sort}
        onChange={(event) => onSort(event.target.value as ProductSort)}
        aria-label="Sort products"
        className="h-9 rounded-md border border-hairline bg-panel px-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        value={perPage}
        onChange={(event) => onPerPage(Number(event.target.value) as PerPage)}
        aria-label="Items per page"
        className="h-9 rounded-md border border-hairline bg-panel px-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand"
      >
        {PER_PAGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled
        title="Coming soon"
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-hairline bg-panel px-3 text-sm text-muted opacity-60"
      >
        <SlidersHorizontal className="h-4 w-4" /> Filters
      </button>
      <button
        type="button"
        onClick={onReset}
        disabled={!hasQuery}
        className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-sm text-muted hover:text-ink disabled:opacity-40"
      >
        <X className="h-4 w-4" /> Reset
      </button>
    </div>
  );
}

function pageList(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages: (number | '…')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) pages.push('…');
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < total - 1) pages.push('…');
  pages.push(total);
  return pages;
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  if (total <= 1) return null;
  const pages = pageList(page, total);
  const pageClass = (active: boolean) =>
    'flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm ' +
    (active ? 'bg-brand text-canvas' : 'border border-hairline bg-panel text-muted hover:text-ink');
  const edgeClass =
    'flex h-8 items-center justify-center rounded-md border border-hairline bg-panel px-2 text-sm text-muted hover:text-ink disabled:opacity-40';

  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => onChange(page - 1)} className={edgeClass}>
        ‹
      </button>
      {pages.map((p, index) =>
        typeof p === 'number' ? (
          <button key={index} className={pageClass(p === page)} onClick={() => onChange(p)}>
            {p}
          </button>
        ) : (
          <span key={index} className="px-1 text-faint">
            {p}
          </span>
        ),
      )}
      <button type="button" aria-label="Next page" disabled={page === total} onClick={() => onChange(page + 1)} className={edgeClass}>
        ›
      </button>
    </div>
  );
}

// The tabbed data area. Products has a filter bar (search / grid-list / sort /
// per-page / coming-soon Filters / reset) + pagination + empty states. Artists,
// Tags, Price Analysis render aggregations; Trend is Coming Soon.
export function ProductTabs({ products }: { products: ResearchProduct[] }) {
  const [active, setActive] = useState('products');
  const [sort, setSort] = useState<ProductSort>('rank');
  const [view, setView] = useState<View>('grid');
  const [query, setQuery] = useState('');
  const [perPage, setPerPage] = useState<PerPage>(24);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ResearchProduct | null>(null);

  const tags = aggregateTags(products);
  const artists = aggregateArtists(products);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (product) =>
        product.title.toLowerCase().includes(term) ||
        (product.artistName?.toLowerCase().includes(term) ?? false) ||
        product.tags.some((tag) => tag.toLowerCase().includes(term)),
    );
  }, [products, query]);

  const sorted = useMemo(() => sortProducts(filtered, sort), [filtered, sort]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageItems = sorted.slice((safePage - 1) * perPage, safePage * perPage);

  const resetFilters = () => {
    setQuery('');
    setPage(1);
  };
  const changeTab = (id: string) => {
    setActive(id);
    setSelected(null);
  };

  const tabs = [
    { id: 'products', label: `Products (${products.length})` },
    { id: 'artists', label: `Artists (${artists.length})` },
    { id: 'tags', label: `Tags (${tags.length})` },
    { id: 'price', label: 'Price Analysis' },
    { id: 'trend', label: 'Trend Analysis' },
  ];

  return (
    <div className="space-y-4">
      <TabBar tabs={tabs} active={active} onChange={changeTab} />

      {active === 'products' && (
        <div className="space-y-3">
          <FilterBar
            query={query}
            onQuery={(value) => {
              setQuery(value);
              setPage(1);
            }}
            sort={sort}
            onSort={(next) => {
              setSort(next);
              setPage(1);
            }}
            view={view}
            onView={setView}
            perPage={perPage}
            onPerPage={(next) => {
              setPerPage(next);
              setPage(1);
            }}
            onReset={resetFilters}
            hasQuery={query.trim().length > 0}
          />

          {sorted.length === 0 ? (
            query.trim() ? (
              <EmptyState
                icon={Search}
                title="No matching products"
                description={`No products match "${query.trim()}".`}
                action={
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Clear search
                  </Button>
                }
              />
            ) : (
              <EmptyState title="No products collected" description="This research did not collect any products. Try a different keyword or product type." />
            )
          ) : (
            <>
              <ProductGallery products={pageItems} view={view} onOpen={setSelected} />
              <Pagination page={safePage} total={totalPages} onChange={setPage} />
            </>
          )}
        </div>
      )}

      {active === 'artists' &&
        (artists.length ? <ArtistList artists={artists} /> : <EmptyState title="No artist data" />)}
      {active === 'tags' && (tags.length ? <TagChips tags={tags} /> : <EmptyState title="No tags collected" />)}
      {active === 'price' && <PriceAnalysis products={products} />}
      {active === 'trend' && (
        <ComingSoon
          title="Trend Analysis"
          description="Upload-recency and trend velocity arrive with Research Improvements Wave 2."
        />
      )}

      <ProductDrawer product={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
