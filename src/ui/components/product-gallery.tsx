import { Badge } from './ui/badge';
import { Card } from './ui/card';
import type { ResearchProduct } from '../api';

function priceLabel(product: ResearchProduct): string | null {
  if (product.price === null) return null;
  return `${product.currency ? `${product.currency} ` : '$'}${product.price.toFixed(2)}`;
}

function ProductCard({ product }: { product: ResearchProduct }) {
  const image = product.images[0]?.imageUrl ?? null;
  const price = priceLabel(product);

  return (
    <Card className="overflow-hidden">
      {image && (
        <a
          href={product.productUrl}
          target="_blank"
          rel="noreferrer"
          className="block aspect-video bg-neutral-100"
        >
          <img src={image} alt={product.title} loading="lazy" className="h-full w-full object-contain" />
        </a>
      )}
      <div className="space-y-2 p-4">
        <a
          href={product.productUrl}
          target="_blank"
          rel="noreferrer"
          className="line-clamp-2 block font-medium text-neutral-900 hover:underline"
        >
          {product.title}
        </a>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
          {product.artistName && <span>by {product.artistName}</span>}
          {product.productType && <Badge variant="secondary">{product.productType}</Badge>}
          {price && <span className="font-medium text-neutral-900">{price}</span>}
        </div>
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {product.tags.slice(0, 6).map((tag) => (
              <span key={tag} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// Product gallery in collection order. Images load from their remote URLs (the
// app is online during use); the standalone HTML report stays offline-safe.
export function ProductGallery({ products }: { products: ResearchProduct[] }) {
  if (products.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
