import { escapeHtml } from './generate';
import type { KeywordMetrics } from '../ai/comparison-prompt';

export type ComparisonReportKeyword = {
  metrics: KeywordMetrics;
  topProducts: { rank: number | null; title: string; artistName: string | null; price: number | null; currency: string | null; url: string }[];
};

export type ComparisonReportData = {
  projectName: string;
  productType: string;
  sortOrder: string;
  generatedAt: string;
  keywords: ComparisonReportKeyword[];
  skippedKeywords: string[];
  analysis: string;
};

// Standalone multi-keyword comparison report: metrics table, top products per
// keyword, and the comparative AI analysis verbatim. Offline by construction —
// the scout pass downloads no images and references no remote resources.
export function generateComparisonHtml(data: ComparisonReportData): string {
  if (data.keywords.length === 0) {
    throw new Error('Comparison report requires at least one keyword result');
  }
  if (!data.analysis || data.analysis.trim().length === 0) {
    throw new Error('Comparison report requires the comparative analysis');
  }

  const metricsRows = data.keywords
    .map(({ metrics }) => `<tr>
      <td>${escapeHtml(metrics.keyword)}</td>
      <td>${metrics.productCount}</td>
      <td>${metrics.priceMedian ?? '—'}</td>
      <td>${metrics.uniqueArtists}</td>
      <td>${metrics.avgPortfolioSize ?? '—'}</td>
      <td>${metrics.topTags.slice(0, 6).map((tag) => escapeHtml(tag)).join(', ')}</td>
    </tr>`)
    .join('\n');

  const keywordSections = data.keywords
    .map(({ metrics, topProducts }) => `<section>
  <h3>${escapeHtml(metrics.keyword)}</h3>
  <ol>
    ${topProducts
      .map(
        (product) =>
          `<li>${product.rank !== null ? `<span class="rank">#${product.rank}</span> ` : ''}<a href="${escapeHtml(product.url)}">${escapeHtml(product.title)}</a>${
            product.artistName ? ` — ${escapeHtml(product.artistName)}` : ''
          }${product.price !== null ? ` (${product.price}${product.currency ? ` ${escapeHtml(product.currency)}` : ''})` : ''}</li>`,
      )
      .join('\n    ')}
  </ol>
</section>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(data.projectName)} — Keyword Comparison</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0 auto; max-width: 64rem; padding: 2rem 1rem; color: #1a1a1a; line-height: 1.5; }
  h1 { font-size: 1.6rem; } h2 { font-size: 1.25rem; border-bottom: 1px solid #ddd; padding-bottom: .4rem; } h3 { font-size: 1.05rem; }
  table { border-collapse: collapse; width: 100%; font-size: .9rem; }
  th, td { border: 1px solid #ddd; padding: .45rem .6rem; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; }
  .rank { display: inline-block; background: #1d4ed8; color: #fff; border-radius: 6px; padding: 0 .45rem; font-size: .85rem; }
  .analysis { white-space: pre-wrap; background: #fafafa; border: 1px solid #e2e2e2; border-radius: 8px; padding: 1rem; }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: .2rem 1rem; } dt { font-weight: 600; } dd { margin: 0; }
  section { margin-bottom: 2rem; }
</style>
</head>
<body>
<header>
  <h1>${escapeHtml(data.projectName)} — Keyword Comparison</h1>
  <dl>
    <dt>Keywords</dt><dd>${data.keywords.map((k) => escapeHtml(k.metrics.keyword)).join(' · ')}</dd>
    <dt>Product Type</dt><dd>${escapeHtml(data.productType)}</dd>
    <dt>Sort Order</dt><dd>${escapeHtml(data.sortOrder)}</dd>
    <dt>Generated</dt><dd>${escapeHtml(data.generatedAt)}</dd>
    ${data.skippedKeywords.length > 0 ? `<dt>Skipped</dt><dd>${data.skippedKeywords.map((k) => escapeHtml(k)).join(', ')} (invalid or no results)</dd>` : ''}
  </dl>
</header>
<section>
  <h2>Metrics Comparison</h2>
  <div style="overflow-x:auto"><table>
    <thead><tr><th>Keyword</th><th>Products</th><th>Median Price</th><th>Unique Artists</th><th>Avg Portfolio</th><th>Top Tags</th></tr></thead>
    <tbody>
${metricsRows}
    </tbody>
  </table></div>
</section>
<section>
  <h2>Top Products per Keyword</h2>
  ${keywordSections}
</section>
<section>
  <h2>Comparative AI Analysis</h2>
  <div class="analysis">${escapeHtml(data.analysis)}</div>
</section>
</body>
</html>
`;
}
