import type { ComponentType } from 'react';

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

type StatTileProps = {
  label: string;
  value: string;
  sub?: string;
  icon: ComponentType<{ className?: string }>;
  tone: Tone;
  soon?: boolean;
};

// Reusable metric tile used inside the Market Overview / Trend panels (and
// later AI insight cards). `soon` renders the final layout with a muted
// "Coming soon" state so the design stays stable until the data lands.
export function StatTile({ label, value, sub, icon: Icon, tone, soon }: StatTileProps) {
  return (
    <div className="rounded-lg border border-hairline p-4">
      <span className={`flex h-8 w-8 items-center justify-center rounded-md ${TONE_ICON[tone]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className={`mt-3 text-xl font-bold ${soon ? 'text-faint' : TONE_VALUE[tone]}`}>
        {soon ? 'Soon' : value}
      </p>
      <p className="mt-1 text-xs font-medium text-muted">{label}</p>
      {sub && (
        <p className="mt-0.5 truncate text-xs text-faint" title={sub}>
          {soon ? 'Coming soon' : sub}
        </p>
      )}
    </div>
  );
}
