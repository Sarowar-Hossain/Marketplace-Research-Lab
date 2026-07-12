import type { ReactNode } from 'react';
import { ArrowUpRight, BarChart3, Clock, Cloud, Images, Plus, User, Waves } from 'lucide-react';
import { Card } from './ui/card';
import { StatTile } from './stat-tile';
import type { ResearchProduct } from '../api';
import { averageArtistPortfolio } from '../lib/metrics';

function Panel({ title, action, children }: { title: string; action?: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {action && (
          <button type="button" className="text-xs text-muted hover:text-ink" title="Coming soon">
            {action}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </Card>
  );
}

// Market Overview: product count and average artist portfolio are live from
// stored rows; incumbent concentration and new-artist entrants need signals
// that aren't captured yet, so they render as Coming Soon placeholders.
export function MarketOverview({ products }: { products: ResearchProduct[] }) {
  const avgPortfolio = averageArtistPortfolio(products);
  return (
    <Panel title="Market Overview">
      <StatTile
        label="Products Analyzed"
        value={String(products.length)}
        sub="in this research"
        icon={BarChart3}
        tone="brand"
      />
      <StatTile
        label="Avg Artist Portfolio"
        value={avgPortfolio !== null ? avgPortfolio.toLocaleString() : '—'}
        sub="designs per artist"
        icon={Images}
        tone="violet"
      />
      <StatTile label="Incumbent Activity" value="" sub="top-artist concentration" icon={Waves} tone="info" soon />
      <StatTile label="New Artists Entering" value="" sub="recent entrants" icon={Plus} tone="warning" soon />
    </Panel>
  );
}

// Trend Velocity needs recent-sort / upload-recency data (Research Improvements
// Wave 2). The full panel renders in its final layout with Coming Soon tiles.
export function TrendVelocity() {
  return (
    <Panel title="Trend Velocity" action="View details">
      <StatTile label="Recent Uploads" value="" sub="last 30 days" icon={Cloud} tone="info" soon />
      <StatTile label="Fresh Top Sellers" value="" sub="new in top ranks" icon={ArrowUpRight} tone="brand" soon />
      <StatTile label="Top Artist Activity" value="" sub="incumbent output" icon={Clock} tone="violet" soon />
      <StatTile label="New Artists" value="" sub="entering the niche" icon={User} tone="warning" soon />
    </Panel>
  );
}
