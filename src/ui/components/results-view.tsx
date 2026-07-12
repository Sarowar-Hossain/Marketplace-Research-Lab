import { ExternalLink, RotateCw } from 'lucide-react';
import type { ResearchData } from '../api';
import { computeMetrics } from '../lib/metrics';
import { parseAnalysis } from '../lib/parse-analysis';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MarketOverview, TrendVelocity } from './market-panels';
import { MetricsStrip } from './metrics-strip';
import { AnalysisSections } from './analysis-sections';
import { ProductTabs } from './product-tabs';
import { AiInsightsPanel } from './ai-insights';

type ResultsViewProps = {
  data: ResearchData;
  reportPath: string;
  onNewSearch: () => void;
  onOpenExternal: (path: string) => void;
};

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toLocaleString();
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-sm text-muted">
      <span className="text-faint">{label}:</span> {value}
    </span>
  );
}

// In-app report viewer (Doc 005 §4.1 UI "report viewer"). Rendered inside the
// AppShell content area, so no page-level <main> wrapper here.
export function ResultsView({ data, reportPath, onNewSearch, onOpenExternal }: ResultsViewProps) {
  const { session, products, analysis } = data;

  if (!session || !analysis) {
    return (
      <div className="p-8 text-ink">
        <div className="mx-auto max-w-5xl space-y-4">
          <p className="text-muted">This research session has no reportable data.</p>
          <Button onClick={onNewSearch}>New search</Button>
        </div>
      </div>
    );
  }

  const metrics = computeMetrics(products);
  const sections = parseAnalysis(analysis.response);
  const marketplaceUrl = `https://www.redbubble.com/shop?query=${encodeURIComponent(session.keyword)}`;

  const scrollToAnalysis = () => {
    document.getElementById('ai-analysis')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="text-ink">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="truncate text-2xl font-bold tracking-tight" title={session.keyword}>
                {session.keyword}
              </h1>
              <Badge variant="default" className="capitalize">{session.status}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <MetaItem label="Marketplace" value={session.marketplace} />
              <MetaItem label="Type" value={session.productType ?? 'All'} />
              <MetaItem label="Sort" value={session.sortOrder ?? 'Relevant'} />
              <MetaItem label="Generated" value={formatDate(session.startedAt)} />
              <MetaItem label="Model" value={`${analysis.provider} / ${analysis.model}`} />
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" asChild>
              <a href={marketplaceUrl} target="_blank" rel="noreferrer">
                <ExternalLink /> View on Redbubble
              </a>
            </Button>
            <Button variant="ghost" disabled title="Coming soon">
              <RotateCw /> Re-run
            </Button>
            {reportPath && (
              <Button variant="secondary" onClick={() => onOpenExternal(reportPath)}>
                Open HTML report
              </Button>
            )}
            <Button onClick={onNewSearch}>New search</Button>
          </div>
        </header>

        <MetricsStrip metrics={metrics} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MarketOverview products={products} />
          <TrendVelocity />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section id="ai-analysis" className="space-y-3 scroll-mt-6">
              <h2 className="text-lg font-semibold">AI analysis</h2>
              <AnalysisSections sections={sections} />
            </section>
            <ProductTabs products={products} />
          </div>
          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <AiInsightsPanel onViewAnalysis={scrollToAnalysis} />
          </aside>
        </div>
      </div>
    </div>
  );
}
