import { ArrowDown, ArrowUp, ArrowUpDown, Coins } from 'lucide-react';
import type { ResearchProduct } from '../api';
import { priceStats } from '../lib/metrics';
import { StatTile } from './stat-tile';

function money(value: number | null): string {
  return value === null ? '—' : `$${value.toFixed(2)}`;
}

// Price distribution summary: min / median / average / max, computed live from
// the collected price rows. Richer distribution charts are a later enhancement.
export function PriceAnalysis({ products }: { products: ResearchProduct[] }) {
  const stats = priceStats(products);
  if (stats.count === 0) {
    return <p className="text-sm text-muted">No price data was collected for this research.</p>;
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-faint">{stats.count} products with a price</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Minimum" value={money(stats.min)} icon={ArrowDown} tone="brand" />
        <StatTile label="Median" value={money(stats.median)} icon={ArrowUpDown} tone="info" />
        <StatTile label="Average" value={money(stats.average)} icon={Coins} tone="violet" />
        <StatTile label="Maximum" value={money(stats.max)} icon={ArrowUp} tone="warning" />
      </div>
    </div>
  );
}
