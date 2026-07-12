import type { ComponentType } from 'react';
import { Package, Tag, TrendingUp, Trophy, Users } from 'lucide-react';
import { Card } from './ui/card';
import type { Metrics } from '../lib/metrics';

type Tone = 'violet' | 'info' | 'brand' | 'warning' | 'danger';

const TONE_VALUE: Record<Tone, string> = {
  violet: 'text-violet',
  info: 'text-info',
  brand: 'text-brand',
  warning: 'text-warning',
  danger: 'text-danger',
};

const TONE_ICON: Record<Tone, string> = {
  violet: 'bg-violet/10 text-violet',
  info: 'bg-info/10 text-info',
  brand: 'bg-brand/10 text-brand',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
};

type KpiCardProps = {
  label: string;
  value: string;
  sub: string;
  icon: ComponentType<{ className?: string }>;
  tone: Tone;
  soon?: boolean;
};

function KpiCard({ label, value, sub, icon: Icon, tone, soon }: KpiCardProps) {
  return (
    <Card className="p-4 transition-transform duration-150 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-md ${TONE_ICON[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className={`mt-2 text-2xl font-bold ${soon ? 'text-faint' : TONE_VALUE[tone]}`}>{value}</p>
      <p className="mt-1 truncate text-xs text-faint" title={sub}>
        {soon ? 'Coming soon' : sub}
      </p>
    </Card>
  );
}

function formatPrice(value: number | null): string {
  return value === null ? '—' : `$${value.toFixed(2)}`;
}

// Five KPI cards. Four are computed live from stored product rows; Trend
// Velocity stays a placeholder until recent-sort data lands (Research
// Improvements Wave 2).
export function MetricsStrip({ metrics }: { metrics: Metrics }) {
  const priceRange =
    metrics.priceMin === null ? '—' : `${formatPrice(metrics.priceMin)}–${formatPrice(metrics.priceMax)}`;

  const cards: KpiCardProps[] = [
    { label: 'Products Collected', value: String(metrics.productCount), sub: 'products analyzed', icon: Package, tone: 'violet' },
    { label: 'Price Range', value: priceRange, sub: `Median: ${formatPrice(metrics.priceMedian)}`, icon: Tag, tone: 'info' },
    { label: 'Unique Artists', value: String(metrics.uniqueArtistCount), sub: 'artists in results', icon: Users, tone: 'brand' },
    {
      label: 'Top Artist Share',
      value: metrics.topArtist ? `${Math.round(metrics.topArtist.share * 100)}%` : '—',
      sub: metrics.topArtist?.name ?? '—',
      icon: Trophy,
      tone: 'warning',
    },
    { label: 'Trend Velocity', value: 'Soon', sub: 'fresh top sellers', icon: TrendingUp, tone: 'danger', soon: true },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </div>
  );
}
