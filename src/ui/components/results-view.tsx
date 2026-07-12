import type { ResearchData } from '../api';
import { aggregateTags, computeMetrics } from '../lib/metrics';
import { parseAnalysis } from '../lib/parse-analysis';
import { Button } from './ui/button';
import { MetricsStrip } from './metrics-strip';
import { ProductGallery } from './product-gallery';
import { AnalysisSections } from './analysis-sections';
import { TagChips } from './tag-chips';

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

// In-app report viewer (Doc 005 §4.1 UI "report viewer"). Renders a completed
// session's stored data natively: context header + metrics, then the AI analysis
// as cards, copyable top tags, and the product gallery. The standalone HTML
// report (Doc 010) remains available via the secondary "Open HTML report" action.
export function ResultsView({ data, reportPath, onNewSearch, onOpenExternal }: ResultsViewProps) {
  const { session, products, analysis } = data;

  if (!session || !analysis) {
    return (
      <main className="min-h-screen bg-neutral-50 p-8 text-neutral-900">
        <div className="mx-auto max-w-5xl space-y-4">
          <p className="text-neutral-700">This research session has no reportable data.</p>
          <Button onClick={onNewSearch}>New search</Button>
        </div>
      </main>
    );
  }

  const metrics = computeMetrics(products);
  const tags = aggregateTags(products);
  const sections = parseAnalysis(analysis.response);

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight" title={session.keyword}>
              {session.keyword}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {session.marketplace} · {formatDate(session.startedAt)} · {analysis.provider} / {analysis.model}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            {reportPath && (
              <Button variant="outline" onClick={() => onOpenExternal(reportPath)}>
                Open HTML report
              </Button>
            )}
            <Button onClick={onNewSearch}>New search</Button>
          </div>
        </header>

        <MetricsStrip metrics={metrics} />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">AI analysis</h2>
          <AnalysisSections sections={sections} />
        </section>

        {tags.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Top tags</h2>
            <TagChips tags={tags} />
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Products ({products.length})</h2>
          <ProductGallery products={products} />
        </section>
      </div>
    </main>
  );
}
