import { Images, Layers } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import type { ResearchProduct } from '../api';

type OnOpen = (product: ResearchProduct) => void;

function priceLabel(product: ResearchProduct): string | null {
  if (product.price === null) return null;
  return `${product.currency ? `${product.currency} ` : '$'}${product.price.toFixed(2)}`;
}

function hasDesigns(product: ResearchProduct): boolean {
  const value = product.statistics?.artistDesignCount;
  return value !== null && value !== undefined;
}

function hasProducts(product: ResearchProduct): boolean {
  const value = product.statistics?.availableProducts;
  return value !== null && value !== undefined;
}

function activate(event: React.KeyboardEvent, onOpen: OnOpen, product: ResearchProduct) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onOpen(product);
  }
}

function ProductCard({ product, onOpen }: { product: ResearchProduct; onOpen: OnOpen }) {
  const image = product.images[0]?.imageUrl ?? null;
  const price = priceLabel(product);
  const rank = product.statistics?.rank ?? null;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpen(product)}
      onKeyDown={(event) => activate(event, onOpen, product)}
      className="group cursor-pointer transition-transform duration-150 hover:-translate-y-1 hover:border-brand/50 hover:shadow-lg hover:shadow-black/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    >
      <div className="relative aspect-video bg-panel">
        {image && (
          <img src={image} alt={product.title} loading="lazy" className="h-full w-full object-contain" />
        )}
        {rank !== null && (
          <Badge variant="default" className="absolute left-2 top-2">
            #{rank}
          </Badge>
        )}
      </div>
      <div className="space-y-2 p-4">
        <p className="line-clamp-2 text-sm font-medium text-ink">{product.title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {product.artistName && <span className="text-info">{product.artistName}</span>}
          {price && <span className="font-semibold text-brand">{price}</span>}
        </div>
        {(hasProducts(product) || hasDesigns(product)) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
            {hasProducts(product) && (
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3 w-3" /> {product.statistics?.availableProducts} products
              </span>
            )}
            {hasDesigns(product) && (
              <span className="inline-flex items-center gap-1">
                <Images className="h-3 w-3" /> {product.statistics?.artistDesignCount?.toLocaleString()} designs
              </span>
            )}
          </div>
        )}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {product.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded-full bg-panel px-2 py-0.5 text-xs text-muted">
                {tag}
              </span>
            ))}
            {product.tags.length > 4 && <span className="text-xs text-faint">+{product.tags.length - 4}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}

function ProductRow({ product, onOpen }: { product: ResearchProduct; onOpen: OnOpen }) {
  const image = product.images[0]?.imageUrl ?? null;
  const price = priceLabel(product);
  const rank = product.statistics?.rank ?? null;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpen(product)}
      onKeyDown={(event) => activate(event, onOpen, product)}
      className="flex cursor-pointer gap-3 p-3 transition-colors hover:border-brand/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-panel">
        {image && <img src={image} alt={product.title} loading="lazy" className="h-full w-full object-contain" />}
        {rank !== null && (
          <Badge variant="default" className="absolute left-1 top-1 px-1.5 py-0 text-[10px]">
            #{rank}
          </Badge>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="line-clamp-1 text-sm font-medium text-ink">{product.title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
          {product.artistName && <span className="text-info">{product.artistName}</span>}
          {price && <span className="font-semibold text-brand">{price}</span>}
          {hasDesigns(product) && (
            <span className="inline-flex items-center gap-1 text-faint">
              <Images className="h-3 w-3" /> {product.statistics?.artistDesignCount?.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

// Product gallery. Cards/rows open the detail drawer (onOpen). `view` toggles a
// card grid (default) and a compact list. Rank, available-products and artist
// design count are live (Research Improvements R2).
export function ProductGallery({
  products,
  view = 'grid',
  onOpen,
}: {
  products: ResearchProduct[];
  view?: 'grid' | 'list';
  onOpen: OnOpen;
}) {
  if (products.length === 0) return null;
  if (view === 'list') {
    return (
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {products.map((product) => (
          <ProductRow key={product.id} product={product} onOpen={onOpen} />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onOpen={onOpen} />
      ))}
    </div>
  );
}
