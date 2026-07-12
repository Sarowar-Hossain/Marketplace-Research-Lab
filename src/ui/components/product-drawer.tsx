import { useEffect, useState, type ReactNode } from 'react';
import { ExternalLink, X } from 'lucide-react';
import type { ResearchProduct } from '../api';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">{label}</p>
      <div className="text-sm text-ink">{children}</div>
    </div>
  );
}

function ComingSoonNote() {
  return <p className="text-xs italic text-faint">Coming soon</p>;
}

function priceLabel(product: ResearchProduct): string | null {
  if (product.price === null) return null;
  return `${product.currency ? `${product.currency} ` : '$'}${product.price.toFixed(2)}`;
}

function hasValue(value: number | null | undefined): value is number {
  return value !== null && value !== undefined;
}

// Right-slide product detail drawer, always mounted so it can animate both in
// and out. Reserved sections (variations, AI notes, research notes) render as
// Coming Soon so the layout is final today.
export function ProductDrawer({
  product,
  onClose,
}: {
  product: ResearchProduct | null;
  onClose: () => void;
}) {
  const open = product !== null;
  const [last, setLast] = useState<ResearchProduct | null>(null);
  useEffect(() => {
    if (product) setLast(product);
  }, [product]);
  const shown = product ?? last;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const stats = shown?.statistics ?? null;
  const price = shown ? priceLabel(shown) : null;
  const rank = stats?.rank ?? null;

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close details"
        tabIndex={open ? 0 : -1}
        className={`absolute inset-0 cursor-default bg-black/60 transition-opacity duration-300 motion-reduce:transition-none ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal={open}
        aria-label={shown?.title ?? 'Product details'}
        className={`relative flex h-full w-full max-w-md flex-col border-l border-hairline bg-elevated shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {shown && (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-hairline p-4">
              <h2 className="line-clamp-2 text-base font-semibold text-ink">{shown.title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-panel hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              {shown.images[0]?.imageUrl && (
                <img
                  src={shown.images[0].imageUrl}
                  alt={shown.title}
                  className="aspect-video w-full rounded-lg bg-panel object-contain"
                />
              )}

              <Button variant="outline" asChild className="w-full">
                <a href={shown.productUrl} target="_blank" rel="noreferrer">
                  <ExternalLink /> View on Redbubble
                </a>
              </Button>

              <div className="flex flex-wrap gap-6">
                {price && (
                  <Field label="Price">
                    <span className="font-semibold text-brand">{price}</span>
                  </Field>
                )}
                {rank !== null && (
                  <Field label="Top-selling rank">
                    <Badge variant="default">#{rank}</Badge>
                  </Field>
                )}
              </div>

              {shown.artistName && (
                <Field label="Artist">
                  <span className="text-info">{shown.artistName}</span>
                  {hasValue(stats?.artistDesignCount) && (
                    <span className="text-muted"> · {stats?.artistDesignCount?.toLocaleString()} designs</span>
                  )}
                </Field>
              )}

              {shown.description && (
                <Field label="Description">
                  <p className="whitespace-pre-wrap text-muted">{shown.description}</p>
                </Field>
              )}

              {shown.tags.length > 0 && (
                <Field label="Tags">
                  <div className="flex flex-wrap gap-1.5">
                    {shown.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-hairline bg-panel px-2.5 py-0.5 text-xs text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Field>
              )}

              <div className="grid grid-cols-2 gap-4">
                {shown.productType && <Field label="Product type">{shown.productType}</Field>}
                {shown.currency && <Field label="Currency">{shown.currency}</Field>}
                {hasValue(stats?.availableProducts) && (
                  <Field label="Available on">{stats?.availableProducts} products</Field>
                )}
                {hasValue(stats?.favorites) && <Field label="Favorites">{stats?.favorites}</Field>}
              </div>

              <Field label="Product variations">
                <ComingSoonNote />
              </Field>
              <Field label="AI notes">
                <ComingSoonNote />
              </Field>
              <Field label="Research notes">
                <ComingSoonNote />
              </Field>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
