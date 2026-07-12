import { Card } from './ui/card';
import type { Metrics } from '../lib/metrics';

function formatPrice(value: number | null): string {
  return value === null ? '—' : `$${value.toFixed(2)}`;
}

// At-a-glance market metrics: item count, price range/median, unique sellers,
// and the dominant artist's share of the results.
export function MetricsStrip({ metrics }: { metrics: Metrics }) {
  const tiles = [
    { label: 'Products', value: String(metrics.productCount) },
    {
      label: 'Price range',
      value: metrics.priceMin === null ? '—' : `${formatPrice(metrics.priceMin)}–${formatPrice(metrics.priceMax)}`,
    },
    { label: 'Median price', value: formatPrice(metrics.priceMedian) },
    { label: 'Unique artists', value: String(metrics.uniqueArtistCount) },
    {
      label: 'Top artist',
      value: metrics.topArtist ? `${metrics.topArtist.name} · ${Math.round(metrics.topArtist.share * 100)}%` : '—',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((tile) => (
        <Card key={tile.label} className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{tile.label}</p>
          <p className="mt-1 truncate text-lg font-semibold text-neutral-900" title={tile.value}>
            {tile.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
